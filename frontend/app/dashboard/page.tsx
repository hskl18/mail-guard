import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AuthenticatedApp from "@/components/authenticated-app";

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  // If the user is not logged in, redirect to the sign-in page
  if (!userId) {
    redirect("/sign-in");
  }

  return <AuthenticatedApp />;
}
