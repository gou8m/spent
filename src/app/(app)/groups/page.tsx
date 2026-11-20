import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getGroups } from "@/lib/data/split";
import { GroupsView } from "@/components/groups/groups-view";

export default async function GroupsPage() {
  const userId = await requireUserId();
  const [user, groups] = await Promise.all([getCurrentUser(userId), getGroups(userId)]);
  return <GroupsView groups={groups} currency={user.currency} />;
}
