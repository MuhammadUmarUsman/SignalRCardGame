import { v4 as uuidv4 } from "uuid";

const KEY = "cardsGame.userId";

export function getOrCreateUserId() {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const id = uuidv4();
  localStorage.setItem(KEY, id);
  return id;
}
