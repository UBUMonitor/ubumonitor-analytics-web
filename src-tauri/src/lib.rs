use log::{debug, error, info, warn};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager, State};

const JAR_RESOURCE_RELATIVE: &str = "app.jar";

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    percent: u32,
    finished: bool,
    error: Option<String>,
}

fn emit_progress(app: &AppHandle, percent: u32, finished: bool) {
    debug!("progress: {}% (finished={})", percent, finished);
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
    error!("[{}] {}", step, message);
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

fn java_executable_relative() -> &'static str {
    if cfg!(target_os = "windows") {
        "jre/bin/java.exe"
    } else {
        "jre/bin/java"
    }
}

/// Resolves the bundled JAR path from app resources.
fn resolve_jar_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .resolve(JAR_RESOURCE_RELATIVE, BaseDirectory::Resource)
        .map_err(|e| format!("Could not resolve the JAR resource path: {}", e))?;

    if !path.exists() {
        return Err(format!(
            "Bundled JAR not found at expected path: {:?}",
            path
        ));
    }

    Ok(path)
}

/// Resolves the bundled JRE `java` executable path from app resources.
fn resolve_java_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .resolve(java_executable_relative(), BaseDirectory::Resource)
        .map_err(|e| format!("Could not resolve the JRE resource path: {}", e))?;

    if !path.exists() {
        return Err(format!(
            "Bundled JRE executable not found at expected path: {:?}",
            path
        ));
    }

    #[cfg(unix)]
    {
        // Executable permissions can be lost when the archive is unpacked during CI/build.
        use std::os::unix::fs::PermissionsExt;
        if let Ok(metadata) = std::fs::metadata(&path) {
            let mut perms = metadata.permissions();
            if perms.mode() & 0o111 == 0 {
                perms.set_mode(0o755);
                std::fs::set_permissions(&path, perms).ok();
            }
        }
    }

    Ok(path)
}

/// Shared state holding the launched Java process.
struct JarProcess(Mutex<Option<Child>>);

fn lock_jar_state(state: &JarProcess) -> std::sync::MutexGuard<'_, Option<Child>> {
    state.0.lock().unwrap_or_else(|poisoned| {
        warn!("JarProcess mutex was poisoned, recovering inner state");
        poisoned.into_inner()
    })
}

fn launch_jar(java_path: &Path, jar_path: &Path, app: &AppHandle) -> Result<Child, String> {
    info!("launching: {:?} -jar {:?}", java_path, jar_path);

    let app_local_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Could not get the local data directory: {}", e))?;

    if !app_local_data_dir.exists() {
        std::fs::create_dir_all(&app_local_data_dir).map_err(|e| e.to_string())?;
    }

    let mut cmd = Command::new(java_path);
    cmd.current_dir(&app_local_data_dir)
        .arg("-jar")
        .arg(jar_path);

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Could not start the application: {}", e))?;

    info!("Java process launched with PID {}", child.id());

    if let Some(stdout) = child.stdout.take() {
        let app_handle = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                info!("[java stdout] {}", line);
                app_handle.emit("java-log", &line).ok();
            }
        });
    }

    if let Some(stderr) = child.stderr.take() {
        let app_handle = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().map_while(Result::ok) {
                warn!("[java stderr] {}", line);
                app_handle.emit("java-log", &line).ok();
            }
        });
    }

    std::thread::sleep(Duration::from_millis(500));
    match child.try_wait() {
        Ok(Some(status)) => {
            let msg = format!(
                "The Java process exited immediately (code: {:?})",
                status.code()
            );
            error!("{}", msg);
            Err(msg)
        }
        Ok(None) => {
            info!("Java process is still running after the initial check");
            Ok(child)
        }
        Err(e) => {
            let msg = format!("Error checking the process: {}", e);
            error!("{}", msg);
            Err(msg)
        }
    }
}

// Guard against concurrent/duplicate invocations of prepare_and_launch
static LAUNCH_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn prepare_and_launch(
    app: AppHandle,
    jar_state: State<'_, JarProcess>,
) -> Result<(), String> {
    if LAUNCH_IN_PROGRESS.swap(true, Ordering::SeqCst) {
        warn!("prepare_and_launch is already running, ignoring new invocation");
        return Err("Setup is already in progress".into());
    }

    // If a process is already running, don't relaunch it.
    if lock_jar_state(&jar_state).is_some() {
        info!("a Java process is already running, skipping relaunch");
        LAUNCH_IN_PROGRESS.store(false, Ordering::SeqCst);
        emit_progress(&app, 100, true);
        return Ok(());
    }

    info!("=== starting prepare_and_launch ===");

    let result = (|| {
        emit_progress(&app, 20, false);

        let jar_path = resolve_jar_path(&app).map_err(|e| {
            emit_error(&app, "jar", &e);
            e
        })?;

        emit_progress(&app, 50, false);

        let java_bin = resolve_java_path(&app).map_err(|e| {
            emit_error(&app, "jre", &e);
            e
        })?;

        emit_progress(&app, 80, false);

        let child = launch_jar(&java_bin, &jar_path, &app).map_err(|e| {
            emit_error(&app, "launch", &e);
            e
        })?;

        *lock_jar_state(&jar_state) = Some(child);
        emit_progress(&app, 100, true);
        info!("=== prepare_and_launch completed successfully ===");

        Ok(())
    })();

    if let Err(ref e) = result {
        error!("=== prepare_and_launch failed: {} ===", e);
    }

    LAUNCH_IN_PROGRESS.store(false, Ordering::SeqCst);
    result
}

/// Kills the Java process if it's still running. Called when the window closes.
fn kill_jar_process(jar_state: &JarProcess) {
    if let Some(mut child) = lock_jar_state(jar_state).take() {
        info!("shutting down Java process (PID {})", child.id());
        match child.kill() {
            Ok(_) => info!("shutdown signal sent successfully"),
            Err(e) => error!("error sending shutdown signal: {}", e),
        }
        let _ = child.wait();
        info!("Java process terminated");
    } else {
        debug!("no Java process was running at shutdown");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("tauri-logs".to_string()),
                    },
                ))
                .build(),
        )
        .manage(JarProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![prepare_and_launch])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                info!("window closed by user, stopping Java backend");
                let jar_state = window.state::<JarProcess>();
                kill_jar_process(&jar_state);
            }
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
