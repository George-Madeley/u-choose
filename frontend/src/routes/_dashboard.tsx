import { Navigate, Outlet } from "react-router";

import { DashboardLayout, PageContainer, useSession } from "@toolpad/core";

export default function Page() {
  const session = useSession();

  if (!session) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
}
