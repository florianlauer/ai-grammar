// The settings window: the extension's options page, then the sections only the app has.
import "./chrome.ts";
import "../../src/options/index.ts";
import "./settings.css";
import { invoke } from "@tauri-apps/api/core";
import { getConfig, onConfig, saveConfig, type App, type Config } from "./api.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let config: Config = await getConfig();
let running: App[] = [];

const renderApps = () => {
  const apps = [...config.seenApps].sort((a, b) => a.name.localeCompare(b.name));
  $("apps").replaceChildren(
    ...apps.map((app) => {
      const box = Object.assign(document.createElement("input"), { type: "checkbox", checked: !config.disabledApps.includes(app.id) });
      box.addEventListener("change", () =>
        saveConfig({
          disabledApps: box.checked ? config.disabledApps.filter((id) => id !== app.id) : [...config.disabledApps, app.id],
        }),
      );
      const label = Object.assign(document.createElement("label"), { className: "opt__check" });
      label.append(box, app.name || app.id);
      const id = Object.assign(document.createElement("span"), { className: "opt__meta", textContent: app.id });
      // forgotten until it's typed in again, then back on like any new app
      const remove = Object.assign(document.createElement("button"), {
        type: "button",
        className: "aig-link",
        textContent: "Remove",
        ariaLabel: `Remove ${app.name || app.id}`,
      });
      remove.addEventListener("click", () =>
        saveConfig({
          seenApps: config.seenApps.filter(({ id }) => id !== app.id),
          disabledApps: config.disabledApps.filter((id) => id !== app.id),
        }),
      );
      const item = document.createElement("li");
      item.append(label, id, remove);
      return item;
    }),
  );
  // the open apps that aren't listed yet
  const listed = new Set(config.seenApps.map((app) => app.id));
  const options = running.filter((app) => !listed.has(app.id)).sort((a, b) => a.name.localeCompare(b.name));
  $("running").replaceChildren(...options.map((app) => new Option(app.name, app.id)));
  $<HTMLButtonElement>("add-app").disabled = options.length === 0;
};

const render = () => {
  $<HTMLInputElement>("check").checked = config.checkAsYouType;
  $<HTMLInputElement>("shortcut-enabled").checked = config.shortcutEnabled;
  $<HTMLInputElement>("shortcut").value = config.shortcut;
  $<HTMLInputElement>("shortcut").disabled = !config.shortcutEnabled;
  renderApps();
};

const loadRunning = async () => {
  running = await invoke<App[]>("running_apps");
  renderApps();
};

const checkPermission = async () => {
  $("permission").hidden = await invoke<boolean>("permission", { prompt: false });
};

$("check").addEventListener("change", (e) => saveConfig({ checkAsYouType: (e.target as HTMLInputElement).checked }));
$("shortcut-enabled").addEventListener("change", (e) => saveConfig({ shortcutEnabled: (e.target as HTMLInputElement).checked }));
// accelerator syntax, e.g. CmdOrCtrl+Alt+G
$("shortcut").addEventListener("change", (e) => saveConfig({ shortcut: (e.target as HTMLInputElement).value.trim() }));
$("apps-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const app = running.find(({ id }) => id === $<HTMLSelectElement>("running").value);
  if (app && !config.seenApps.some(({ id }) => id === app.id)) {
    saveConfig({ seenApps: [...config.seenApps, app] });
  }
});
$("grant").addEventListener("click", async () => {
  await invoke("permission", { prompt: true });
  invoke("open_permission_settings");
});

onConfig((c) => {
  config = c;
  render();
});
render();
loadRunning();
// apps opened since, and access granted in System Settings, outside this window
window.addEventListener("focus", loadRunning);
checkPermission();
setInterval(checkPermission, 2000);
