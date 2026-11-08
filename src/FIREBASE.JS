import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,

};

console.log("Firebase configuration file loaded!");
console.log("Development mode:", import.meta.env.DEV);

export const app = initializeApp(firebaseConfig);

// --- App Check ---
// On localhost (npm run dev) we use a DEBUG token instead of reCAPTCHA.
// This line MUST run before initializeAppCheck().
if (import.meta.env.DEV) {
  // `true` makes the SDK print a new token in the browser console.
  // Once you've registered a token, put it in .env and it is reused.
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = 
    import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
}

console.log(
  "App Check Debug Token:",
  self.FIREBASE_APPCHECK_DEBUG_TOKEN
);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || "dev-placeholder"
  ),
  isTokenAutoRefreshEnabled: true,
});

// --- Firebase AI Logic + Gemini ---
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Change the model name here only. Check Firebase's "supported models"
// page occasionally, because older models get retired.
export const MODEL_NAME = "gemini-3.5-flash";

export const model = getGenerativeModel(ai, {
  model: MODEL_NAME,
  systemInstruction:
    "You are a friendly, helpful assistant. Keep answers clear and well organized.",
});