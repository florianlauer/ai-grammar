// The desktop settings, in config.json next to the app's other data. The extension's own
// settings (model, dictionary, style, ignored changes) sit in `core`, read by the webviews.
use crate::platform::App;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// The browser extension already checks these, so the desktop app starts off there.
const BROWSERS: [&str; 8] = [
    "com.google.Chrome",
    "company.thebrowser.Browser",
    "com.microsoft.edgemac",
    "com.brave.Browser",
    "chrome.exe",
    "msedge.exe",
    "brave.exe",
    "arc.exe",
];

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Config {
    // level 2: underline mistakes while typing
    pub check_as_you_type: bool,
    // level 1: rewrite the selection with a shortcut
    pub shortcut_enabled: bool,
    pub shortcut: String,
    pub disabled_apps: Vec<String>,
    // apps seen with focus, so the settings can list them
    pub seen_apps: Vec<App>,
    pub core: serde_json::Value,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            check_as_you_type: true,
            shortcut_enabled: false,
            shortcut: "CmdOrCtrl+Alt+G".into(),
            disabled_apps: BROWSERS.iter().map(|s| s.to_string()).collect(),
            seen_apps: vec![],
            core: serde_json::Value::Null,
        }
    }
}

impl Config {
    pub fn load(path: &PathBuf) -> Config {
        std::fs::read_to_string(path).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default()
    }

    pub fn save(&self, path: &PathBuf) {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(path, serde_json::to_string_pretty(self).unwrap_or_default());
    }

    pub fn allows(&self, app: &App) -> bool {
        !self.disabled_apps.contains(&app.id)
    }
}
