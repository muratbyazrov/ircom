export const WEEKDAY_TO_INDEX = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 };
export const INDEX_TO_WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
export const TAXI_DAY_PRESETS = ["Сегодня", "Завтра", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const TAXI_RECURRING_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const TAXI_MOSCOW_TIMEZONE = "Europe/Moscow";

const TAXI_MOSCOW_OFFSET_MINUTES = 3 * 60;
const TAXI_MOSCOW_OFFSET_MS = TAXI_MOSCOW_OFFSET_MINUTES * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toMoscowShiftedDate = (value) => {
  const date = toValidDate(value);
  if (!date) return null;
  return new Date(date.getTime() + TAXI_MOSCOW_OFFSET_MS);
};

const buildCalendarDate = ({ year, month, day }) => new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

const getCalendarParts = (date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  weekday: date.getUTCDay(),
});

const addCalendarDays = (parts, diff) => {
  const date = buildCalendarDate(parts);
  date.setUTCDate(date.getUTCDate() + diff);
  return getCalendarParts(date);
};

const getMoscowDateTimeParts = (value = new Date()) => {
  const shifted = toMoscowShiftedDate(value);
  if (!shifted) return null;

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
};

const getCalendarDayDiff = (left, right) => (
  Math.round(
    (Date.UTC(left.year, left.month - 1, left.day) - Date.UTC(right.year, right.month - 1, right.day)) / DAY_MS
  )
);

const formatMoscowDate = (value, options) => {
  const shifted = toMoscowShiftedDate(value);
  if (!shifted) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    ...options,
  }).format(shifted);
};

const buildDateFromMoscowParts = ({ year, month, day, hours = 0, minutes = 0 }) => {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || !Number.isInteger(parsedDay)) return null;
  if (!Number.isInteger(parsedHours) || !Number.isInteger(parsedMinutes)) return null;
  if (parsedMonth < 1 || parsedMonth > 12 || parsedDay < 1 || parsedDay > 31) return null;
  if (parsedHours < 0 || parsedHours > 23 || parsedMinutes < 0 || parsedMinutes > 59) return null;

  const utcMs = Date.UTC(parsedYear, parsedMonth - 1, parsedDay, parsedHours, parsedMinutes, 0, 0) - TAXI_MOSCOW_OFFSET_MS;
  const shifted = new Date(utcMs + TAXI_MOSCOW_OFFSET_MS);
  if (
    shifted.getUTCFullYear() !== parsedYear
    || shifted.getUTCMonth() + 1 !== parsedMonth
    || shifted.getUTCDate() !== parsedDay
    || shifted.getUTCHours() !== parsedHours
    || shifted.getUTCMinutes() !== parsedMinutes
  ) {
    return null;
  }

  return new Date(utcMs);
};

const parseTaxiIsoValue = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?(?:([zZ]|[+-]\d{2}:\d{2}))?$/
  );
  if (!isoMatch) return null;

  if (isoMatch[7]) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return buildDateFromMoscowParts({
    year: isoMatch[1],
    month: isoMatch[2],
    day: isoMatch[3],
    hours: isoMatch[4] || 0,
    minutes: isoMatch[5] || 0,
  });
};

export const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const formatDateRu = (date) => new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(date);

export const normalizeWeekdays = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map((x) => String(x).trim()).filter((x) => x in WEEKDAY_TO_INDEX);
};

export const nextWeekdayDate = (targetWeekday, now = new Date()) => {
  const nowParts = getMoscowDateTimeParts(now);
  if (!nowParts) return null;
  const diff = (targetWeekday - nowParts.weekday + 7) % 7;
  return buildCalendarDate(addCalendarDays(nowParts, diff));
};

export const getTaxiDateByPreset = (preset, baseDate = new Date()) => {
  if (!preset) return "";

  const nowParts = getMoscowDateTimeParts(baseDate);
  if (!nowParts) return "";

  if (preset === "Сегодня") {
    return formatDateRu(buildCalendarDate(nowParts));
  }

  if (preset === "Завтра") {
    return formatDateRu(buildCalendarDate(addCalendarDays(nowParts, 1)));
  }

  const targetWeekday = WEEKDAY_TO_INDEX[preset];
  if (typeof targetWeekday !== "number") return "";
  const targetDate = nextWeekdayDate(targetWeekday, baseDate);
  return targetDate ? formatDateRu(targetDate) : "";
};

export const parseTaxiDateTimeInputInMoscow = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  const localDateTimeMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!localDateTimeMatch) return null;

  return buildDateFromMoscowParts({
    year: localDateTimeMatch[1],
    month: localDateTimeMatch[2],
    day: localDateTimeMatch[3],
    hours: localDateTimeMatch[4],
    minutes: localDateTimeMatch[5],
  });
};

