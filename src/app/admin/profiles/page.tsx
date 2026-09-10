import { getAdminBarbers } from "@/lib/queries/admin-management";

import { ProfilesClient } from "./ProfilesClient";

export default async function AdminProfilesPage() {
  const barbers = await getAdminBarbers();

  return <ProfilesClient barbers={barbers} />;
}
