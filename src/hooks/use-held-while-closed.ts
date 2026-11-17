import { useState } from "react";

/**
 * Returns `value` while `open`, and the last value seen while open once it closes. Dialog content is
 * usually derived from "the thing being edited", which is cleared the moment the dialog closes; without
 * this the content flashes blank (or turns into an empty form) during the exit animation.
 */
export function useHeldWhileClosed<T>(open: boolean, value: T): T {
  const [held, setHeld] = useState(value);
  if (open && !Object.is(held, value)) setHeld(value);
  return open ? value : held;
}
