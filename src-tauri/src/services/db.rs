use std::{path::PathBuf, sync::LazyLock};

use rusqlite::Connection;
use tauri::async_runtime::Mutex;

static CONNECTION: LazyLock<Mutex<Option<Connection>>> = LazyLock::new(|| Mutex::new(None));

pub async fn open_db(db_path: PathBuf, db_name: &str, db_password: &str) -> Result<(), String> {
    let conn = Connection::open(db_path.join(db_name)).map_err(|e| format!("invalid host: {e}"))?;

    conn.pragma_update(None, "key", db_password)
        .map_err(|e| format!("invalid host: {e}"))?;

    conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(()))
        .map_err(|e| format!("invalid host: {e}"))?;

    let version: Option<String> = conn
        .query_row("PRAGMA cipher_version", [], |row| row.get(0))
        .ok();
    println!("{:?}", version);

    *CONNECTION.lock().await = Some(conn);
    Ok(())
}

pub fn close_db() {
    *CONNECTION.blocking_lock() = None;
}
