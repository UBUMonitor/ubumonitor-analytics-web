use serde::Serialize;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[derive(Serialize, Clone)]
struct CookieInfo {
    name: String,
    value: String,
    domain: Option<String>,
    path: Option<String>,
    secure: Option<bool>,
    http_only: Option<bool>,
}

#[derive(Serialize, Clone)]
struct MoodleLoginPayload {
    url: String,
    cookies: Vec<CookieInfo>,
}

#[tauri::command]
pub async fn open_moodle_login(app: tauri::AppHandle, login_url: String) -> tauri::Result<()> {
    let app_handle = app.clone();
    let token_received = Arc::new(AtomicBool::new(false));
    let token_received_nav = token_received.clone();
    let token_received_close = token_received.clone();

    let app_handle_close = app.clone();

    let cookie_url = login_url.parse::<tauri::Url>().unwrap();

    WebviewWindowBuilder::new(
        &app,
        "moodle-login",
        WebviewUrl::External(login_url.parse().unwrap()),
    )
    .center()
    .title("Login Moodle")
    .on_navigation(move |url| {
        if url.scheme() == "moodlemobile" {
            let full_url = url.as_str().to_string();
            token_received_nav.store(true, Ordering::SeqCst);

            let app_handle = app_handle.clone();
            let cookie_url = cookie_url.clone();

            tauri::async_runtime::spawn(async move {
                if let Some(win) = app_handle.get_webview_window("moodle-login") {
                    let cookies = win
                        .cookies_for_url(cookie_url)
                        .unwrap_or_default()
                        .into_iter()
                        .map(|c| CookieInfo {
                            name: c.name().to_string(),
                            value: c.value().to_string(),
                            domain: c.domain().map(|d| d.to_string()),
                            path: c.path().map(|p| p.to_string()),
                            secure: c.secure(),
                            http_only: c.http_only(),
                        })
                        .collect::<Vec<_>>();

                    let payload = MoodleLoginPayload {
                        url: full_url,
                        cookies,
                    };

                    let _ = app_handle.emit("moodle-token-received", payload);
                    let _ = win.close();
                }
            });

            return false;
        }
        true
    })
    .build()
    .unwrap()
    .on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if !token_received_close.load(Ordering::SeqCst) {
                let _ = app_handle_close.emit("moodle-login-cancelled", ());
            }
        }
    });

    Ok(())
}
