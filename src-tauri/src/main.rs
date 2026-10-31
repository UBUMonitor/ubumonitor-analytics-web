// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{debug, error, info};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use tauri::webview::PageLoadEvent;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_log::TimezoneStrategy;

mod commands;

const JAR_RESOURCE_RELATIVE: &str = "app.jar";

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
        .arg(format!(
            "--process-monitor.parent-pid={}",
            std::process::id()
        ))
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
    let _ = spawn_java_process(&java_path, &jar_path, app)?;
    Ok(())
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
        .invoke_handler(tauri::generate_handler![
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

            Ok(())
        })
        .on_page_load(|webview, payload| {
            if let PageLoadEvent::Finished = payload.event() {
                let _ = webview.window().show();
            }
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
