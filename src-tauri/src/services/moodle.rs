// src-tauri/src/services/api.rs
use std::{
    sync::{LazyLock, RwLock},
    time::Duration,
};

use reqwest::{Client, Url};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{json, Value};

static HTTP: LazyLock<Client> = LazyLock::new(|| {
    Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .expect("HTTP client could not be created")
});

static HOST: RwLock<Option<String>> = RwLock::new(None);
static TOKEN: RwLock<Option<String>> = RwLock::new(None);

/// Validates and stores the Moodle host globally.
pub fn set_host(host: Url) -> Result<(), String> {
    // Normalize: remove the trailing slash (keeps subfolders like /moodle)
    let normalized = host.as_str().trim_end_matches('/').to_string();

    *HOST.write().map_err(|e| e.to_string())? = Some(normalized);
    Ok(())
}

fn ajax_service_url() -> Result<String, String> {
    let host = HOST.read().map_err(|e| e.to_string())?;
    host.as_ref()
        .map(|h| format!("{h}/lib/ajax/service.php"))
        .ok_or_else(|| "host not configured".to_string())
}

fn login_token_url() -> Result<String, String> {
    let host = HOST.read().map_err(|e| e.to_string())?;
    host.as_ref()
        .map(|h| format!("{h}/login/token.php"))
        .ok_or_else(|| "host not configured".to_string())
}

#[derive(Debug, Serialize)]
struct AjaxRequest<'a, A: Serialize> {
    methodname: &'a str,
    args: A,
}

#[derive(Debug, Deserialize)]
struct AjaxResponse<T> {
    error: bool,
    data: Option<T>,
    exception: Option<Value>,
}

/// Generic call: `T` is the type of the `data` field in the response.
pub async fn ajax_service<T, A>(methodname: &str, args: A) -> Result<T, String>
where
    T: DeserializeOwned,
    A: Serialize,
{
    let url = ajax_service_url()?;
    let body = [AjaxRequest { methodname, args }];

    let mut responses: Vec<AjaxResponse<T>> = async {
        HTTP.post(url)
            .json(&body)
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
        return Err(format!(
            "moodle error: {}",
            first.exception.map(|e| e.to_string()).unwrap_or_default()
        ));
    }

    first
        .data
        .ok_or_else(|| "response without data".to_string())
}

/// Convenience wrapper for calls without arguments: args = {}
pub async fn ajax_service_no_args<T: DeserializeOwned>(methodname: &str) -> Result<T, String> {
    ajax_service(methodname, json!({})).await
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    token: Option<String>,
    // Present when login fails (HTTP status is still 200)
    error: Option<String>,
    errorcode: Option<String>,
}

pub async fn login_token(username: &str, password: &str) -> Result<(), String> {
    let url = login_token_url()?;

    // token.php expects application/x-www-form-urlencoded, not JSON
    let response: TokenResponse = async {
        HTTP.post(url)
            .form(&[
                ("username", username),
                ("password", password),
                ("service", "moodle_mobile_app"),
            ])
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
    }
    .await
    .map_err(|e: reqwest::Error| e.to_string())?;

    if let Some(error) = response.error {
        return Err(match response.errorcode {
            Some(code) => format!("{error} ({code})"),
            None => error,
        });
    }

    let token = response
        .token
        .ok_or_else(|| "response without token".to_string())?;

    *TOKEN.write().map_err(|e| e.to_string())? = Some(token.clone());

    Ok(())
}
