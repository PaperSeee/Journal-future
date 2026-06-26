import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import { Sidebar, MobileTabBar, MobileHeader } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <Providers>
      <ToastProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-8 md:pb-10">
              {children}
            </main>
          </div>
        </div>
        <MobileTabBar />
      </ToastProvider>
    </Providers>
  );
}
