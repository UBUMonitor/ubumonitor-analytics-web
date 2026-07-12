use futures_util::StreamExt;
use serde::Serialize;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

const VERSION: &str = "0.0.1";
const REPO_OWNER: &str = "UBUMonitor";
const REPO_NAME: &str = "ubumonitor-analytics-api";
const SUBFOLDER: &str = "java";
const JRE_SUBFOLDER: &str = "jre";
const JRE_MAJOR_VERSION: &str = "25";

// Pasos del proceso: descargar jar, descargar jre, extraer jre -> cada uno pesa lo mismo
const TOTAL_STEPS: u32 = 3;
const STEP_WEIGHT: u32 = 100 / TOTAL_STEPS; // 33

fn file_name() -> String {
    format!("ubumonitoranalytics-{}.jar", VERSION)
}

fn release_url() -> String {
    format!(
        "https://github.com/{}/{}/releases/download/v{}/{}",
        REPO_OWNER,
        REPO_NAME,
        VERSION,
        file_name()
    )
}

#[derive(Clone, Serialize)]
struct ProgressPayload {
    percent: u32,
    finished: bool,
    error: Option<String>, // ej. "[jar] Error HTTP: 404"
}

fn emit_progress(app: &AppHandle, percent: u32, finished: bool) {
    app.emit(
        "download-progress",
        ProgressPayload {
            percent: percent.min(100),
            finished,
            error: None,
        },
    )
    .ok();
}

fn emit_error(app: &AppHandle, step: &str, message: &str) {
    app.emit(
        "download-progress",
        ProgressPayload {
            percent: 0,
            finished: false,
            error: Some(format!("[{}] {}", step, message)),
        },
    )
    .ok();
}

fn get_target_dir() -> Result<PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or("No se pudo obtener el directorio del ejecutable")?
        .to_path_buf();

    let target_dir = exe_dir.join(SUBFOLDER);
    if !target_dir.exists() {
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    Ok(target_dir)
}

fn adoptium_platform() -> Result<(&'static str, &'static str, &'static str), String> {
    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "mac"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        return Err("SO no soportado".into());
    };

    let arch = if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        return Err("Arquitectura no soportada".into());
    };

    let ext = if os == "windows" { "zip" } else { "tar.gz" };

    Ok((os, arch, ext))
}

fn jre_download_url() -> Result<String, String> {
    let (os, arch, _ext) = adoptium_platform()?;
    Ok(format!(
        "https://api.adoptium.net/v3/binary/latest/{}/ga/{}/{}/jre/hotspot/normal/eclipse?project=jdk",
        JRE_MAJOR_VERSION, os, arch
    ))
}

fn java_executable_path(jre_dir: &Path) -> PathBuf {
    if cfg!(target_os = "windows") {
        jre_dir.join("bin").join("java.exe")
    } else {
        jre_dir.join("bin").join("java")
    }
}

/// Cliente HTTP reutilizable con timeouts razonables.
fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(300)) // 5 min máx por descarga completa
        .build()
        .map_err(|e| e.to_string())
}

/// Descarga con streaming. `step_index` (0-based) indica qué paso ocupa dentro del total,
/// repartiendo el progreso global en tramos iguales de STEP_WEIGHT.
/// Si la descarga falla a mitad, se limpia el archivo parcial antes de propagar el error.
async fn download_with_progress(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    dest: &Path,
    step_index: u32,
) -> Result<(), String> {
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Error HTTP: {}", response.status()));
    }

    let total = response.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(dest).map_err(|e| e.to_string())?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut last_emit = Instant::now();
    let base_percent = step_index * STEP_WEIGHT;

    let result: Result<(), String> = async {
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            downloaded += chunk.len() as u64;

            if last_emit.elapsed().as_millis() >= 100 {
                let local_percent = if total > 0 {
                    (downloaded as f64 / total as f64) * 100.0
                } else {
                    0.0
                };
                let global_percent =
                    base_percent + ((local_percent * STEP_WEIGHT as f64) / 100.0) as u32;

                emit_progress(app, global_percent, false);
                last_emit = Instant::now();
            }
        }
        Ok(())
    }
    .await;

    if result.is_err() {
        drop(file);
        std::fs::remove_file(dest).ok(); // limpieza del archivo parcial/corrupto
    }

    result
}

fn extract_zip(archive_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let file = std::fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = match entry.enclosed_name() {
            Some(p) => dest_dir.join(p),
            None => continue,
        };

        if entry.is_dir() {
            std::fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut out_file = std::fs::File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut out_file).map_err(|e| e.to_string())?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = entry.unix_mode() {
                if !entry.is_dir() {
                    std::fs::set_permissions(&out_path, std::fs::Permissions::from_mode(mode)).ok();
                }
            }
        }
    }

    Ok(())
}

fn extract_tar_gz(archive_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let file = std::fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    archive.unpack(dest_dir).map_err(|e| e.to_string())?;
    Ok(())
}

