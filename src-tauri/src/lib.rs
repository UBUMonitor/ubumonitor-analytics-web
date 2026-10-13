use log::{debug, error, info};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::WindowEvent;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_log::TimezoneStrategy;

mod commands;

const JAR_RESOURCE_RELATIVE: &str = "app.jar";

#[derive(Default)]
struct BackendProcess(Mutex<Option<Child>>);

fn java_executable_relative() -> &'static str {
    if cfg!(target_os = "windows") {
        "jre/bin/javaw.exe"
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

fn spawn_java_process(java_path: &Path, jar_path: &Path, app: &AppHandle) -> Result<Child, String> {
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
        .arg("--spring.main.lazy-initialization=true")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(debug_assertions)]
    {
        cmd.arg("--spring.profiles.active=dev");
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn Java process: {}", e))?;

    info!("Java process spawned successfully (PID: {})", child.id());
    Ok(child)
}

fn start_backend(app: &AppHandle) -> Result<(), String> {
    let jar_path = resolve_jar_path(app)?;
    let java_path = resolve_java_path(app)?;

    let child = spawn_java_process(&java_path, &jar_path, app)?;

    let state = app.state::<BackendProcess>();
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "Backend state lock poisoned".to_string())?;
    *guard = Some(child);

    Ok(())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(
            tauri_plugin_log::Builder::new()
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(BackendProcess::default())
        .invoke_handler(tauri::generate_handler![commands::open_moodle_login])
        .setup(|app| {
            // Launch the backend as soon as the app starts.
            if let Err(e) = start_backend(app.handle()) {
                error!("Backend failed to start: {}", e);
            }

            let window = app
                .get_webview_window("main")
                .expect("Main window not found");

            let app_handle = app.handle().clone();

            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { .. } = event {
                    // Only take the child if we actually launched one.
                    let child_opt = {
                        let state = app_handle.state::<BackendProcess>();
                        let mut guard = state.0.lock().unwrap();
                        guard.take()
                    };

                    let Some(mut child) = child_opt else {
                        info!("No backend process owned by this app, closing normally");
                        return;
                    };

                    info!("Close requested: shutting down backend before exiting");

                    match kill_process(&mut child) {
                        Ok(()) => info!("Backend shut down successfully, closing app"),
                        Err(err_msg) => {
                            error!("Failed to guarantee backend shutdown: {}", err_msg)
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
