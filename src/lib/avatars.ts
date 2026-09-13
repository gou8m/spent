/**
 * A small, fixed set of stock profile-photo presets — an icon + color pairing
 * rendered as a chip, not an arbitrary upload. Keeps the "picture" concept
 * (something visually distinct in the sidebar/header) without needing image
 * hosting or moderation for user-supplied photos.
 */

import type { SwatchId } from "@/lib/colors";

export interface AvatarPreset {
  id: string;
  icon: string;
  color: SwatchId;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "avatar-1", icon: "user", color: "indigo" },
  { id: "avatar-2", icon: "star", color: "amber" },
  { id: "avatar-3", icon: "leaf", color: "emerald" },
  { id: "avatar-4", icon: "zap", color: "violet" },
  { id: "avatar-5", icon: "sun", color: "orange" },
  { id: "avatar-6", icon: "moon", color: "blue" },
  { id: "avatar-7", icon: "dog", color: "rose" },
  { id: "avatar-8", icon: "gem", color: "teal" },
  { id: "avatar-9", icon: "coffee", color: "pink" },
  { id: "avatar-10", icon: "target", color: "cyan" },
];

export const AVATAR_IDS = AVATAR_PRESETS.map((a) => a.id) as [string, ...string[]];

export function getAvatarPreset(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
}

/** `User.avatar` holds either a preset id ("avatar-3") or an uploaded photo's
 * URL — this tells the two apart so rendering code knows which to use. */
export function isPresetAvatar(value: string): boolean {
  return AVATAR_PRESETS.some((a) => a.id === value);
}

/** The default preset ("avatar-1") renders as the user's initial rather than
 * its generic person icon — a nicer default than an anonymous silhouette. */
export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
