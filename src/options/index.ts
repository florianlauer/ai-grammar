import type { ListResponse } from "ollama/browser";
import "../contentScript/overlay.css";
import "./options.css";
import {
  addToDictionary,
  disableSite,
  loadSettings,
  onSettingsChange,
  saveSettings,
  Settings,
} from "../settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

document.querySelector("main")!.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
$("version").textContent = `Version ${chrome.runtime.getManifest().version}`;

// Accepts a pasted URL as well as a bare hostname.
const hostnameOf = (value: string) => {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname;
  } catch {
    return null;
  }
};

const renderList = ({
  list,
  items,
  onRemove,
}: {
  list: HTMLUListElement;
  items: string[];
  onRemove: (item: string) => void;
}) => {
  list.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = item;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "aig-link";
      remove.textContent = "Remove";
      remove.ariaLabel = `Remove ${item}`;
      remove.addEventListener("click", () => onRemove(item));
      li.append(label, remove);
      return li;
    }),
  );
};

const bindAdd = ({
  form,
  parse,
  onAdd,
}: {
  form: HTMLFormElement;
  parse: (value: string) => string | null;
  onAdd: (item: string) => void;
}) => {
  const input = form.elements.namedItem("value") as HTMLInputElement;
  input.addEventListener("input", () => input.setCustomValidity(""));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const item = parse(input.value.trim());
    if (!item) {
      input.setCustomValidity("That doesn't look like a site.");
      input.reportValidity();
      return;
    }
    onAdd(item);
    input.value = "";
  });
};

let settings: Settings;
let models: string[] | null = null;

const renderModel = () => {
  const select = $<HTMLSelectElement>("model");
  const names = models ?? [];
  const options = names.includes(settings.model) ? names : [settings.model, ...names];
  select.replaceChildren(
    ...options.map((name) => {
      const option = new Option(name, name, false, name === settings.model);
      if (models && !models.includes(name)) {
        option.textContent = `${name} (not installed)`;
      }
      return option;
    }),
  );
  select.disabled = !models?.length;
  $("model-status").textContent =
    models === null
      ? "Ollama isn't reachable, so the extension uses the model built into Chrome. Start Ollama to pick a model here."
      : models.length === 0
        ? "Ollama is running but has no models. Pull one with “ollama pull gemma4:e2b-it-qat”."
        : "The Ollama model used for every check. Larger models are slower but catch more.";
};

const render = () => {
  renderModel();
  renderList({
    list: $("dictionary"),
    items: settings.dictionary,
    onRemove: (word) => saveSettings({ dictionary: settings.dictionary.filter((w) => w !== word) }),
  });
  renderList({
    list: $("sites"),
    items: settings.disabledSites,
    onRemove: (site) => saveSettings({ disabledSites: settings.disabledSites.filter((s) => s !== site) }),
  });
};

$<HTMLSelectElement>("model").addEventListener("change", (e) =>
  saveSettings({ model: (e.target as HTMLSelectElement).value }),
);
bindAdd({
  form: $("dictionary-form"),
  parse: (value) => value || null,
  onAdd: addToDictionary,
});
bindAdd({
  form: $("sites-form"),
  parse: hostnameOf,
  onAdd: disableSite,
});

// also picks up words added from a suggestion card while this page is open
onSettingsChange((next) => {
  settings = next;
  render();
});

const init = async () => {
  settings = await loadSettings();
  render();

  const list: ListResponse | null = await chrome.runtime.sendMessage({ type: "ollama.list" });
  models = list ? list.models.map((m) => m.name).sort() : null;
  renderModel();
};

init();
