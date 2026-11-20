import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { BackHeader } from "@/components/layout/back-header";
import { Card } from "@/components/ui/card";
import { EmailSection } from "@/components/profile/email-section";
import { PhoneRow } from "@/components/profile/phone-form";

export default async function ContactPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);

  return (
    <div className="max-w-2xl space-y-5">
      <BackHeader href="/profile" title="Email and phone" />

      <Card className="p-5">
        <EmailSection email={user.email} pendingEmail={user.pendingEmail} />
      </Card>

      <Card className="p-5">
        <PhoneRow phone={user.phone ?? ""} currency={user.currency} />
      </Card>
    </div>
  );
}
