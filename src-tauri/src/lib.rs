use log::{debug, error, info, warn};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

const JAR_RESOURCE_RELATIVE: &str = "app.jar";
const SERVER_PORT: u16 = 9090;

#[derive(Default)]
struct BackendProcess(Mutex<Option<Child>>);

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
        error!("Bundled JAR not found at expected path: {:?}", path);
        return Err(format!(
            "Bundled JAR not found at expected path: {:?}",
            path
        ));
    }

    debug!("Resolved JAR path: {:?}", path);
    Ok(path)
}

/// Resolves the bundled JRE `java` executable path from app resources.
fn resolve_java_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .resolve(java_executable_relative(), BaseDirectory::Resource)
        .map_err(|e| format!("Could not resolve the JRE resource path: {}", e))?;

    if !path.exists() {
        error!(
            "Bundled JRE executable not found at expected path: {:?}",
            path
        );
        return Err(format!(
            "Bundled JRE executable not found at expected path: {:?}",
            path
        ));
    }

    debug!("Resolved Java executable path: {:?}", path);
    Ok(path)
}

async fn is_server_healthy(port: u16) -> bool {
    let url = format!("http://localhost:{}/actuator/health", port);

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_millis(100))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to build HTTP client for health check: {}", e);
            return false;
        }
    };

    match client.get(&url).send().await {
        Ok(resp) if resp.status().is_success() => match resp.json::<serde_json::Value>().await {
            Ok(json) => {
                let healthy = json.get("status").and_then(|s| s.as_str()) == Some("UP");
                debug!("Health check response: {:?} (healthy = {})", json, healthy);
                healthy
            }
            Err(e) => {
                warn!("Health check response was not valid JSON: {}", e);
                false
            }
        },
        Ok(resp) => {
            debug!(
                "Health check returned non-success status: {}",
                resp.status()
            );
            false
        }
        Err(e) => {
            debug!(
                "Health check request failed (server likely not up yet): {}",
                e
            );
            false
        }
    }
}

async fn wait_for_server_healthy(port: u16, timeout_secs: u64) -> bool {
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    info!(
        "Waiting for server on port {} to become healthy (timeout: {}s)",
        port, timeout_secs
    );

    while start.elapsed() < timeout {
        if is_server_healthy(port).await {
            info!(
                "Server on port {} became healthy after {:.1}s",
                port,
                start.elapsed().as_secs_f32()
            );
            return true;
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    error!(
        "Server on port {} did not become healthy within {}s",
        port, timeout_secs
    );
    false
}

fn spawn_java_process(
    java_path: &PathBuf,
    jar_path: &PathBuf,
    app: &AppHandle,
) -> Result<Child, String> {
    info!("Launching backend: {:?} -jar {:?}", java_path, jar_path);

    let app_local_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Could not get the local data directory: {}", e))?;

    if !app_local_data_dir.exists() {
        debug!("Creating local data directory: {:?}", app_local_data_dir);
        std::fs::create_dir_all(&app_local_data_dir).map_err(|e| {
            format!(
                "Could not create local data directory {:?}: {}",
                app_local_data_dir, e
            )
        })?;
    }

    let mut cmd = Command::new(java_path);
    cmd.current_dir(&app_local_data_dir)
        .arg("-jar")
        .arg(jar_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn Java process: {}", e))?;

    info!("Java process spawned successfully (PID: {})", child.id());
    Ok(child)
}

fn kill_process(child: &mut Child) -> Result<(), String> {
    child
        .kill()
        .map_err(|e| format!("Could not terminate the backend process: {}", e))?;

    child
        .wait()
        .map_err(|e| format!("Could not wait for the backend process to terminate: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn ensure_backend_server(
    app: AppHandle,
    state: tauri::State<'_, BackendProcess>,
) -> Result<(), String> {
    info!("ensure_backend_server invoked");

    if is_server_healthy(SERVER_PORT).await {
        info!("Server on port {} is already running", SERVER_PORT);
        return Ok(());
    }

    info!("Server not detected on port {}, starting it", SERVER_PORT);

    let jar_path = resolve_jar_path(&app)?;
    let java_path = resolve_java_path(&app)?;

    let child = spawn_java_process(&java_path, &jar_path, &app)?;

    // Store the Child handle so we can guarantee termination on app close.
    {
        let mut guard = state
            .0
            .lock()
            .map_err(|_| "Backend state lock poisoned".to_string())?;
        *guard = Some(child);
    }

    if wait_for_server_healthy(SERVER_PORT, 20).await {
        Ok(())
    } else {
        Err("Server did not report healthy status within the timeout.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(BackendProcess::default())
        .invoke_handler(tauri::generate_handler![ensure_backend_server])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app_handle = window.app_handle();

                // Only take the child if we actually launched one.
                let child_opt = {
                    let state = app_handle.state::<BackendProcess>();
                    let mut guard = state.0.lock().unwrap();
                    guard.take()
                };

                let Some(mut child) = child_opt else {
                    // We never started a backend process (it was already
                    // running before this app launched) — nothing to do.
                    info!("No backend process owned by this app instance, closing normally");
                    return;
                };

                // Prevent the window from closing immediately: we need to
                // await the shutdown before the app actually exits.
                api.prevent_close();
                info!("Close requested: shutting down backend before exiting");

                match kill_process(&mut child) {
                    Ok(()) => {
                        info!("Backend shut down successfully, closing app");
                        app_handle.exit(0);
                    }
                    Err(err_msg) => {
                        error!("Failed to guarantee backend shutdown: {}", err_msg);

                        app_handle
                            .dialog()
                            .message(format!(
                                "The background server could not be stopped cleanly.\n\n{}\n\nYou may need to end the process manually from Task Manager / Activity Monitor.",
                                err_msg
                            ))
                            .kind(MessageDialogKind::Error)
                            .title("Shutdown error")
                            .buttons(MessageDialogButtons::Ok)
                            .blocking_show();

                        app_handle.exit(0);
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
