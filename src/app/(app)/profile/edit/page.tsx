import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { isUserVerified } from "@/lib/verified";
import { BackHeader } from "@/components/layout/back-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { EmailSection } from "@/components/profile/email-section";
import { AboutYouForm } from "@/components/profile/about-you-form";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";

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
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">About you</h2>
        <Card className="p-4">
          <AboutYouForm dateOfBirth={user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : ""} phone={user.phone ?? ""} />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Account &amp; security</h2>
        <Card className="divide-y divide-divider p-0">
          <EmailSection email={user.email} pendingEmail={user.pendingEmail} />
          <ChangePasswordDialog />
        </Card>
      </div>
    </div>
  );
}
