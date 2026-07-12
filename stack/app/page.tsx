import LandingPage from "@/components/landing-page";

export default function Home() {
  // Always show the landing page, regardless of authentication status
  return <LandingPage />;
}
