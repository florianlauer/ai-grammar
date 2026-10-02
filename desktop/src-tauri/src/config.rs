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
    // A file that doesn't parse is kept aside, so the defaults saved next don't replace it.
    pub fn load(path: &PathBuf) -> Config {
        // bytes, so a file that isn't UTF-8 counts as one that doesn't parse; one that can't be
        // read at all is kept aside too
        let parsed = match std::fs::read(path) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Config::default(),
            Err(e) => Err(e.to_string()),
            Ok(bytes) => serde_json::from_slice(&bytes).map_err(|e| e.to_string()),
        };
        parsed.unwrap_or_else(|e| {
            let aside = path.with_extension("json.broken");
            eprintln!("couldn't read the settings ({e}), kept as {}", aside.display());
            let _ = std::fs::rename(path, aside);
            Config::default()
        })
    }

    pub fn save(&self, path: &PathBuf) -> std::io::Result<()> {
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        // through a temporary file, so a crash mid-write doesn't leave half a config
        let temporary = path.with_extension("json.tmp");
        std::fs::write(&temporary, serde_json::to_string_pretty(self).unwrap_or_default())?;
        std::fs::rename(&temporary, path)
    }

    pub fn allows(&self, app: &App) -> bool {
        !self.disabled_apps.contains(&app.id)
    }
}
