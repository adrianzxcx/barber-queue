import { getAdminSettings } from "@/lib/queries/admin-management";

import { SettingsClient } from "./SettingsClient";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return <SettingsClient settings={settings} />;
}