/// El binario de Adoptium viene dentro de una carpeta (ej. jdk-25+9-jre/), la subimos un nivel.
fn flatten_single_subdir(dest_dir: &Path) -> Result<(), String> {
    let entries: Vec<_> = std::fs::read_dir(dest_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

    if entries.len() == 1 && entries[0].path().is_dir() {
        let inner = entries[0].path();
        for child in std::fs::read_dir(&inner).map_err(|e| e.to_string())? {
            let child = child.map_err(|e| e.to_string())?;
            let target = dest_dir.join(child.file_name());
            std::fs::rename(child.path(), target).map_err(|e| e.to_string())?;
        }
        std::fs::remove_dir_all(inner).map_err(|e| e.to_string())?;
    }

    Ok(())
}

async fn ensure_jar(
    app: &AppHandle,
    client: &reqwest::Client,
    target_dir: &Path,
) -> Result<PathBuf, String> {
    let jar_path = target_dir.join(file_name());

    if jar_path.exists() {
        return Ok(jar_path);
    }

    let tmp_path = target_dir.join(format!("{}.part", file_name()));
    download_with_progress(app, client, &release_url(), &tmp_path, 0).await?;
    std::fs::rename(&tmp_path, &jar_path).map_err(|e| e.to_string())?;

    Ok(jar_path)
}

async fn ensure_jre(
    app: &AppHandle,
    client: &reqwest::Client,
    target_dir: &Path,
) -> Result<PathBuf, String> {
    let jre_dir = target_dir.join(JRE_SUBFOLDER);
    let java_bin = java_executable_path(&jre_dir);

    if java_bin.exists() {
        return Ok(java_bin);
    }

    std::fs::create_dir_all(&jre_dir).map_err(|e| e.to_string())?;

    let (_os, _arch, ext) = adoptium_platform()?;
    let url = jre_download_url()?;
    let archive_path = target_dir.join(format!("jre_download.{}", ext));

    download_with_progress(app, client, &url, &archive_path, 1).await?;

    emit_progress(app, 2 * STEP_WEIGHT, false);

    let extract_result = if ext == "zip" {
        extract_zip(&archive_path, &jre_dir)
    } else {
        extract_tar_gz(&archive_path, &jre_dir)
    };

    // Limpiamos el archivo descargado tanto si la extracción tiene éxito como si falla
    std::fs::remove_file(&archive_path).ok();
    extract_result.map_err(|e| format!("Error extrayendo Java: {}", e))?;

    flatten_single_subdir(&jre_dir)?;

    if !java_bin.exists() {
        return Err("No se encontró el ejecutable java tras la extracción".into());
    }

    Ok(java_bin)
}

/// Estado compartido para guardar el proceso Java lanzado.
struct JarProcess(Mutex<Option<Child>>);

/// Helper que ignora el "poisoning" del mutex (si un hilo entró en pánico con el lock
/// tomado) en vez de propagar el pánico en cascada al llamador.
fn lock_jar_state(state: &JarProcess) -> std::sync::MutexGuard<'_, Option<Child>> {
    state
        .0
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn launch_jar(java_path: &Path, jar_path: &Path) -> Result<Child, String> {
    let mut cmd = Command::new(java_path);
    cmd.arg("-jar").arg(jar_path);

    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("No se pudo iniciar la aplicación: {}", e))?;

    // Comprobación rápida: si el proceso muere en los primeros instantes (puerto ocupado,
    // excepción en el main, etc.), lo detectamos aquí en vez de reportar éxito falso.
    std::thread::sleep(Duration::from_millis(500));
    match child.try_wait() {
        Ok(Some(status)) => Err(format!(
            "El proceso Java terminó inmediatamente (código: {:?})",
            status.code()
        )),
        Ok(None) => Ok(child), // sigue vivo, todo bien
        Err(e) => Err(format!("Error comprobando el proceso: {}", e)),
    }
}

// Guard contra invocaciones concurrentes/duplicadas de prepare_and_launch
static LAUNCH_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn prepare_and_launch(
    app: AppHandle,
    jar_state: State<'_, JarProcess>,
) -> Result<(), String> {
    if LAUNCH_IN_PROGRESS.swap(true, Ordering::SeqCst) {
        return Err("La preparación ya está en curso".into());
    }

    // Si ya hay un proceso corriendo, no lo relanzamos.
    if lock_jar_state(&jar_state).is_some() {
        LAUNCH_IN_PROGRESS.store(false, Ordering::SeqCst);
        emit_progress(&app, 100, true);
        return Ok(());
    }

    let result = async {
        let target_dir = get_target_dir()?;
        let client = http_client()?;

        let jar_path = ensure_jar(&app, &client, &target_dir).await.map_err(|e| {
            emit_error(&app, "jar", &e);
            e
        })?;

        let java_bin = ensure_jre(&app, &client, &target_dir).await.map_err(|e| {
            emit_error(&app, "jre", &e);
            e
        })?;

        let child = launch_jar(&java_bin, &jar_path).map_err(|e| {
            emit_error(&app, "launch", &e);
            e
        })?;

        *lock_jar_state(&jar_state) = Some(child);
        emit_progress(&app, 100, true);

        Ok(())
    }
    .await;

    LAUNCH_IN_PROGRESS.store(false, Ordering::SeqCst);
    result
}

/// Mata el proceso Java si sigue vivo. Se llama al cerrar la ventana.
fn kill_jar_process(jar_state: &JarProcess) {
    if let Some(mut child) = lock_jar_state(jar_state).take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(JarProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![prepare_and_launch])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let jar_state = window.state::<JarProcess>();
                kill_jar_process(&jar_state);
            }
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
