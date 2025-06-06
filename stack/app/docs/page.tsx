"use client";

import { useEffect } from "react";

export default function DocsPage() {
  useEffect(() => {
    // Redirect to the API docs endpoint with HTML format
    window.location.href = "/api/docs?format=html";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading API Documentation...</p>
      </div>
    </div>
  );
}
