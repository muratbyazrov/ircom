import { useEffect, useRef } from "react";
import { tabConfig } from "../utils/constants";

const isValidTab = (value) => tabConfig.some(([key]) => key === value);
const backExcludedModalTypes = new Set(["auth", "create", "editEntity", "profileEdit"]);

const isBackExcludedModal = (modal) => {
  if (!modal || typeof modal !== "object") return false;
  return backExcludedModalTypes.has(modal.type);
};

const normalizeNavState = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const nextTab = isValidTab(source.tab) ? source.tab : "ads";
  const nextModal = source.modal && typeof source.modal === "object" && typeof source.modal.type === "string" ? source.modal : null;
  return { tab: nextTab, modal: nextModal };
};

const serializeNavState = (value) => JSON.stringify(normalizeNavState(value));

export function useNavHistory({ appHistoryKey, tab, setTab, modal, setModal, onBackAttempt }) {
  const navHistoryRef = useRef({ ready: false, applyingPop: false, lastSerialized: "" });

  useEffect(() => {
    const normalizeHistoryState = (historyState, navState) => {
      const base = historyState && typeof historyState === "object" ? historyState : {};
      return { ...base, [appHistoryKey]: normalizeNavState(navState) };
    };
    const readNavStateFromHistory = (historyState) => normalizeNavState(historyState?.[appHistoryKey]);

    const initialNavState = readNavStateFromHistory(window.history.state);
    const initialSerialized = serializeNavState(initialNavState);
    navHistoryRef.current.lastSerialized = initialSerialized;
    window.history.replaceState(normalizeHistoryState(window.history.state, initialNavState), "");
    if (initialNavState.tab !== tab) setTab(initialNavState.tab);
    if (serializeNavState({ tab, modal }) !== initialSerialized) setModal(initialNavState.modal);
    navHistoryRef.current.ready = true;

    const onPopState = (event) => {
      const nextNavState = readNavStateFromHistory(event.state);
      navHistoryRef.current.applyingPop = true;
      navHistoryRef.current.lastSerialized = serializeNavState(nextNavState);
      setTab(nextNavState.tab);
      setModal(nextNavState.modal);
      setTimeout(() => {
        navHistoryRef.current.applyingPop = false;
      }, 0);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // We intentionally keep mount-only behavior to preserve existing history flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = navHistoryRef.current;
    if (!sync.ready || sync.applyingPop) return;
    const nextNavState = { tab, modal };
    const serialized = serializeNavState(nextNavState);
    if (serialized === sync.lastSerialized) return;
    sync.lastSerialized = serialized;
    const base = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const prevNavState = normalizeNavState(base?.[appHistoryKey]);
    const shouldReplace = isBackExcludedModal(prevNavState.modal) && !isBackExcludedModal(nextNavState.modal);
    const nextHistoryState = { ...base, [appHistoryKey]: normalizeNavState(nextNavState) };
    if (shouldReplace) window.history.replaceState(nextHistoryState, "");
    else window.history.pushState(nextHistoryState, "");
  }, [appHistoryKey, tab, modal]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const backButton = tg?.BackButton;
    if (!backButton) return;

    const canGoBackInsideApp = Boolean(modal) || tab !== "ads";
    if (canGoBackInsideApp) backButton.show();
    else backButton.hide();

    const onBackClick = () => {
      if (typeof onBackAttempt === "function" && onBackAttempt()) return;
      window.history.back();
    };
    backButton.onClick(onBackClick);
    return () => backButton.offClick(onBackClick);
  }, [tab, modal, onBackAttempt]);
}
