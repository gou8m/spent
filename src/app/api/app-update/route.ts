import { ANDROID_RELEASE, compareVersions } from "@/lib/app-release";

/** GET /api/app-update?v=1.0.0: is there a newer Android build than the one the caller runs?
 * Public (no personal data); the app calls it at most once a day. */
export async function GET(request: Request) {
  const installed = new URL(request.url).searchParams.get("v") ?? "";
  const updateAvailable = /^\d+(\.\d+){0,3}$/.test(installed) && compareVersions(ANDROID_RELEASE.versionName, installed) > 0;

  return Response.json(
    {
      updateAvailable,
      installed,
      latest: { versionName: ANDROID_RELEASE.versionName, versionCode: ANDROID_RELEASE.versionCode, apkUrl: ANDROID_RELEASE.apkUrl, notes: ANDROID_RELEASE.notes },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
