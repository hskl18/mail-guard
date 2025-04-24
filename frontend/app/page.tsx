import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import LandingPage from "@/components/landing-page";

export default async function Home() {
  const { userId, redirectToSignIn } = await auth();

  if (userId) {
    // User is authenticated, redirect to the dashboard
    redirect("/dashboard");
  }

  return <LandingPage />;
}
