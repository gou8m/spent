import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { BackHeader } from "@/components/layout/back-header";
import { Card } from "@/components/ui/card";
import { EmailSection } from "@/components/profile/email-section";
import { PhoneForm } from "@/components/profile/phone-form";

export default async function ContactPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);

  return (
    <div className="max-w-2xl space-y-5">
      <BackHeader href="/profile" title="Email and phone" />

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Email</h2>
        <Card className="p-0">
          <EmailSection email={user.email} pendingEmail={user.pendingEmail} />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Phone</h2>
        <Card className="bg-surface p-4">
          <PhoneForm phone={user.phone ?? ""} currency={user.currency} />
        </Card>
      </div>
    </div>
  );
}
