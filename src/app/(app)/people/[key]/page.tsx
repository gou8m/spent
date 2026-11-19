import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getParties, getPartyThread } from "@/lib/data/parties";
import { normalizeName } from "@/lib/party";
import { PartyChat } from "@/components/people/party-chat";

export default async function PartyPage({ params }: { params: Promise<{ key: string }> }) {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const { key } = await params;
  const wanted = normalizeName(decodeURIComponent(key));
  const [thread, all] = await Promise.all([getPartyThread(userId, wanted, user.currency), getParties(userId, user.currency)]);
  if (!thread) notFound();

  // Other names this one could be merged with.
  const others = all.parties.filter((p) => p.key !== thread.key && p.count > 0).map((p) => ({ key: p.key, name: p.name }));
  return <PartyChat thread={thread} others={others} />;
}
