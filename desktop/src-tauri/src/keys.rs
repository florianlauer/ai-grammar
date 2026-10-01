// Typing and the clipboard, for apps whose fields can't be edited through accessibility,
// and for the rewrite shortcut in apps that don't expose their selection.
use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread::sleep;
use std::time::{Duration, Instant};

#[cfg(target_os = "macos")]
const COMMAND: Key = Key::Meta;
#[cfg(not(target_os = "macos"))]
const COMMAND: Key = Key::Control;

fn enigo() -> Option<Enigo> {
    Enigo::new(&Settings::default()).ok()
}

// Types over the current selection; an empty replacement deletes it. For Windows fields, and
// for Chromium ones that ignore a new AXSelectedText.
pub fn type_text(text: &str) -> bool {
    let Some(mut enigo) = enigo() else { return false };
    if text.is_empty() {
        enigo.key(Key::Backspace, Direction::Click).is_ok()
    } else {
        enigo.text(text).is_ok()
    }
}

// Cmd+letter on macOS, Ctrl+letter elsewhere.
fn command(letter: char) -> bool {
    let Some(mut enigo) = enigo() else { return false };
    let pressed = enigo.key(COMMAND, Direction::Press).is_ok() && enigo.key(Key::Unicode(letter), Direction::Click).is_ok();
    let _ = enigo.key(COMMAND, Direction::Release);
    pressed
}

// Copies the selection of the frontmost app. A marker in the clipboard tells an empty
// selection from a slow app; the user's clipboard text comes back afterwards.
// ponytail: only text is restored, an image in the clipboard is lost.
pub fn copy_selection() -> Option<String> {
    const MARKER: &str = "\u{2063}ai-grammar\u{2063}";
    let mut clipboard = arboard::Clipboard::new().ok()?;
    let previous = clipboard.get_text().ok();
    clipboard.set_text(MARKER).ok()?;
    command('c');
    let start = Instant::now();
    let mut copied = None;
    while start.elapsed() < Duration::from_millis(600) {
        sleep(Duration::from_millis(40));
        match clipboard.get_text() {
            Ok(text) if text != MARKER => {
                copied = Some(text);
                break;
            }
            _ => {}
        }
    }
    let _ = clipboard.set_text(previous.unwrap_or_default());
    copied.filter(|t| !t.trim().is_empty())
}

// Pastes over the selection of the frontmost app, then puts the user's clipboard text back.
pub fn paste(text: &str) -> bool {
    let Ok(mut clipboard) = arboard::Clipboard::new() else { return false };
    let previous = clipboard.get_text().ok();
    if clipboard.set_text(text).is_err() {
        return false;
    }
    let pasted = command('v');
    // the app reads the clipboard after it gets the keys
    sleep(Duration::from_millis(300));
    let _ = clipboard.set_text(previous.unwrap_or_default());
    pasted
}
