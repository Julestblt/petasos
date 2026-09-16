#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let _ = dotenvy::from_filename("../.env");
  let _ = dotenvy::dotenv();

  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![gateway_api_key])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn gateway_api_key() -> Result<String, String> {
  std::env::var("GATEWAY_API_KEY")
    .map(|value| value.trim().to_string())
    .map_err(|_| "GATEWAY_API_KEY is not set".to_string())
    .and_then(|value| {
      if value.is_empty() {
        Err("GATEWAY_API_KEY is empty".to_string())
      } else {
        Ok(value)
      }
    })
}
