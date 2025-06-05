import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AuthenticatedApp from "@/components/authenticated-app";
import ClientProvider from "@/components/client-provider";

export default async function DashboardPage() {
  const { userId } = await auth();

  // If the user is not logged in, redirect to the sign-in page
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <ClientProvider>
      <AuthenticatedApp />
    </ClientProvider>
  );
}
