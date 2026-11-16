"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const APP_FLAG = "spent:android-app";
const APP_VERSION_KEY = "spent:android-version";
const LAST_CHECK_KEY = "spent:update-checked-on";

interface UpdateInfo {
  versionName: string;
  apkUrl: string;
  notes: string[];
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the check just runs again next time
  }
}

/**
 * Inside the installed Android app, the first time it is opened each day, asks the server whether a
 * newer build exists and offers the download. The Android wrapper opens the site with
 * `?source=twa&appv=<its version>` (see android/twa-manifest.json), which is how the page learns it
 * is running in the app and which version that is. In a normal browser this renders nothing.
 */
export function AppUpdatePrompt() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "twa" || document.referrer.startsWith("android-app://")) write(APP_FLAG, "1");
    const fromUrl = params.get("appv");
    if (fromUrl) write(APP_VERSION_KEY, fromUrl);

    const version = read(APP_VERSION_KEY);
    if (read(APP_FLAG) !== "1" || !version) return;

    const today = format(new Date(), "yyyy-MM-dd");
    if (read(LAST_CHECK_KEY) === today) return; // already checked on this day
    write(LAST_CHECK_KEY, today);

    let cancelled = false;
    fetch(`/api/app-update?v=${encodeURIComponent(version)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.updateAvailable) return;
        setUpdate(data.latest);
        setOpen(true);
      })
      .catch(() => {
        // offline or server hiccup: try again at the next opening
        write(LAST_CHECK_KEY, "");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Update available">
      <div className="space-y-4 pb-2">
        <div className="flex items-center gap-3.5">
          <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-hover">
            <Smartphone size={24} strokeWidth={2} />
          </span>
          <div>
            <p className="text-base font-bold text-text-primary">Spent. {update.versionName}</p>
            <p className="text-[0.8125rem] text-text-secondary">A newer version of the app is ready.</p>
          </div>
        </div>

        {update.notes.length > 0 && (
          <ul className="space-y-1.5 rounded-[22px] bg-surface-2 px-4 py-3.5">
            {update.notes.map((note) => (
              <li key={note} className="flex gap-2 text-[0.8125rem] leading-snug text-text-primary">
                <span className="font-extrabold text-accent">-</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs leading-snug text-text-secondary">
          Open the downloaded file to install. It updates this app in place, so your data and sign-in stay as they are.
        </p>

        <a
          href={update.apkUrl}
          download="spent.apk"
          onClick={() => {
            toast.success("Downloading the update…");
            setOpen(false);
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-accent text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors hover:bg-accent-hover"
        >
          <Download size={20} strokeWidth={2.25} />
          Download update
        </a>
        <Button variant="secondary" className="h-12 w-full rounded-[18px] font-bold" onClick={() => setOpen(false)}>
          Later
        </Button>
      </div>
    </Sheet>
  );
}
