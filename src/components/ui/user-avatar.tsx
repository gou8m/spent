import { IconChip } from "@/components/ui/icon-chip";
import { getAvatarPreset, isPresetAvatar, getInitial } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-13 w-13" };

/** Renders a user's `avatar` field, whichever kind it is — a preset icon
 * chip (the default preset shows their name's initial instead of a generic
 * person icon), or an uploaded photo. */
export function UserAvatar({
  avatar,
  name,
  size = "md",
  className,
}: {
  avatar: string;
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  if (isPresetAvatar(avatar)) {
    const preset = getAvatarPreset(avatar);
    if (preset.id === "avatar-1") {
      return <IconChip initial={getInitial(name)} color={preset.color} size={size} className={className} />;
    }
    return <IconChip icon={preset.icon} color={preset.color} size={size} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded URL from Blob storage, not a static/local asset next/image can optimize meaningfully.
    <img
      src={avatar}
      alt=""
      className={cn("shrink-0 rounded-full object-cover", sizeClasses[size], className)}
    />
  );
}
