import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { isUserVerified } from "@/lib/verified";
import { BackHeader } from "@/components/layout/back-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { BirthdayForm } from "@/components/profile/birthday-form";

export default async function EditProfilePage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const isVerified = await isUserVerified(user.id, user.email);

  return (
    <div className="max-w-2xl space-y-5">
      <BackHeader href="/profile" title="Profile" />

      <Card className="p-5">
        <ProfileForm name={user.name} avatar={user.avatar} email={user.email} isVerified={isVerified} />
      </Card>

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Birthday</h2>
        <Card className="bg-surface p-4">
          <BirthdayForm dateOfBirth={user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : ""} />
        </Card>
      </div>
    </div>
  );
}
