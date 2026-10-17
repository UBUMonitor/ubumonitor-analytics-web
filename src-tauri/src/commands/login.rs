use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Url;
use tauri::{AppHandle, Manager};

use crate::services::db;
use crate::services::moodle;

#[derive(Debug, Deserialize)]
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicSiteInfo {
    pub site: SiteInfo,
}

#[derive(Debug, Deserialize, Serialize)]
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

impl From<PublicConfig> for PublicSiteInfo {
    fn from(c: PublicConfig) -> Self {
        let type_of_login = match c.typeoflogin {
            1 => "APP",
            2 => "BROWSER",
            3 => "EMBEDDED",
            _ => "UNKNOWN",
        };

        PublicSiteInfo {
            site: SiteInfo {
                site_name: c.sitename,
                site_version: None,
                site_url: c.wwwroot,
                type_of_login: type_of_login.to_string(),
                launch_url: c.launchurl.filter(|u| !u.is_empty()),
                enable_mobile_web_service: c.enablemobilewebservice.map(|v| v != 0),
                enable_web_services: c.enablewebservices.map(|v| v != 0),
                maintenance_enabled: c.maintenanceenabled.map(|v| v != 0),
                maintenance_message: c.maintenancemessage.filter(|m| !m.is_empty()),
            },
        }
    }
}

fn parse_host(host: String) -> Result<Url, String> {
    Url::parse(host.trim()).map_err(|e| format!("invalid host: {e}"))
}

#[tauri::command]
pub async fn get_public_config(host: String) -> Result<PublicSiteInfo, String> {
    let host_url = parse_host(host)?;
    moodle::set_host(host_url)?;

    let config: PublicConfig =
        moodle::ajax_service_no_args("tool_mobile_get_public_config").await?;

    Ok(config.into())
}

#[tauri::command]
pub async fn auth_login(
    app_handle: AppHandle,
    username: String,
    password: String,
    db_password: String,
    host: String,
) -> Result<(), String> {
    let host_url = parse_host(host)?;
    moodle::set_host(host_url.clone())?;

    moodle::login_token(&username, &password).await?;

    let db_path = get_db_path(app_handle)?;
    let db_name = format!("{}_{}.db", host_url.domain().unwrap_or("unknown"), username);

    db::open_db(db_path, &db_name, &db_password).await?;

    Ok(())
}

fn get_db_path(app_handle: AppHandle) -> Result<PathBuf, String> {
    let db_path = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Could not get the local data directory: {}", e))?
        .join("db");

    if !db_path.exists() {
        std::fs::create_dir_all(&db_path)
            .map_err(|e| format!("Could not create local data directory {:?}: {}", db_path, e))?;
    }

    Ok(db_path)
}
