import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getParties } from "@/lib/data/parties";
import { PeopleView } from "@/components/people/people-view";

export default async function PeoplePage() {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const { parties, suggestions } = await getParties(userId, user.currency);
  return <PeopleView parties={parties} suggestions={suggestions} currency={user.currency} />;
}
