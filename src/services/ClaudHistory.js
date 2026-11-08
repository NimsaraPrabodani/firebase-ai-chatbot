import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { app } from "../FIREBASE.JS";

const auth = getAuth(app);
const db = getFirestore(app);

// Returns the user's ID, signing in anonymously only if needed.
async function getUid() {
  // IMPORTANT: wait for Firebase to restore a saved login first.
  // Without this, every page refresh would create a brand-new anonymous user
  // and your old chats would seem to disappear.
  await auth.authStateReady();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser.uid;
}

export async function saveConversation(conv) {
  const uid = await getUid();
  await setDoc(doc(db, "users", uid, "conversations", conv.id), conv);
}

export async function loadConversations() {
  const uid = await getUid();
  const snap = await getDocs(collection(db, "users", uid, "conversations"));
  return snap.docs.map((d) => d.data());
}

export async function removeConversation(convId) {
  const uid = await getUid();
  await deleteDoc(doc(db, "users", uid, "conversations", convId));
}