export const fmtRub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const fmtRubCompact = new Intl.NumberFormat("ru-RU", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

export function formatCompactRub(value, { fallback = "По договору", compactThreshold = 1000000 } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return fallback;

  const fullText = fmtRub.format(amount);
  if (amount < compactThreshold) return fullText;

  return `${fmtRubCompact.format(amount)} ₽`.replace(/\s+/g, " ").trim();
}

export function sortItems(items, mode, favorites) {
  const out = [...items];
  if (mode === "price") out.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (mode === "date") {
    out.sort((a, b) => {
      const aSortDate = Number.isFinite(a.dateSortValue) ? a.dateSortValue : null;
      const bSortDate = Number.isFinite(b.dateSortValue) ? b.dateSortValue : null;

      if (aSortDate !== null && bSortDate !== null && aSortDate !== bSortDate) {
        return aSortDate - bSortDate;
      }

      const aAgeMs = Number.isFinite(a.dateAgeMs) ? a.dateAgeMs : null;
      const bAgeMs = Number.isFinite(b.dateAgeMs) ? b.dateAgeMs : null;

      if (aAgeMs !== null || bAgeMs !== null) {
        if (aAgeMs === null) return 1;
        if (bAgeMs === null) return -1;
        return aAgeMs - bAgeMs;
      }

      return (a.date || 0) - (b.date || 0);
    });
  }
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

export function formatAbsoluteDate(value, { withTime = false } = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPluralForm(value, one, few, many) {
  const abs = Math.abs(Number(value)) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function formatListingPostedAt(createdAt, daysAgo, importDate) {
  const sourceDate = importDate || createdAt;
  const date = new Date(sourceDate);
  if (Number.isNaN(date.getTime())) {
    const importedDateText = formatAbsoluteDate(importDate);
    if (importedDateText) return importedDateText;

    const numericDays = Number.isFinite(Number(daysAgo)) ? Math.max(0, Math.floor(Number(daysAgo))) : 0;
    return `${numericDays} дн. назад`;
  }

  const now = new Date();
  const deltaMs = Math.max(0, now.getTime() - date.getTime());
  const minuteMs = 60000;
  const hourMs = 3600000;
  const dayMs = 86400000;
  const minutes = Math.floor(deltaMs / minuteMs);
  const hours = Math.floor(deltaMs / hourMs);
  const remainingMinutes = Math.floor((deltaMs % hourMs) / minuteMs);

  if (deltaMs < minuteMs) return "только что";

  if (deltaMs < hourMs) {
    return `${minutes} ${getPluralForm(minutes, "минуту", "минуты", "минут")} назад`;
  }

  if (isSameDay(now, date) && deltaMs < dayMs) {
    if (hours < 6) {
      if (remainingMinutes > 0) {
        return `${hours} ${getPluralForm(hours, "час", "часа", "часов")} ${remainingMinutes} ${getPluralForm(remainingMinutes, "минуту", "минуты", "минут")} назад`;
      }

      return `${hours} ${getPluralForm(hours, "час", "часа", "часов")} назад`;
    }

    return `сегодня в ${formatTime(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(yesterday, date)) return `вчера в ${formatTime(date)}`;

  return formatAbsoluteDate(date);
}