export const parseTaxiWhenValue = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return null;

  const parsedIsoValue = parseTaxiIsoValue(text);
  if (parsedIsoValue) return parsedIsoValue;

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const nowParts = getMoscowDateTimeParts(baseDate);
  if (!nowParts) return null;

  let dateParts = nowParts;

  const dateInBrackets = text.match(/\((\d{2})\.(\d{2})\.(\d{4})\)/);
  if (dateInBrackets) {
    dateParts = {
      year: Number(dateInBrackets[3]),
      month: Number(dateInBrackets[2]),
      day: Number(dateInBrackets[1]),
    };
  } else if (text.startsWith("Сегодня")) {
    dateParts = nowParts;
  } else if (text.startsWith("Завтра")) {
    dateParts = addCalendarDays(nowParts, 1);
  } else {
    const weekdayMatch = text.match(/^(Вс|Пн|Вт|Ср|Чт|Пт|Сб)\b/);
    if (weekdayMatch) {
      const nextDate = nextWeekdayDate(WEEKDAY_TO_INDEX[weekdayMatch[1]], baseDate);
      if (!nextDate) return null;
      dateParts = getCalendarParts(nextDate);
    }
  }

  return buildDateFromMoscowParts({
    year: dateParts.year,
    month: dateParts.month,
    day: dateParts.day,
    hours: hour,
    minutes: minute,
  });
};

const formatTaxiTime = (date) => formatMoscowDate(date, {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatTaxiDateForDisplay = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return "";

  const date = parseTaxiWhenValue(text, baseDate);
  if (!date) return text;

  const baseParts = getMoscowDateTimeParts(baseDate);
  const targetParts = getMoscowDateTimeParts(date);
  if (!baseParts || !targetParts) return text;

  const dayDiff = getCalendarDayDiff(targetParts, baseParts);
  const targetCalendarDate = buildCalendarDate(targetParts);
  const dateText = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(targetCalendarDate);

  if (dayDiff === 0) return `Сегодня, ${dateText}`;
  if (dayDiff === 1) return `Завтра, ${dateText}`;

  const extendedDateText = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(targetCalendarDate);
  return extendedDateText;
};

const normalizeTaxiHourMinute = (hour, minute = 0) => {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  if (!Number.isInteger(parsedHour) || !Number.isInteger(parsedMinute)) return "";
  if (parsedHour < 0 || parsedHour > 23 || parsedMinute < 0 || parsedMinute > 59) return "";
  return `${String(parsedHour).padStart(2, "0")}:${String(parsedMinute).padStart(2, "0")}`;
};

export const extractTaxiExactTimeFromText = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  const colonOrDotMatch = text.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (colonOrDotMatch) {
    return normalizeTaxiHourMinute(colonOrDotMatch[1], colonOrDotMatch[2]);
  }

  const hoursMatch = text.match(/(?:выезд(?:\s+\S+){0,3}?|\bв\b|\bс\b|\bк\b)\s*(\d{1,2})\s*час(?:ов|а)?\b/i);
  if (hoursMatch) {
    return normalizeTaxiHourMinute(hoursMatch[1], 0);
  }

  return "";
};

export const getTaxiExactTimeForDisplay = (whenValue, fallbackText = "", baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (text) {
    const date = parseTaxiWhenValue(text, baseDate);
    if (date) return formatTaxiTime(date);

    const parsedIsoValue = parseTaxiIsoValue(text);
    if (parsedIsoValue) return formatTaxiTime(parsedIsoValue);

    const extractedFromWhen = extractTaxiExactTimeFromText(text);
    if (extractedFromWhen) return extractedFromWhen;
  }

  return extractTaxiExactTimeFromText(fallbackText);
};

export const formatTaxiWhenForDisplay = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return "";

  const date = parseTaxiWhenValue(text, baseDate);
  if (!date) return text;

  const dateText = formatTaxiDateForDisplay(text, baseDate);
  const timeText = formatTaxiTime(date);
  return dateText ? `${dateText}, ${timeText}` : timeText;
};

