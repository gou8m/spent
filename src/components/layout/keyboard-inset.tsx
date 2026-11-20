"use client";

import { useEffect } from "react";

const FIELD = "input, textarea, select, [contenteditable=true]";
const NO_KEYBOARD_TYPES = new Set(["checkbox", "radio", "button", "submit", "range", "file", "color"]);
/** A drop in the visible height smaller than this is the browser's own bar, not a keyboard. */
const KEYBOARD_MIN_PX = 120;

function isTextField(el: Element | null): el is HTMLElement {
  if (!el || !el.matches(FIELD)) return false;
  return !(el instanceof HTMLInputElement && NO_KEYBOARD_TYPES.has(el.type));
}

/**
 * Makes the on-screen keyboard feel smooth instead of jumpy. It tells the page whether a keyboard is open and
 * how tall it is (`html.kb-open` and `--kb`), so sheets can ride up above it, the bottom bar and the + button can
 * slide away while typing, and everything eases back when it closes. It also glides the field being typed in into
 * view. Renders nothing.
 */
export function KeyboardInset() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    // The tallest the visible area has been while no field was focused: what "no keyboard" looks like.
    let baseline = vv ? vv.height + vv.offsetTop : window.innerHeight;
    let open = false;
    let fxTimer: ReturnType<typeof setTimeout> | undefined;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;

    function update() {
      const visible = vv ? vv.height + vv.offsetTop : window.innerHeight;
      const focused = isTextField(document.activeElement);
      if (!focused) baseline = Math.max(visible, window.innerHeight);
      const shrink = Math.max(0, Math.round(baseline - visible));
      const nowOpen = focused && shrink > KEYBOARD_MIN_PX;
      // Browsers that overlay the keyboard (iOS) leave the layout alone: sheets lift by the overlap instead.
      const overlap = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      root.style.setProperty("--kb", nowOpen && overlap > KEYBOARD_MIN_PX ? `${overlap}px` : "0px");
      if (nowOpen !== open) {
        open = nowOpen;
        // Transitions run only around the change, so scroll-linked movement elsewhere stays instant.
        root.classList.add("kb-fx");
        clearTimeout(fxTimer);
        fxTimer = setTimeout(() => root.classList.remove("kb-fx"), 450);
        root.classList.toggle("kb-open", nowOpen);
      }
    }

    function onFocusIn(e: FocusEvent) {
      const target = e.target as Element | null;
      if (!isTextField(target)) return;
      update();
      // Wait for the keyboard to finish rising, then glide the field to the middle of what is left.
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (document.activeElement !== target) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      }, 320);
    }

    function onFocusOut() {
      // A moment later, in case focus is only moving to the next field.
      setTimeout(update, 80);
    }

    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    update();
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      clearTimeout(fxTimer);
      clearTimeout(scrollTimer);
      root.classList.remove("kb-open", "kb-fx");
      root.style.removeProperty("--kb");
    };
  }, []);

  return null;
}
