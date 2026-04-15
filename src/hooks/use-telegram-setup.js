import { useEffect, useState } from 'react';

export function useTelegramSetup() {
  const [telegramWebApp, setTelegramWebApp] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setTelegramWebApp(window.Telegram.WebApp);
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60;
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (window.Telegram?.WebApp) {
        setTelegramWebApp(window.Telegram.WebApp);
        window.clearInterval(timer);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const telegramInitData = String(telegramWebApp?.initData || "").trim();
  const isTelegramMiniApp = Boolean(telegramWebApp && telegramInitData);

  useEffect(() => {
    const root = document.documentElement;
    const applyColorScheme = (scheme) => {
      const resolved = scheme === "dark" ? "dark" : "light";
      if (resolved === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
    };

    const tg = window.Telegram?.WebApp;
    if (tg && tg.colorScheme) {
      applyColorScheme(tg.colorScheme);
    } else {
      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      applyColorScheme(mq?.matches ? "dark" : "light");
    }

    const handleThemeChanged = () => {
      const scheme = window.Telegram?.WebApp?.colorScheme;
      if (scheme) {
        applyColorScheme(scheme);
      }
    };
    const handleMqChange = (e) => {
      if (!window.Telegram?.WebApp?.colorScheme) {
        applyColorScheme(e.matches ? "dark" : "light");
      }
    };

    tg?.onEvent?.("themeChanged", handleThemeChanged);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", handleMqChange);

    return () => {
      tg?.offEvent?.("themeChanged", handleThemeChanged);
      mq?.removeEventListener?.("change", handleMqChange);
    };
  }, [telegramWebApp, isTelegramMiniApp]);

  useEffect(() => {
    const tg = isTelegramMiniApp ? telegramWebApp : null;
    const root = document.documentElement;
    let fullscreenRetryTimer = null;
    let fullscreenAttempts = 0;
    const MAX_FULLSCREEN_ATTEMPTS = 6;
    const FULLSCREEN_RETRY_DELAY = 180;
    const telegramCapabilities = {
      disableVerticalSwipes: true,
      requestFullscreen: true,
      enableClosingConfirmation: true,
    };
    const clampInset = (value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 0;
      return Math.max(0, Math.min(numeric, 96));
    };
    const callTelegramMethod = (methodName) => {
      const method = tg?.[methodName];
      if (!method || telegramCapabilities[methodName] === false) {
        return false;
      }

      try {
        method.call(tg);
        return true;
      } catch (error) {
        if (error?.message === "WebAppMethodUnsupported") {
          telegramCapabilities[methodName] = false;
          return false;
        }
        throw error;
      }
    };
    const applyViewportVars = () => {
      const telegramPlatform = String(tg?.platform || "").toLowerCase();
      const ua = String(window.navigator?.userAgent || "");
      const isAndroidUa = /Android/i.test(ua);
      const isIosUa = /iPhone|iPad|iPod/i.test(ua);
      const isAndroidTelegram = Boolean(tg) && telegramPlatform === "android";
      const isAndroidPlatform = telegramPlatform === "android" || (!tg && isAndroidUa);
      const isIosPlatform = telegramPlatform === "ios" || (!tg && isIosUa);
      const stableHeight = Number(tg?.viewportStableHeight);
      const viewportHeight = Number(tg?.viewportHeight);
      const appHeight = Number.isFinite(stableHeight) && stableHeight > 0
        ? stableHeight
        : (Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : window.innerHeight);

      const safeTopFromTg = clampInset(tg?.contentSafeAreaInset?.top ?? tg?.safeAreaInset?.top);
      const safeBottomFromTg = clampInset(tg?.contentSafeAreaInset?.bottom ?? tg?.safeAreaInset?.bottom);
      const topFallback = clampInset(window.innerHeight - appHeight);
      const safeTop = Math.max(safeTopFromTg, topFallback);
      const visualViewportHeight = Number(window.visualViewport?.height);
      const visualViewportOffsetTop = Number(window.visualViewport?.offsetTop);
      const visualViewportBottomEdge = Number.isFinite(visualViewportHeight) && visualViewportHeight > 0
        ? (visualViewportHeight + (Number.isFinite(visualViewportOffsetTop) ? visualViewportOffsetTop : 0))
        : null;
      const visualViewportBottomInset = visualViewportBottomEdge !== null
        ? clampInset(Math.max(
          window.innerHeight - visualViewportBottomEdge,
          appHeight - visualViewportBottomEdge
        ))
        : 0;
      const viewportGapFromTg = Number.isFinite(stableHeight) && stableHeight > 0 && Number.isFinite(viewportHeight) && viewportHeight > 0
        ? clampInset(stableHeight - viewportHeight)
        : 0;
      const safeBottom = Math.max(safeBottomFromTg, visualViewportBottomInset, viewportGapFromTg);

      root.style.setProperty("--app-height", `${Math.max(appHeight, 320)}px`);
      root.style.setProperty("--tg-safe-area-top", `${safeTop}px`);
      root.style.setProperty("--tg-safe-area-bottom", `${safeBottom}px`);
      root.style.setProperty("--dynamic-safe-area-bottom", `${visualViewportBottomInset}px`);
      root.style.setProperty("--android-nav-buffer", `${isAndroidPlatform ? (isAndroidTelegram ? 10 : 6) : 0}px`);
      root.style.setProperty("--bottom-nav-lift", `${isAndroidPlatform ? 14 : (isIosPlatform ? 6 : 0)}px`);
      root.style.setProperty("--topbar-global-offset", `${isAndroidPlatform ? 38 : (isIosPlatform ? 40 : 0)}px`);
    };

    if (!tg) {
      applyViewportVars();
      window.addEventListener("resize", applyViewportVars);
      window.visualViewport?.addEventListener("resize", applyViewportVars);
      window.visualViewport?.addEventListener("scroll", applyViewportVars);
      return () => {
        window.removeEventListener("resize", applyViewportVars);
        window.visualViewport?.removeEventListener("resize", applyViewportVars);
        window.visualViewport?.removeEventListener("scroll", applyViewportVars);
      };
    }

    const enforceFullscreen = () => {
      tg.expand?.();
      callTelegramMethod("disableVerticalSwipes");
      callTelegramMethod("requestFullscreen");
    };
    const scheduleFullscreenRetry = () => {
      if (fullscreenAttempts >= MAX_FULLSCREEN_ATTEMPTS) return;
      if (fullscreenRetryTimer) return;
      fullscreenRetryTimer = window.setTimeout(() => {
        fullscreenRetryTimer = null;
        fullscreenAttempts += 1;
        enforceFullscreen();
      }, FULLSCREEN_RETRY_DELAY);
    };
    const handleViewportChanged = () => {
      applyViewportVars();
      const isExpanded = tg.isExpanded !== false;
      const isFullscreen = tg.isFullscreen !== false;
      if (!isExpanded || !isFullscreen) {
        enforceFullscreen();
        scheduleFullscreenRetry();
      }
    };
    const handleFullscreenChanged = () => {
      if (tg.isFullscreen === false) {
        enforceFullscreen();
        scheduleFullscreenRetry();
      }
    };
    const handleFullscreenFailed = () => {
      scheduleFullscreenRetry();
    };

    tg.ready();
    enforceFullscreen();
    callTelegramMethod("enableClosingConfirmation");
    applyViewportVars();
    scheduleFullscreenRetry();

    tg.onEvent?.("viewportChanged", handleViewportChanged);
    tg.onEvent?.("safeAreaChanged", applyViewportVars);
    tg.onEvent?.("contentSafeAreaChanged", applyViewportVars);
    tg.onEvent?.("fullscreenChanged", handleFullscreenChanged);
    tg.onEvent?.("fullscreenFailed", handleFullscreenFailed);
    window.addEventListener("resize", applyViewportVars);
    window.visualViewport?.addEventListener("resize", applyViewportVars);
    window.visualViewport?.addEventListener("scroll", applyViewportVars);

    return () => {
      if (fullscreenRetryTimer) {
        window.clearTimeout(fullscreenRetryTimer);
      }
      tg.offEvent?.("viewportChanged", handleViewportChanged);
      tg.offEvent?.("safeAreaChanged", applyViewportVars);
      tg.offEvent?.("contentSafeAreaChanged", applyViewportVars);
      tg.offEvent?.("fullscreenChanged", handleFullscreenChanged);
      tg.offEvent?.("fullscreenFailed", handleFullscreenFailed);
      window.removeEventListener("resize", applyViewportVars);
      window.visualViewport?.removeEventListener("resize", applyViewportVars);
      window.visualViewport?.removeEventListener("scroll", applyViewportVars);
    };
  }, [telegramWebApp, isTelegramMiniApp]);

  return { telegramWebApp, telegramInitData, isTelegramMiniApp };
}
