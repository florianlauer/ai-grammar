import ollama, { GenerateResponse, Ollama } from "ollama/browser";

// One per tab and kind of request, so a new check cancels the previous check in the same
// tab but not a rewrite the user is waiting for, nor another tab's request.
type Channel = "check" | "rewrite" | "meter";
// ponytail: entries for closed tabs stay until the service worker stops, a few bytes each
const controllers = new Map<string, AbortController>();

const restart = (sender: chrome.runtime.MessageSender, channel: Channel = "check") => {
  const key = `${sender.tab?.id}:${sender.frameId}:${channel}`;
  controllers.get(key)?.abort();
  const controller = new AbortController();
  controllers.set(key, controller);
  return controller.signal;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ollamaGenerate = (
  args: Parameters<typeof ollama.generate>[0],
  signal: AbortSignal,
): Promise<GenerateResponse> => {
  const ollama = new Ollama({
    fetch: (input, init) => fetch(input, { ...init, signal }),
  });
  return ollama.generate(args).catch((e) => {
    console.warn(e);
    const message: string | undefined = (e as any)?.message;
    if (message === "unexpected server status: llm server loading model") {
      return sleep(3000).then(() => {
        if (signal.aborted) {
          throw new Error("Aborted");
        }
        return ollamaGenerate(args, signal);
      });
    }
    throw e;
  });
};

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // content scripts can't open the options page themselves
  if (request.type === "options.open") {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (request.type === "ollama.list") {
    ollama
      .list()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse(null));
    return true;
  }

  if (request.type === "ollama.generate") {
    ollamaGenerate(request.data, restart(sender, request.channel))
      .then((result) => sendResponse(result))
      // e.g. "model not found" after picking a model that isn't pulled
      .catch((e) => sendResponse({ error: String(e?.message ?? e) }));

    return true;
  }

  // Frees the previous model's memory, then loads the new one so the next check is fast.
  // The default client has no abort signal, so a check starting meanwhile can't cancel this.
  if (request.type === "ollama.switch") {
    const { from, to } = request.data as { from: string | null; to: string };
    Promise.resolve(from && ollama.generate({ model: from, prompt: "", keep_alive: 0 }))
      .catch(() => {}) // not loaded or not installed: nothing to free
      .then(() => ollama.generate({ model: to, prompt: "", keep_alive: -1 }))
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: String(e?.message ?? e) }));
    return true;
  }

  if (request.type === "gemini.supported") {
    LanguageModel.availability()
      .then(() => {
        sendResponse(true);
      })
      .catch(() => {
        sendResponse(false);
      });
    return true;
  }

  if (request.type === "gemini.generate") {
    const signal = restart(sender, request.channel);
    LanguageModel.create({ signal }).then((session) => {
      session
        .prompt(request.data.text, {
          signal,
          ...request.data,
        })
        .then((data) => {
          sendResponse(data);
        })
        .catch((e) => {
          console.warn(e);
          sendResponse(null);
        });
    })
      // aborted or unavailable before a session exists: answer anyway, or the tab waits forever
      .catch((e) => {
        console.warn(e);
        sendResponse(null);
      });

    return true;
  }
});