export const formatTaxiRouteForDisplay = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const parts = raw
    .split(/\s*(?:->|→|—|–|-)\s*/g)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} -> ${parts[1]}`;
  }

  return raw;
};

const truncateTaxiHeadline = (value, maxLength = 56) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

export const isTaxiRouteLike = (value) => {
  const normalized = formatTaxiRouteForDisplay(value);
  if (!normalized) return false;
  if (normalized.includes("->")) return true;

  const hasTskhinval = /цхинвал/i.test(normalized);
  const hasVladikavkaz = /владикавказ/i.test(normalized);
  return hasTskhinval && hasVladikavkaz;
};

export const isIntercityTaxiCategory = (category) => {
  const normalized = String(category || "").trim();
  return normalized === "Цхинвал -> Владикавказ" || normalized === "Владикавказ -> Цхинвал";
};

const isTaxiMetaLikeLine = (value) => {
  const text = String(value || "").trim();
  if (!text) return true;
  if (isTaxiRouteLike(text)) return true;
  if (/^\+?\d[\d\s()+-]{6,}$/.test(text)) return true;
  if (/(сегодня|завтра|послезавтра|понед|вторник|сред|четверг|пятниц|суббот|воскрес|утром|вечером|ночью|днем|днём)/i.test(text)) return true;
  if (/\b\d{1,2}[:.]\d{2}\b/.test(text)) return true;
  if (/\b\d{1,2}\s*час(?:ов|а)?\b/i.test(text)) return true;
  if (/(мест|свободно|проезд|полная машина|руб|₽|посадка|высадка|от дома|до дома)/i.test(text)) return true;
  if (/^(такси|водитель)\b/i.test(text)) return true;
  return false;
};

export const getTaxiHeadlineFromDescription = (description, fallbackTitle = "") => {
  const lines = String(description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isTaxiMetaLikeLine(line)) continue;
    return truncateTaxiHeadline(line);
  }

  const fallback = String(fallbackTitle || "").trim();
  if (fallback && !isTaxiRouteLike(fallback)) {
    return truncateTaxiHeadline(fallback);
  }

  return "";
};

export const hasMeaningfulTaxiHeadline = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  return normalized !== "Поездка" && normalized !== "Такси";
};

export const getTaxiTitleForDisplay = (title, category) => {
  const normalizedTitle = formatTaxiRouteForDisplay(title);
  const normalizedCategory = formatTaxiRouteForDisplay(category);

  if (normalizedCategory === "Такси по Цхинвалу") {
    return normalizedTitle || "Такси по Цхинвалу";
  }

  if (isTaxiRouteLike(normalizedTitle)) {
    return normalizedTitle;
  }

  return normalizedCategory || normalizedTitle || "Поездка";
};

export const getTaxiDirectionAccent = (category) => {
  const normalized = String(category || "").trim();
  if (normalized === "Цхинвал -> Владикавказ") return "route-outbound";
  if (normalized === "Владикавказ -> Цхинвал") return "route-inbound";
  return "route-city";
};

export const getTaxiDirectionBadgeText = (category) => {
  const normalized = String(category || "").trim();
  if (normalized === "Такси по Цхинвалу") return "По городу";
  return formatTaxiRouteForDisplay(normalized).replace(/\s*->\s*/g, " -> ");
};

const formatTaxiSeatsCount = (value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return "";

  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${count} мест`;
  if (last === 1) return `${count} место`;
  if (last > 1 && last < 5) return `${count} места`;
  return `${count} мест`;
};

export const formatTaxiSeatsForDisplay = (seats) => {
  if (!seats || typeof seats !== "object") return "";
  if (Number.isFinite(seats.free) && Number.isFinite(seats.total)) {
    return `Свободно ${seats.free} из ${seats.total}`;
  }
  if (Number.isFinite(seats.free)) {
    return `Свободно ${formatTaxiSeatsCount(seats.free)}`;
  }
  if (Number.isFinite(seats.total)) {
    return formatTaxiSeatsCount(seats.total);
  }
  return "";
};

export const getTaxiPresetState = (whenValue, baseDate = new Date()) => {
  const parsedDate = parseTaxiWhenValue(whenValue, baseDate);
  if (!parsedDate) {
    return {
      dayPreset: "",
      hourPreset: 12,
    };
  }

  const baseParts = getMoscowDateTimeParts(baseDate);
  const targetParts = getMoscowDateTimeParts(parsedDate);
  if (!baseParts || !targetParts) {
    return {
      dayPreset: "",
      hourPreset: 12,
    };
  }

  const dayDiff = getCalendarDayDiff(targetParts, baseParts);
  let dayPreset = "";
  if (dayDiff === 0) {
    dayPreset = "Сегодня";
  } else if (dayDiff === 1) {
    dayPreset = "Завтра";
  } else if (dayDiff > 1 && dayDiff < 7) {
    dayPreset = INDEX_TO_WEEKDAY[targetParts.weekday];
  }

  const normalizedHour = targetParts.hour === 0 ? 24 : targetParts.hour;
  return {
    dayPreset,
    hourPreset: Math.max(4, Math.min(24, normalizedHour)),
  };
};

export const toTaxiDepartureAtApiValue = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return undefined;

  const parsedPresetDate = parseTaxiWhenValue(text, baseDate);
  if (parsedPresetDate) return parsedPresetDate.toISOString();

  return null;
};

export function buildRecurringTaxiOccurrences(templates, horizonDays = 14, baseDate = new Date()) {
  const todayParts = getMoscowDateTimeParts(baseDate);
  if (!todayParts) return [];
  const result = [];

  for (const template of templates) {
    if (template.status === "paused") continue;
    const weekdays = Array.isArray(template.weekdays) ? template.weekdays : [];
    for (let offset = 0; offset <= horizonDays; offset += 1) {
      const dateParts = addCalendarDays(todayParts, offset);
      const date = buildCalendarDate(dateParts);
      const weekday = INDEX_TO_WEEKDAY[dateParts.weekday];
      if (!weekdays.includes(weekday)) continue;

      result.push({
        ...template,
        id: `${template.id}-${date.toISOString().slice(0, 10)}`,
        when: `${weekday} (${formatDateRu(date)}) ${template.time}`,
        date: offset,
      });
    }
  }

  return result;
}
