import { useEffect } from "react";

export function useGestureGuard() {
  useEffect(() => {
    let lastTouchEnd = 0;
    let touchStartY = 0;
    let activeScrollElement = null;

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
      if (e.target?.closest?.(".viewer-content")) return;
      e.preventDefault();
    };

    const handleTouchStart = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      touchStartY = touch.clientY;
      activeScrollElement = getScrollableParent(e.target);
    };

    const preventTouchMove = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
        return;
      }

      const touch = e.touches?.[0];
      if (!touch) return;

      const deltaY = touch.clientY - touchStartY;
      if (deltaY <= 0) return;

      const scrollElement = activeScrollElement || getScrollableParent(e.target);
      const scrollTop = Number(scrollElement?.scrollTop || 0);
      if (scrollTop <= 0) {
        // Block pull-down at top edge to reduce Telegram swipe-to-collapse.
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
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
