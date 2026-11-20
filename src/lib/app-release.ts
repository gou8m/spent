/**
 * The newest Android app build. Bump this (and ship the APK) with every Android release, see
 * android/README.md. The installed app compares its own version against this once a day and offers
 * the download when it is behind.
 *
 * Updating in place (no second copy of the app) only works when every build keeps the SAME
 * package id and is signed with the SAME keystore, and `versionCode` goes up each time.
 */
export const ANDROID_PACKAGE_ID = "in.spentonline.app";

export const ANDROID_RELEASE = {
  versionName: "3.20.0",
  versionCode: 6,
  /** Always the same file name (spent.apk), so a newer download simply replaces the older one. Served
   * from the latest GitHub Release, which also gives download counts; set ANDROID_APK_URL to host it
   * elsewhere. */
  apkUrl: process.env.ANDROID_APK_URL || "https://github.com/gou8m/spent/releases/latest/download/spent.apk",
  notes: ["Existing loans, smoother keyboard, People banks and merchants"],
};

/** Positive when `a` is newer than `b` (plain x.y.z numbers; missing parts count as 0). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
