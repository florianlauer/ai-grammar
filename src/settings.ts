// User settings, in chrome.storage.sync so they follow the browser account without a server.
// ponytail: sync storage caps an item at 8 KB, a few hundred dictionary words; move the
// dictionary to storage.local if people outgrow that.

export type Settings = {
  // Picked with bench/grammar-bench.mjs: best accuracy on French typos under 5 GB.
  model: string;
  // Words the extension never changes, matched as whole words with their exact case.
  dictionary: string[];
  // Hostnames where the extension stays off.
  disabledSites: string[];
};

export const defaultSettings: Settings = {
  model: "gemma4:e2b-it-qat",
  dictionary: [],
  disabledSites: [],
};

export const loadSettings = async (): Promise<Settings> => ({
  ...defaultSettings,
  ...((await chrome.storage.sync.get(defaultSettings)) as Partial<Settings>),
});

export const saveSettings = (changes: Partial<Settings>) =>
  chrome.storage.sync.set(changes);

export const onSettingsChange = (listener: (settings: Settings) => void) => {
  const handle = (_: unknown, area: string) => {
    if (area === "sync") {
      loadSettings().then(listener);
    }
  };
  chrome.storage.onChanged.addListener(handle);
  return () => chrome.storage.onChanged.removeListener(handle);
};

export const addToDictionary = async (word: string) => {
  const { dictionary } = await loadSettings();
  if (!dictionary.includes(word)) {
    await saveSettings({ dictionary: [...dictionary, word].sort((a, b) => a.localeCompare(b)) });
  }
};

export const disableSite = async (hostname: string) => {
  const { disabledSites } = await loadSettings();
  if (!disabledSites.includes(hostname)) {
    await saveSettings({ disabledSites: [...disabledSites, hostname].sort() });
  }
};
