import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Mail, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Mail Guard
              </span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Sign in to access your Mail Guard dashboard
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <SignIn
              appearance={{
                elements: {
                  footer: "hidden",
                  card: "shadow-none border-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium",
                  formButtonPrimary:
                    "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg",
                  formFieldInput:
                    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm",
                },
              }}
              redirectUrl="/"
              fallbackRedirectUrl="/"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
