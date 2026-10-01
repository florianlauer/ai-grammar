// One thread owns every accessibility call: COM objects on Windows can't leave the thread
// that made them, and one slow app then only delays this thread.
// ponytail: it polls the focused field every 200 ms instead of subscribing to AX and UIA
// events, which differ per app; subscribe if polling ever costs noticeable CPU.
use crate::config::Config;
use crate::platform::{self, slice, App, Field, Platform, Rect};
use serde::Serialize;
use std::sync::mpsc::{channel, RecvTimeoutError, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const TICK: Duration = Duration::from_millis(200);
// longer fields are skipped: a check would take the model too long
const MAX_LENGTH: usize = 20_000;

pub enum Command {
    // the ranges to underline in `text`, from the last check
    Marks { text: String, ranges: Vec<(usize, usize)> },
    // replaces [start, end) if it still reads `expected`
    Apply { start: usize, end: usize, replacement: String, expected: String, reply: Sender<bool> },
    // the selection of the focused field, and where it is on screen
    Selection { reply: Sender<Option<(Selection, Option<Rect>)>> },
    // None when the selection changed, Some(false) when the field refused the new text
    ReplaceSelection { selection: Selection, text: String, reply: Sender<Option<bool>> },
}

#[derive(Clone, Serialize, serde::Deserialize)]
pub struct Selection {
    pub text: String,
    pub start: usize,
    pub end: usize,
}

pub struct FieldState {
    pub text: String,
    pub frame: Rect,
    // the rects of each range, one per line
    pub marks: Vec<Vec<Rect>>,
}

pub struct Tick {
    pub app: Option<App>,
    pub field: Option<FieldState>,
    pub cursor: (f64, f64),
}

struct Worker {
    platform: Platform,
    config: Arc<Mutex<Config>>,
    field: Option<Field>,
    marks: (String, Vec<(usize, usize)>),
}

impl Worker {
    // The focused field of the frontmost app, unless it is this app or a disabled one.
    fn focused(&mut self) -> Option<(App, Option<Field>)> {
        let (app, pid) = self.platform.frontmost()?;
        if pid as u64 == std::process::id() as u64 {
            return None;
        }
        let allowed = self.config.lock().unwrap().allows(&app);
        let field = if allowed { self.platform.focused(pid) } else { None };
        Some((app, field))
    }

    fn tick(&mut self) -> Tick {
        let enabled = self.config.lock().unwrap().check_as_you_type;
        let focused = self.focused();
        let app = focused.as_ref().map(|(app, _)| app.clone());
        self.field = focused.and_then(|(_, field)| field).filter(|_| enabled);
        let field = self.field.as_ref().and_then(|f| {
            let text = f.text()?;
            if text.encode_utf16().count() > MAX_LENGTH {
                return None;
            }
            let frame = f.frame()?;
            let marks = if self.marks.0 == text {
                self.marks.1.iter().map(|&(start, end)| f.rects(start, end)).collect()
            } else {
                vec![]
            };
            Some(FieldState { text, frame, marks })
        });
        Tick { app, field, cursor: platform::cursor() }
    }

    fn handle(&mut self, command: Command) {
        match command {
            Command::Marks { text, ranges } => self.marks = (text, ranges),
            Command::Apply { start, end, replacement, expected, reply } => {
                let done = self.field.as_ref().is_some_and(|f| {
                    f.text().and_then(|t| slice(&t, start, end)).as_deref() == Some(expected.as_str())
                        && f.replace(start, end, &replacement)
                });
                let _ = reply.send(done);
            }
            Command::Selection { reply } => {
                let selection = self.focused().and_then(|(_, field)| {
                    let field = field?;
                    let (start, end) = field.selection()?;
                    let text = slice(&field.text()?, start, end)?;
                    let rect = field.bounds(start, end);
                    (!text.trim().is_empty()).then_some((Selection { text, start, end }, rect))
                });
                let _ = reply.send(selection);
            }
            Command::ReplaceSelection { selection, text, reply } => {
                let outcome = self.focused().and_then(|(_, field)| field).and_then(|f| {
                    let current = f.text().and_then(|t| slice(&t, selection.start, selection.end));
                    (current.as_deref() == Some(selection.text.as_str())).then(|| f.replace(selection.start, selection.end, &text))
                });
                let _ = reply.send(outcome);
            }
        }
    }
}

pub fn spawn(config: Arc<Mutex<Config>>, on_tick: impl Fn(Tick) + Send + 'static) -> Sender<Command> {
    let (sender, receiver) = channel();
    std::thread::spawn(move || {
        let mut worker = Worker { platform: Platform::new(), config, field: None, marks: (String::new(), vec![]) };
        let mut next = Instant::now();
        loop {
            let command = match receiver.recv_timeout(next.saturating_duration_since(Instant::now())) {
                Ok(command) => Some(command),
                Err(RecvTimeoutError::Timeout) => None,
                Err(RecvTimeoutError::Disconnected) => return,
            };
            platform::pooled(|| {
                if let Some(command) = command {
                    worker.handle(command);
                }
                if Instant::now() >= next {
                    on_tick(worker.tick());
                    next = Instant::now() + TICK;
                }
            });
        }
    });
    sender
}
