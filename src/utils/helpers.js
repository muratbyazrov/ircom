export const fmtRub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function sortItems(items, mode, favorites) {
  const out = [...items];
  if (mode === "price") out.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (mode === "date") out.sort((a, b) => (a.date || 0) - (b.date || 0));
  if (mode === "rating") out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (mode === "fav") out.sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)));
  return out;
}

export function short(text) {
  if (!text) return "";
  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

export function getTouchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function contactLabel(key) {
  if (key === "phone") return "Тел:";
  if (key === "wa") return "WA:";
  if (key === "tg") return "TG:";
  return `${key}:`;
}
