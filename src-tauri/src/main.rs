// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{debug, error, info, warn};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::webview::PageLoadEvent;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_log::TimezoneStrategy;

mod commands;

const JAR_RESOURCE_RELATIVE: &str = "app.jar";
const SHUTDOWN_URL: &str = "http://localhost:9090/api/public/system/shutdown";
const SHUTDOWN_REQUEST_TIMEOUT: Duration = Duration::from_secs(3);
const SHUTDOWN_WAIT_TIMEOUT: Duration = Duration::from_secs(15);
const SHUTDOWN_POLL_INTERVAL: Duration = Duration::from_millis(100);

#[derive(Default)]
struct BackendProcess {
    child: Mutex<Option<Child>>,
    shutting_down: AtomicBool,
}

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
    info!("Launching backend");

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
        .arg("-XX:+UseSerialGC")
        .arg("-XX:+AutoCreateSharedArchive")
        .arg(format!(
            "-XX:SharedArchiveFile={}",
            app_local_data_dir.join("app.jsa").display()
        ))
        .arg("-Xms64m")
        .arg("-Xmx256m")
        .arg("-Xss512k")
        .arg("-XX:TieredStopAtLevel=1")
        .arg("-XX:ReservedCodeCacheSize=64m")
        .arg("-XX:MaxMetaspaceSize=128m")
        .arg("-Xshare:auto")
        .arg("-jar")
        .arg(jar_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(debug_assertions)]
    {
        cmd.arg("--spring.profiles.active=dev");
    }

    info!("Java command: {:?}", cmd);

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
        .child
        .lock()
        .map_err(|_| "Backend state lock poisoned".to_string())?;

    // If shutdown was already requested while we were starting, kill the process right away
    if state.shutting_down.load(Ordering::SeqCst) {
        let mut child = child;
        let _ = kill_process(&mut child);
        return Err("App is shutting down, backend start aborted".to_string());
    }

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

/// Asks the backend to shut itself down via its HTTP endpoint.
async fn request_graceful_shutdown() -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(SHUTDOWN_REQUEST_TIMEOUT)
        .build()
        .map_err(|e| format!("Could not build the HTTP client: {}", e))?;

    client
        .post(SHUTDOWN_URL)
        .send()
        .await
        .map_err(|e| format!("Shutdown request failed: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Shutdown request rejected: {}", e))?;

    Ok(())
}

/// Waits until the child process exits.
/// Returns Ok(true) if it exited, Ok(false) if the timeout elapsed.
fn wait_for_exit(child: &mut Child, timeout: Duration) -> Result<bool, String> {
    let deadline = Instant::now() + timeout;

    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                info!("Backend process exited with status: {}", status);
                return Ok(true);
            }
            Ok(None) => {}
            Err(e) => return Err(format!("Could not poll the backend process: {}", e)),
        }

        if Instant::now() >= deadline {
            return Ok(false);
        }

        std::thread::sleep(SHUTDOWN_POLL_INTERVAL);
    }
}

fn shutdown_backend(app: &AppHandle) {
    let state = app.state::<BackendProcess>();
    state.shutting_down.store(true, Ordering::SeqCst);

    let child_opt = {
        let mut guard = match state.child.lock() {
            Ok(g) => g,
            Err(p) => p.into_inner(),
        };
        guard.take()
    };

    let Some(mut child) = child_opt else {
        info!("No backend process owned by this app");
        return;
    };

    info!("Shutting down backend");

    // 1. Ask the backend to shut down gracefully and wait for the process to exit.
    match tauri::async_runtime::block_on(request_graceful_shutdown()) {
        Ok(()) => {
            info!("Shutdown request accepted, waiting for the backend to exit");
            match wait_for_exit(&mut child, SHUTDOWN_WAIT_TIMEOUT) {
                Ok(true) => {
                    info!("Backend shut down gracefully");
                    return;
                }
                Ok(false) => warn!(
                    "Backend did not exit within {:?}, forcing termination",
                    SHUTDOWN_WAIT_TIMEOUT
                ),
                Err(e) => warn!("{}, forcing termination", e),
            }
        }
        Err(e) => warn!("{}, forcing termination", e),
    }

    // 2. Fallback: kill the process.
    match kill_process(&mut child) {
        Ok(()) => info!("Backend shut down successfully (forced)"),
        Err(e) => error!("Failed to guarantee backend shutdown: {}", e),
    }
}

#[tauri::command]
async fn stop_backend(app: AppHandle) {
    // Run on a blocking thread so the UI doesn't freeze while waiting.
    let _ = tauri::async_runtime::spawn_blocking(move || shutdown_backend(&app)).await;
}

fn main() {
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
        .invoke_handler(tauri::generate_handler![
            stop_backend,
            commands::open_moodle_login,
            commands::get_public_moodle_config
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn_blocking(move || {
                if let Err(e) = start_backend(&handle) {
                    error!("Backend failed to start: {}", e);
                }
            });

            // SIGINT / SIGTERM / Ctrl+C -> graceful shutdown
            let handle = app.handle().clone();
            let _ = ctrlc::set_handler(move || handle.exit(0));

            Ok(())
        })
        .on_page_load(|webview, payload| {
            if let PageLoadEvent::Finished = payload.event() {
                let _ = webview.window().show();
            }
        })
        .build(tauri::generate_context!())
        .expect("error running tauri app")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                shutdown_backend(app);
            }
        });
}
