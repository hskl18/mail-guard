import { auth } from "@clerk/nextjs/server";
import LandingPage from "@/components/landing-page";

export default async function Home() {
  const { userId } = await auth();

  // Always show the landing page, regardless of authentication status
  return <LandingPage />;
}
