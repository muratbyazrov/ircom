import { useEffect } from "react";

export function useGestureGuard() {
  useEffect(() => {
    let lastTouchEnd = 0;
    let touchStartY = 0;
    let touchStartX = 0;
    let activeScrollElement = null;
    const telegramPlatform = String(window.Telegram?.WebApp?.platform || "").toLowerCase();
    const isTelegramAndroid = telegramPlatform === "android";

    const isViewerTarget = (target) => Boolean(target?.closest?.(".viewer-content"));

    const getScrollableParent = (target) => {
      let node = target instanceof Element ? target : null;
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const canScrollY = (
          (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")
          && node.scrollHeight > node.clientHeight + 1
        );
        if (canScrollY) return node;
        node = node.parentElement;
      }

      return document.scrollingElement || document.documentElement;
    };

    const preventGesture = (e) => {
      if (isViewerTarget(e.target)) return;
      e.preventDefault();
    };

    const handleTouchStart = (e) => {
      const touch = e.touches?.[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      activeScrollElement = getScrollableParent(e.target);
    };

    const preventTouchMove = (e) => {
      const insideViewer = isViewerTarget(e.target);
      if (e.touches && e.touches.length > 1) {
        if (!insideViewer) e.preventDefault();
        return;
      }

      const touch = e.touches?.[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (deltaY <= 0) return;

      if (insideViewer) {
        if (Math.abs(deltaY) > Math.abs(deltaX) + 8) {
          e.preventDefault();
        }
        return;
      }

      if (isTelegramAndroid) {
        return;
      }

      const scrollElement = activeScrollElement || getScrollableParent(e.target);
      const scrollTop = Number(scrollElement?.scrollTop || 0);
      if (scrollTop <= 0) {
        // Block pull-down at top edge to reduce Telegram swipe-to-collapse.
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e) => {
      if (isViewerTarget(e.target)) return;
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", preventTouchMove, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
    document.addEventListener("touchcancel", preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", preventTouchMove);
      document.removeEventListener("touchend", preventDoubleTapZoom);
      document.removeEventListener("touchcancel", preventDoubleTapZoom);
    };
  }, []);
}
