'use client'
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CleanupImagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check if user is authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth");
    return null;
  }

  const handleCleanup = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/cleanup-images", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error || "Failed to cleanup images"}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      setMessage("❌ An error occurred during cleanup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Image Cleanup</h1>
          <p className="text-gray-600">Convert old base64 images to file storage</p>
        </div>

        {/* Cleanup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Convert Base64 Images to Files
              </h2>
              <p className="text-gray-600 mb-6">
                This will convert any existing base64 images stored in the database to actual files in the public/uploads directory.
                This improves performance and reduces database size.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes("✅") 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {message}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleCleanup}
              disabled={isLoading}
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "Start Cleanup"}
            </button>

            <div className="mt-6 text-sm text-gray-500">
              <p>⚠️ This process will:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Find all users with base64 images</li>
                <li>Convert them to actual files</li>
                <li>Update the database with file paths</li>
                <li>Preserve the original image data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 