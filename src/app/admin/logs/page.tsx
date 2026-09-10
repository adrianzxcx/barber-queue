import { getAdminLogs } from "@/lib/queries/admin-management";

import { LogsClient } from "./LogsClient";

export default async function AdminLogsPage() {
  const logs = await getAdminLogs();

  return <LogsClient logs={logs} />;
}
