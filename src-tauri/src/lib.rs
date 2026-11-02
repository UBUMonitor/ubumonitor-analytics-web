use log::{error, info};
use serde::Serialize;
use std::{
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};
use tauri::{
    path::BaseDirectory,
    webview::PageLoadEvent,
    AppHandle,
    Emitter,
    Manager,
    RunEvent,
};
use tauri_plugin_log::TimezoneStrategy;
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

mod commands;
mod error;

use error::AppError;

const BACKEND_HOST: &str = "127.0.0.1";
const BACKEND_PORT: u16 = 9090;
const JAR_RESOURCE_RELATIVE: &str = "app.jar";

#[derive(Clone, Serialize)]
#[serde(tag = "status", rename_all = "snake_case", rename_all_fields = "camelCase")]
enum SidecarStatus {
    Starting,
    Ready { api_base_url: String },
    Error { message: String },
}

struct SidecarStatusState(Mutex<SidecarStatus>);
struct BackendChild(Mutex<Option<CommandChild>>);

fn api_base_url() -> String {
    format!("http://{BACKEND_HOST}:{BACKEND_PORT}")
}

fn java_executable_relative() -> &'static str {
    if cfg!(target_os = "windows") {
        "jre/bin/java.exe"
    } else {
        "jre/bin/java"
    }
}

fn resolve_resource(app: &AppHandle, relative_path: &str) -> Result<PathBuf, AppError> {
    let path = app
        .path()
        .resolve(relative_path, BaseDirectory::Resource)
        .map_err(|error| {
            AppError(format!(
                "Could not resolve resource {relative_path}: {error}"
            ))
        })?;

    if !path.exists() {
        return Err(AppError(format!(
            "Required resource was not found: {}",
            path.display()
        )));
    }

    Ok(path)
}

fn start_backend(app: &AppHandle) -> Result<(), AppError> {
    let jar_path = resolve_resource(app, JAR_RESOURCE_RELATIVE)?;
    let java_path = resolve_resource(app, java_executable_relative())?;
    let app_local_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|error| AppError(format!("Could not get the local data directory: {error}")))?;
    std::fs::create_dir_all(&app_local_data_dir)
        .map_err(|error| AppError(format!("Could not create the local data directory: {error}")))?;

    let mut command = app
        .shell()
        .command(java_path)
        .current_dir(&app_local_data_dir)
        .args([
            "-XX:+UseSerialGC",
            "-Xms64m",
            "-Xmx256m",
            "-Xss512k",
            "-XX:TieredStopAtLevel=1",
            "-XX:ReservedCodeCacheSize=64m",
            "-XX:MaxMetaspaceSize=128m",
            "-Xshare:auto",
            "-jar",
        ])
        .arg(jar_path)
        .arg(format!("--process-monitor.parent-pid={}", std::process::id()))
        .arg(format!("--server.address={BACKEND_HOST}"))
        .arg(format!("--server.port={BACKEND_PORT}"))
        .set_process_group(true)
        .kill_on_drop(true);

    #[cfg(debug_assertions)]
    {
        command = command.arg("--spring.profiles.active=dev");
    }

    info!("Starting Java backend process");
    let (mut events, child) = command
        .spawn()
        .map_err(|error| AppError(format!("Could not start the Java backend: {error}")))?;

    let child_state = app.state::<BackendChild>();
    *child_state
        .0
        .lock()
        .map_err(|error| AppError(format!("Could not manage the backend process: {error}")))? =
        Some(child);

    let log_app = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    info!("Backend: {}", String::from_utf8_lossy(&line).trim_end())
                }
                CommandEvent::Stderr(line) => {
                    error!("Backend: {}", String::from_utf8_lossy(&line).trim_end())
                }
                CommandEvent::Terminated(payload) => {
                    error!("Backend process terminated: {payload:?}");
                    if matches!(
                        log_app
                            .state::<SidecarStatusState>()
                            .0
                            .lock()
                            .map(|status| status.clone()),
                        Ok(SidecarStatus::Starting | SidecarStatus::Ready { .. })
                    ) {
                        set_sidecar_status(
                            &log_app,
                            SidecarStatus::Error {
                                message: "The backend process stopped unexpectedly.".to_string(),
                            },
                        );
                    }
                }
                _ => {}
            }
        }
    });

    let readiness_app = app.clone();
    tauri::async_runtime::spawn(async move {
        wait_for_backend(readiness_app).await;
    });

    Ok(())
}

async fn wait_for_backend(app: AppHandle) {
    let client = match reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(1))
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(client) => client,
        Err(error) => {
            set_sidecar_status(&app, SidecarStatus::Error { message: error.to_string() });
            return;
        }
    };

    let health_url = format!("{}/api/public/system/health", api_base_url());
    let deadline = Instant::now() + Duration::from_secs(60);

    while Instant::now() < deadline {
        if matches!(
            app.state::<SidecarStatusState>()
                .0
                .lock()
                .map(|status| status.clone()),
            Ok(SidecarStatus::Error { .. })
        ) {
            return;
        }

        if let Ok(response) = client.get(&health_url).send().await {
            if response.status().is_success() {
                set_sidecar_status(
                    &app,
                    SidecarStatus::Ready {
                        api_base_url: api_base_url(),
                    },
                );
                return;
            }
        }

        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    set_sidecar_status(
        &app,
        SidecarStatus::Error {
            message: "The backend did not become ready before the startup timeout.".to_string(),
        },
    );
}

fn set_sidecar_status(app: &AppHandle, status: SidecarStatus) {
    if let Err(error) = app
        .state::<SidecarStatusState>()
        .0
        .lock()
        .map(|mut current| *current = status.clone())
    {
        error!("Could not update backend status: {error}");
        return;
    }

    let event = match status {
        SidecarStatus::Starting => return,
        SidecarStatus::Ready { .. } => "sidecar-ready",
        SidecarStatus::Error { .. } => "sidecar-error",
    };

    if let Err(error) = app.emit(event, status) {
        error!("Could not emit backend status: {error}");
    }
}

fn stop_backend(app: &AppHandle) {
    let state = app.state::<BackendChild>();
    let child = match state.0.lock() {
        Ok(mut child) => child.take(),
        Err(error) => {
            error!("Could not access backend process during shutdown: {error}");
            return;
        }
    };

    if let Some(child) = child {
        if let Err(error) = child.kill() {
            error!("Could not stop backend process: {error}");
        }
    }
}

#[tauri::command]
fn sidecar_status(state: tauri::State<'_, SidecarStatusState>) -> Result<SidecarStatus, AppError> {
    state
        .0
        .lock()
        .map(|status| status.clone())
        .map_err(|error| AppError(format!("Could not read backend status: {error}")))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SidecarStatusState(Mutex::new(SidecarStatus::Starting)))
        .manage(BackendChild(Mutex::new(None)))
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(
            tauri_plugin_log::Builder::new()
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_moodle_login,
            commands::get_public_moodle_config,
            sidecar_status
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            if let Err(error) = start_backend(&handle) {
                error!("Backend failed to start: {error}");
                set_sidecar_status(
                    &handle,
                    SidecarStatus::Error {
                        message: error.to_string(),
                    },
                );
            }
            Ok(())
        })
        .on_page_load(|webview, payload| {
            if let PageLoadEvent::Finished = payload.event() {
                let _ = webview.window().show();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if matches!(event, RunEvent::Exit) {
                stop_backend(app);
            }
        });
}
