import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageTransition } from "@/providers/page-transition";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>
      <PageTransition>{children}</PageTransition>
    </AdminLayout>
  );
}
