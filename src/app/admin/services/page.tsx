import { getAdminServices } from "@/lib/queries/admin-management";

import { ServicesClient } from "./ServicesClient";

export default async function AdminServicesPage() {
  const services = await getAdminServices();

  return <ServicesClient services={services} />;
}
