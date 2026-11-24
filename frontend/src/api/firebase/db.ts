import { get, onValue, push, ref, set } from "firebase/database";
import { firebaseDb } from "./config";

export const createSession = async () => {
  const sessionListRef = ref(firebaseDb, "sessions");
  const newSessionRef = push(sessionListRef);
  await set(newSessionRef, {
    timestamp: new Date().toUTCString(),
  });
  return newSessionRef.key;
};

export const isSessionValid = async (key: string) => {
  const sessionRef = ref(firebaseDb, `sessions/${key}`);
  const snapshot = await get(sessionRef);
  const exists = snapshot.exists();
  if (exists) console.log("EXISTS");
  else console.log("NOT");
  return exists;
};

export const sendMessage = async (key: string, message: string) => {
  const messagesRef = ref(firebaseDb, `sessions/${key}/messages`);
  const messageRef = push(messagesRef);
  await set(messageRef, {
    message,
  });
};

export const listenToMessages = (
  key: string,
  onSnapshot: (val: unknown) => void
) => {
  const messagesRef = ref(firebaseDb, `sessions/${key}/messages`);
  return onValue(messagesRef, (snapshot) => {
    const value = snapshot.val();
    onSnapshot(value);
  });
};
