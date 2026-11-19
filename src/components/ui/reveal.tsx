"use client";

/* The last rendered content is kept in a ref so a closing block keeps showing what it showed while it
   folds away, instead of changing under the person's eyes. */
/* eslint-disable react-hooks/refs */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const DURATION_MS = 340;

/**
 * A block that opens and closes smoothly (height and fade) instead of popping in and out. It sits in a
 * `space-y-*` stack in place of a conditional block: the gap below it is part of the animation, so
 * everything under it glides rather than jumps. While closing it is inert and keeps its last content;
 * once closed it is removed from the page entirely.
 *
 * `children` may be a function, called only while `show` is true, for content that would throw
 * when the condition is false.
 */
export function Reveal({
  show,
  children,
  className,
  gap = true,
}: {
  show: boolean;
  children: ReactNode | (() => ReactNode);
  className?: string;
  /** Add the stack's usual gap below the block (inside the animation). */
  gap?: boolean;
}) {
  const [mounted, setMounted] = useState(show);
  const [settled, setSettled] = useState(show);
  const [prevShow, setPrevShow] = useState(show);
  const last = useRef<ReactNode>(null);

  if (show !== prevShow) {
    setPrevShow(show);
    setSettled(false);
    if (show) setMounted(true);
  }

  useEffect(() => {
    const timer = setTimeout(() => (show ? setSettled(true) : setMounted(false)), DURATION_MS + 60);
    return () => clearTimeout(timer);
  }, [show]);

  if (show) last.current = typeof children === "function" ? children() : children;
  if (!mounted && !show) return null;

  return (
    <div className={cn("reveal mb-0!", className)} data-open={show} data-settled={show && settled} inert={!show}>
      <div className="reveal-inner">
        <div className={cn("reveal-gap", gap && "pb-4")}>{last.current}</div>
      </div>
    </div>
  );
}
