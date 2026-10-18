use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, LazyLock,
};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Url, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[derive(Deserialize)]
struct AjaxResponse {
    error: bool,
    data: Option<PublicConfig>,
    exception: Option<Value>,
}

#[derive(Deserialize)]
pub struct PublicConfig {
    pub wwwroot: String,
    pub sitename: String,
    pub typeoflogin: i32, // 1 = app, 2 = browser, 3 = embedded
    pub launchurl: Option<String>,
    pub enablemobilewebservice: Option<i32>, // 0 / 1
    pub enablewebservices: Option<i32>,      // 0 / 1
    pub maintenanceenabled: Option<i32>,     // 0 / 1
    pub maintenancemessage: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInfo {
    pub site_name: String,
    pub site_version: Option<String>, // not returned by this endpoint
    pub site_url: String,
    pub type_of_login: String,
    pub launch_url: Option<String>,
    pub enable_mobile_web_service: Option<bool>,
    pub enable_web_services: Option<bool>,
    pub maintenance_enabled: Option<bool>,
    pub maintenance_message: Option<String>,
}

impl From<PublicConfig> for SiteInfo {
    fn from(c: PublicConfig) -> Self {
        let type_of_login = match c.typeoflogin {
            1 => "APP",
            2 => "BROWSER",
            3 => "EMBEDDED",
            _ => "UNKNOWN",
        };

        SiteInfo {
            site_name: c.sitename,
            site_version: None,
            site_url: c.wwwroot,
            type_of_login: type_of_login.to_string(),
            launch_url: to_launch_url(c.launchurl),
            enable_mobile_web_service: c.enablemobilewebservice.map(|v| v != 0),
            enable_web_services: c.enablewebservices.map(|v| v != 0),
            maintenance_enabled: c.maintenanceenabled.map(|v| v != 0),
            maintenance_message: c.maintenancemessage.filter(|m| !m.is_empty()),
        }
    }
}

fn to_launch_url(launch_url: Option<String>) -> Option<String> {
    let raw = launch_url.filter(|u| !u.is_empty())?;

    let mut url = match Url::parse(&raw) {
        Ok(url) => url,
        Err(e) => {
            log::warn!("invalid launch url {raw}: {e}");
            return None;
        }
    };

    url.query_pairs_mut()
        .append_pair("service", "moodle_mobile_app")
        .append_pair("urlscheme", "moodlemobile")
        .append_pair("passport", "1");

    Some(url.into())
}

static CLIENT: LazyLock<Result<Client, String>> = LazyLock::new(|| {
    Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(30))
        .danger_accept_invalid_certs(true) // self-signed / expired / untrusted CA
        .danger_accept_invalid_hostnames(true) // hostname mismatch
        .build()
        .map_err(|e| format!("failed to build http client: {e}"))
});

#[tauri::command]
pub async fn get_public_moodle_config(host: String) -> Result<SiteInfo, String> {
    let client = CLIENT.as_ref().map_err(|e| e.clone())?;

    let mut responses: Vec<AjaxResponse> = async {
        client
            .post(format!(
                "{}/lib/ajax/service.php",
                host.trim_end_matches('/')
            ))
            .json(&json!([{ "methodname": "tool_mobile_get_public_config", "args": {} }]))
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
    }
    .await
    .map_err(|e: reqwest::Error| e.to_string())?;

    let first = responses
        .pop()
        .ok_or_else(|| "empty response".to_string())?;

    if first.error {
        let msg = first
            .exception
            .as_ref()
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .map(str::to_owned)
            .unwrap_or_else(|| "unknown error".to_string());

        return Err(format!("moodle error: {msg}"));
    }

    first
        .data
        .map(SiteInfo::from)
        .ok_or_else(|| "response without data".to_string())
}

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
pub async fn open_moodle_login(app: AppHandle, login_url: String) -> Result<(), String> {
    let parsed: Url = login_url
        .parse()
        .map_err(|e| format!("invalid login url: {e}"))?;

    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(format!("unsupported url scheme: {}", parsed.scheme()));
    }

    // Reuse the existing window instead of failing on a duplicate label.
    if let Some(existing) = app.get_webview_window("moodle-login") {
        let _ = existing.set_focus();
        return Ok(());
    }

    let token_received = Arc::new(AtomicBool::new(false));
    let token_received_nav = token_received.clone();
    let token_received_close = token_received.clone();

    let app_handle_nav = app.clone();
    let app_handle_close = app.clone();
    let cookie_url = parsed.clone();

    let window = WebviewWindowBuilder::new(&app, "moodle-login", WebviewUrl::External(parsed))
        .center()
        .on_document_title_changed(|window, title| {
            let _ = window.set_title(&title);
        })
        .on_navigation(move |url| {
            if url.scheme() == "moodlemobile" {
                // Only handle the first redirect; ignore duplicates.
                if token_received_nav.swap(true, Ordering::SeqCst) {
                    return false;
                }

                let full_url = url.as_str().to_string();
                let app_handle = app_handle_nav.clone();
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
        .map_err(|e| format!("failed to open login window: {e}"))?;

    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            if !token_received_close.load(Ordering::SeqCst) {
                let _ = app_handle_close.emit("moodle-login-cancelled", ());
            }
        }
    });

    Ok(())
}
