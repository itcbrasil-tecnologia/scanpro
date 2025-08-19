import { UserLayout } from "@/components/layout/UserLayout";
import { PageTransition } from "@/providers/page-transition";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserLayout>
      <PageTransition>{children}</PageTransition>
    </UserLayout>
  );
}
