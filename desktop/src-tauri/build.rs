use std::path::PathBuf;
use std::process::Command;

fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        system_iconv();
    }
    tauri_build::build()
}

// Rust links libiconv, and the Nix linker wrapper of devenv finds its own copy first, so the
// binary loads it from /nix/store: a signed release refuses to, and other Macs don't have it.
// The stub of the macOS SDK, found first, links the copy that ships with macOS.
fn system_iconv() {
    // xcrun outside the Nix SDK that devenv points it to
    let sdk = Command::new("/usr/bin/xcrun")
        .env_remove("DEVELOPER_DIR")
        .env_remove("SDKROOT")
        .args(["--sdk", "macosx", "--show-sdk-path"])
        .output()
        .ok()
        .filter(|out| out.status.success())
        .map(|out| PathBuf::from(String::from_utf8_lossy(&out.stdout).trim()));
    let Some(stub) = sdk.map(|sdk| sdk.join("usr/lib/libiconv.tbd")).filter(|stub| stub.exists()) else {
        println!("cargo:warning=no macOS SDK found: libiconv may be linked from /nix/store");
        return;
    };
    // only this stub, so the rest of the link keeps its libraries
    let dir = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("iconv");
    std::fs::create_dir_all(&dir).unwrap();
    // the Nix linker is older than the SDK and rejects the stub over targets it doesn't know
    let text = std::fs::read_to_string(&stub).unwrap();
    let text = ["arm64e.x1-macos", "arm64e.x1-maccatalyst"].iter().fold(text, |text, target| drop_target(&text, target));
    std::fs::write(dir.join("libiconv.tbd"), text).unwrap();
    println!("cargo:rustc-link-search=native={}", dir.display());
    println!("cargo:rerun-if-changed=build.rs");
}

// Removes `target` from the YAML lists of a .tbd stub, with the comma that separates it.
fn drop_target(text: &str, target: &str) -> String {
    let mut out = String::new();
    let mut rest = text;
    while let Some(i) = rest.find(target) {
        let head = rest[..i].trim_end();
        rest = &rest[i + target.len()..];
        match head.strip_suffix(',') {
            Some(head) => out.push_str(head),
            // first in its list: the comma comes after it
            None => {
                out.push_str(head);
                out.push(' ');
                rest = rest.trim_start().strip_prefix(',').unwrap_or(rest);
            }
        }
    }
    out + rest
}
