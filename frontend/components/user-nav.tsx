"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function UserNav() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-4">
      {user && (
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {user.fullName || user.username}
          </span>
          <span className="text-xs text-gray-500">
            {user.primaryEmailAddress?.emailAddress}
          </span>
        </div>
      )}
      <UserButton afterSwitchSessionUrl="/" />
    </div>
  );
}
