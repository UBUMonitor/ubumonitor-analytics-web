use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct DownloadProgress {
    id: String, // para distinguir JRE vs jar si descargas varios
    downloaded: u64,
    total: u64,
    percentage: f64,
}

#[derive(Clone, Serialize)]
struct DownloadError {
    id: String,
    message: String,
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    id: String,
    url: String,
    dest_path: String,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client.get(&url).send().await.map_err(|e| {
        let _ = app.emit(
            "download-error",
            DownloadError {
                id: id.clone(),
                message: e.to_string(),
            },
        );
        e.to_string()
    })?;

    let total = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut file = tokio::fs::File::create(&dest_path)
        .await
        .map_err(|e| e.to_string())?;
    let mut stream = res.bytes_stream();

    use tokio::io::AsyncWriteExt;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| {
            let _ = app.emit(
                "download-error",
                DownloadError {
                    id: id.clone(),
                    message: e.to_string(),
                },
            );
            e.to_string()
        })?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        let percentage = if total > 0 {
            (downloaded as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        app.emit(
            "download-progress",
            DownloadProgress {
                id: id.clone(),
                downloaded,
                total,
                percentage,
            },
        )
        .ok();
    }

    app.emit("download-complete", &id).ok();
    Ok(())
}
