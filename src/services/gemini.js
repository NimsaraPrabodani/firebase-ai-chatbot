import { model } from "../FIREBASE.JS";

const TIMEOUT_MS = 30000;

// Gemini wants history as: [{ role: "user" | "model", parts: [{ text }] }]
// If a message failed, we also drop the user message that caused it,
// so history always alternates user → model correctly.
function toHistory(messages) {
  const history = [];
  for (const m of messages) {
    if (m.isError) {
      history.pop();
      continue;
    }
    history.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    });
  }
  return history;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// previousMessages = everything BEFORE the new question (this gives context)
export async function askGemini(previousMessages, userText) {
  const chat = model.startChat({ history: toHistory(previousMessages) });
  const result = await withTimeout(chat.sendMessage(userText), TIMEOUT_MS);
  return result.response.text();
}

// Turn technical errors into friendly messages
export function friendlyError(err) {
  const msg = String(err?.message || err).toLowerCase();

  if (!navigator.onLine || msg.includes("failed to fetch") || msg.includes("network")) {
    return "I can't reach the server. Please check your internet connection and try again.";
  }
  if (msg.includes("timeout")) {
    return "The request took too long. Please try again.";
  }
  if (msg.includes("app check") || msg.includes("appcheck") || msg.includes("403")) {
    return "Security check failed (App Check). If you're developing locally, make sure your debug token is registered.";
  }
  if (msg.includes("api key") || msg.includes("401") || msg.includes("permission") || msg.includes("api-not-enabled")) {
    return "The AI service rejected the request. Check that Firebase AI Logic is enabled for this project.";
  }
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
    return "Too many requests right now. Please wait a moment and try again.";
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return "The AI model wasn't found. The model name in firebase.js may need updating.";
  }
  return "Something went wrong while generating a reply. Please try again.";
}