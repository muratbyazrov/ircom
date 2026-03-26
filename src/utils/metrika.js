const COUNTER_ID_RAW = String(import.meta.env.VITE_YM_COUNTER_ID || "").trim();

const getCounterId = () => {
  const parsed = Number(COUNTER_ID_RAW);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";

const getYm = () => {
  if (!canUseDom()) return null;
  return typeof window.ym === "function" ? window.ym : null;
};

const sanitizePath = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const ensureYmStub = () => {
  if (!canUseDom() || getYm()) return;

  const ymStub = function (...args) {
    ymStub.a = ymStub.a || [];
    ymStub.a.push(args);
  };

  ymStub.l = Date.now();
  window.ym = ymStub;
};

let initStarted = false;
let scriptInjected = false;

export const isMetrikaEnabled = () => getCounterId() !== null;

export function initMetrika() {
  const counterId = getCounterId();
  if (!counterId || !canUseDom()) return false;
  if (initStarted) return true;

  initStarted = true;
  ensureYmStub();

  if (!scriptInjected) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.append(script);
    scriptInjected = true;
  }

  window.ym(counterId, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    defer: true,
  });

  return true;
}

export function trackPageView(path) {
  const counterId = getCounterId();
  const ym = getYm();
  if (!counterId || !ym) return false;

  ym(counterId, "hit", sanitizePath(path));
  return true;
}

export function trackGoal(goalId) {
  const counterId = getCounterId();
  const ym = getYm();
  const normalizedGoalId = String(goalId || "").trim();
  if (!counterId || !ym || !normalizedGoalId) return false;

  ym(counterId, "reachGoal", normalizedGoalId);
  return true;
}
