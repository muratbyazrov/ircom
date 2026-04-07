const FALSE_ENV_VALUES = new Set(["0", "false", "off", "no"]);

const parseEnvBoolean = (rawValue, defaultValue = true) => {
  const normalized = String(rawValue ?? "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  return !FALSE_ENV_VALUES.has(normalized);
};

export const FOOD_SECTION_ENABLED = parseEnvBoolean(import.meta.env.VITE_FEATURE_FOOD_ENABLED, true);

export const tabConfig = [
  ["ads", "ads", "Объявления"],
  ["services", "services", "Услуги"],
  ["food", "food", "Еда"],
  ["taxi", "taxi", "Такси"],
  ["profile", "profile", "Профиль"],
].filter(([key]) => FOOD_SECTION_ENABLED || key !== "food");

export const sortModes = [
  ["date", "По дате"],
  ["price", "По цене"],
  ["fav", "Сначала избранное"],
  ["rating", "По рейтингу"],
];

export const sectionSortModes = {
  ads: [
    ["date", "По дате"],
    ["price", "По цене"],
    ["fav", "Сначала избранное"],
  ],
  services: [
    ["date", "По дате"],
    ["price", "По цене"],
    ["fav", "Сначала избранное"],
    ["rating", "По рейтингу"],
  ],
  food: [
    ["price", "По цене"],
    ["fav", "Сначала избранное"],
  ],
  taxi: [
    ["date", "По дате"],
    ["price", "По цене"],
    ["fav", "Сначала избранное"],
    ["rating", "По рейтингу"],
  ],
};
