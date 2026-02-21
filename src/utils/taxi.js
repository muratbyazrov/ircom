export const WEEKDAY_TO_INDEX = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 };
export const INDEX_TO_WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
export const TAXI_DAY_PRESETS = ["Сегодня", "Завтра", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const TAXI_RECURRING_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const formatDateRu = (date) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);

export const normalizeWeekdays = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map((x) => String(x).trim()).filter((x) => x in WEEKDAY_TO_INDEX);
};

export const nextWeekdayDate = (targetWeekday, now) => {
  const date = dayStart(now);
  const diff = (targetWeekday - now.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
};

export const getTaxiDateByPreset = (preset, baseDate = new Date()) => {
  if (!preset) return "";

  const now = new Date(baseDate);
  const date = new Date(now);

  if (preset === "Сегодня") {
    return formatDateRu(date);
  }

  if (preset === "Завтра") {
    date.setDate(now.getDate() + 1);
    return formatDateRu(date);
  }

  const targetWeekday = WEEKDAY_TO_INDEX[preset];
  if (typeof targetWeekday !== "number") return "";
  return formatDateRu(nextWeekdayDate(targetWeekday, now));
};

export const parseTaxiWhenValue = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return null;

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const now = new Date(baseDate);
  let datePart = dayStart(now);

  const dateInBrackets = text.match(/\((\d{2})\.(\d{2})\.(\d{4})\)/);
  if (dateInBrackets) {
    const day = Number(dateInBrackets[1]);
    const month = Number(dateInBrackets[2]) - 1;
    const year = Number(dateInBrackets[3]);
    const parsed = new Date(year, month, day);
    if (Number.isNaN(parsed.getTime())) return null;
    datePart = parsed;
  } else if (text.startsWith("Сегодня")) {
    datePart = dayStart(now);
  } else if (text.startsWith("Завтра")) {
    datePart = dayStart(now);
    datePart.setDate(datePart.getDate() + 1);
  } else {
    const weekdayMatch = text.match(/^(Вс|Пн|Вт|Ср|Чт|Пт|Сб)\b/);
    if (weekdayMatch) {
      datePart = nextWeekdayDate(WEEKDAY_TO_INDEX[weekdayMatch[1]], now);
    }
  }

  datePart.setHours(hour, minute, 0, 0);
  return datePart;
};

export const toTaxiDepartureAtApiValue = (whenValue, baseDate = new Date()) => {
  const text = String(whenValue || "").trim();
  if (!text) return undefined;

  const parsedPresetDate = parseTaxiWhenValue(text, baseDate);
  if (parsedPresetDate) return parsedPresetDate.toISOString();

  const nativeParsed = new Date(text);
  if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed.toISOString();

  return null;
};

export function buildRecurringTaxiOccurrences(templates, horizonDays = 14, baseDate = new Date()) {
  const today = dayStart(baseDate);
  const result = [];

  for (const template of templates) {
    if (template.status === "paused") continue;
    const weekdays = Array.isArray(template.weekdays) ? template.weekdays : [];
    for (let offset = 0; offset <= horizonDays; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const weekday = INDEX_TO_WEEKDAY[date.getDay()];
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
