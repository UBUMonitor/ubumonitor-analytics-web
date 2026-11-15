use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::LazyLock;
use std::time::Duration;
use tauri::async_runtime::channel;
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindowBuilder, WindowEvent};

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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CookieInfo {
    name: String,
    value: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoodleLoginPayload {
    url: String,
    cookies: Vec<CookieInfo>,
}

type LoginResult = Result<MoodleLoginPayload, String>;

#[tauri::command]
pub async fn open_moodle_login(
    app: AppHandle,
    login_url: String,
) -> Result<MoodleLoginPayload, String> {
    let parsed: Url = login_url
        .parse()
        .map_err(|e| format!("invalid login url: {e}"))?;

    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(format!("unsupported url scheme: {}", parsed.scheme()));
    }

    if let Some(existing) = app.get_webview_window("moodle-login") {
        let _ = existing.set_focus();
        return Err("login already in progress".to_string());
    }

    // Only the first message is read; any later ones are dropped.
    let (tx, mut rx) = channel::<LoginResult>(4);
    let tx_nav = tx.clone();
    let app_nav = app.clone();
    let cookie_url = parsed.clone();

    let window = WebviewWindowBuilder::new(&app, "moodle-login", WebviewUrl::External(parsed))
        .center()
        .on_document_title_changed(|window, title| {
            let _ = window.set_title(&title);
        })
        .on_navigation(move |url| {
            if url.scheme() != "moodlemobile" {
                return true;
            }

            let full_url = url.to_string();
            let app = app_nav.clone();
            let cookie_url = cookie_url.clone();
            let tx = tx_nav.clone();

            // Cookies are read from an async task to avoid blocking the webview thread.
            tauri::async_runtime::spawn(async move {
                let result = match app.get_webview_window("moodle-login") {
                    Some(win) => {
                        let cookies = win
                            .cookies_for_url(cookie_url)
                            .unwrap_or_default()
                            .into_iter()
                            .map(|c| CookieInfo {
                                name: c.name().to_string(),
                                value: c.value().to_string(),
                            })
                            .collect();
                        let _ = win.close();
                        Ok(MoodleLoginPayload {
                            url: full_url,
                            cookies,
                        })
                    }
                    None => Err("login window not found".to_string()),
                };
                let _ = tx.try_send(result);
            });

            false
        })
        .build()
        .map_err(|e| format!("failed to open login window: {e}"))?;

    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            // Ignored if the token was already sent (it is read first).
            let _ = tx.try_send(Err("login cancelled".to_string()));
        }
    });

    rx.recv()
        .await
        .unwrap_or_else(|| Err("login channel closed".to_string()))
}
