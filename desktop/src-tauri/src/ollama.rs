// Calls to the local Ollama server. Made from Rust so the webviews need no OLLAMA_ORIGINS.
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

const OLLAMA: &str = "http://127.0.0.1:11434";

// The request in flight per channel ("check", "rewrite"): a new one cancels the old one,
// and dropping the connection makes Ollama stop generating.
#[derive(Default)]
pub struct Requests(Mutex<HashMap<String, tokio::task::AbortHandle>>);

async fn post(body: Value) -> Result<Value, String> {
    let response = reqwest::Client::new()
        .post(format!("{OLLAMA}/api/generate"))
        .json(&body)
        .send()
        .await
        .map_err(|_| "Make sure that Ollama is installed and running.".to_string())?;
    let json: Value = response.json().await.map_err(|e| e.to_string())?;
    match json.get("error").and_then(Value::as_str) {
        Some(error) => Err(error.to_string()),
        None => Ok(json),
    }
}

#[tauri::command]
pub async fn ollama_generate(requests: State<'_, Requests>, channel: String, body: Value) -> Result<Value, String> {
    let task = tokio::spawn(post(body));
    if let Some(previous) = requests.0.lock().unwrap().insert(channel, task.abort_handle()) {
        previous.abort();
    }
    task.await.map_err(|_| "aborted".to_string())?
}

#[tauri::command]
pub async fn ollama_models() -> Result<Vec<String>, String> {
    let json: Value = reqwest::get(format!("{OLLAMA}/api/tags"))
        .await
        .map_err(|_| "Ollama isn't running.".to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(json["models"]
        .as_array()
        .map(|models| models.iter().filter_map(|m| m["name"].as_str().map(String::from)).collect())
        .unwrap_or_default())
}
