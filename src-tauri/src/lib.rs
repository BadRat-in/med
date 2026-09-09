use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, RunEvent};

struct OpenedFiles(Mutex<Vec<String>>);

#[tauri::command]
fn get_opened_files(state: tauri::State<'_, OpenedFiles>) -> Vec<String> {
    let mut guard = state.0.lock().unwrap();
    let files = guard.clone();
    guard.clear();
    files
}

fn push_opened(app: &AppHandle, paths: Vec<PathBuf>) {
    if paths.is_empty() {
        return;
    }
    let strings: Vec<String> = paths
        .into_iter()
        .filter_map(|p| p.to_str().map(|s| s.to_string()))
        .collect();
    if strings.is_empty() {
        return;
    }

    if let Some(state) = app.try_state::<OpenedFiles>() {
        let mut guard = state.0.lock().unwrap();
        for s in &strings {
            if !guard.contains(s) {
                guard.push(s.clone());
            }
        }
    }

    let _ = app.emit("med://open-files", strings);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(OpenedFiles(Mutex::new(Vec::new())))
        .invoke_handler(tauri::generate_handler![get_opened_files])
        .setup(|app| {
            // Windows / Linux: files passed as CLI args when launched via association
            #[cfg(any(windows, target_os = "linux"))]
            {
                let mut files = Vec::new();
                for arg in std::env::args().skip(1) {
                    let path = PathBuf::from(&arg);
                    if path.exists() {
                        files.push(path);
                    }
                }
                if !files.is_empty() {
                    push_opened(app.handle(), files);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building MED")
        .run(|app, event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let RunEvent::Opened { urls } = event {
                let files: Vec<PathBuf> = urls
                    .into_iter()
                    .filter_map(|u| u.to_file_path().ok())
                    .collect();
                push_opened(app, files);
            }
        });
}
