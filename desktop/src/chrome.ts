// The few chrome.* calls the extension's settings code makes, answered by the app, so
// src/settings.ts and the options page run unchanged. Imported first by every page.
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { version } from "../src-tauri/tauri.conf.json";
import { getConfig, saveConfig } from "./api.ts";

type Listener = (changes: object, area: string) => void;
const listeners = new Set<Listener>();
listen("config", () => listeners.forEach((listener) => listener({}, "sync")));

const load = (body: object) =>
  invoke("ollama_generate", { channel: "switch", body: { prompt: "", stream: false, ...body } });

const sendMessage = async ({ type, data }: { type: string; data?: { from: string | null; to: string } }) => {
  if (type === "ollama.list") {
    return invoke<string[]>("ollama_models").then(
      (names) => ({ models: names.map((name) => ({ name })) }),
      () => null,
    );
  }
  if (type === "ollama.switch" && data) {
    // as in the extension: free the previous model, then load the new one
    await (data.from ? load({ model: data.from, keep_alive: 0 }) : null)?.catch(() => {});
    return load({ model: data.to, keep_alive: -1 }).then(
      () => ({ ok: true }),
      (e) => ({ error: String(e) }),
    );
  }
  return null;
};

globalThis.chrome = {
  storage: {
    sync: {
      get: async (defaults: object) => ({ ...defaults, ...(await getConfig()).core }),
      set: (changes: object) => saveConfig({ core: changes }),
    },
    onChanged: {
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
    },
  },
  runtime: { getManifest: () => ({ version }), sendMessage },
} as unknown as typeof chrome;
