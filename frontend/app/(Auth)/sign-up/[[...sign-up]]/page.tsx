import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link className="flex items-center justify-center" href="/">
          <Mail className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">Mail Guard</span>
        </Link>
        <div className="ml-auto">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>
          <div className="mt-8">
            <SignUp appearance={{ elements: { footer: "hidden" } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
