"use client";

import { useEffect, useRef } from "react";

/** Open sheets, innermost last. Android's Back button (and a browser's Back) should close only
 * the top one, so every sheet registers here and a single popstate listener serves them all. */
const openSheets: { id: number; close: () => void }[] = [];
let nextId = 1;
let listening = false;

function onPopState() {
  const top = openSheets.pop();
  top?.close();
}

let skipRewind = false;

/** Call right before closing a sheet to navigate somewhere else (see SheetLink): the sheet's
 * history entry is then replaced by the destination instead of being rewound, which would race
 * the navigation. */
export function skipNextSheetRewind() {
  skipRewind = true;
}

/**
 * Makes the hardware/browser Back button close an open sheet or dialog instead of leaving the
 * page (which would throw away a half-filled form). Opening adds one history entry; Back pops it
 * and closes the sheet; closing any other way (X button, tap outside, saving) quietly removes the
 * entry again so history is left exactly as it was.
 */
export function useSheetBackButton(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) return;

    const id = nextId++;
    // Keep the router's own history state (it tags entries with its own markers) and add ours.
    window.history.pushState({ ...window.history.state, __sheet: id }, "");
    openSheets.push({ id, close: () => closeRef.current() });
    if (!listening) {
      window.addEventListener("popstate", onPopState);
      listening = true;
    }

    return () => {
      const index = openSheets.findIndex((s) => s.id === id);
      const closedByBack = index === -1; // onPopState already took it off the stack
      if (!closedByBack) openSheets.splice(index, 1);
      if (openSheets.length === 0 && listening) {
        window.removeEventListener("popstate", onPopState);
        listening = false;
      }
      // Closed by something other than Back: remove our history entry, but only if it is still the
      // current one (if the page navigated away meanwhile, history is no longer ours to rewind).
      const skip = skipRewind;
      skipRewind = false;
      if (!closedByBack && !skip && window.history.state?.__sheet === id) window.history.back();
    };
  }, [open]);
}
