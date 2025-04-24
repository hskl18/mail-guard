import type React from "react";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

export const metadata = {
  title: "Mail Guard",
  description: "Monitor your mailbox in real-time",
};
