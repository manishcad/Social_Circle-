'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-white to-green-500 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
            <div className="text-6xl font-bold text-white">404</div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, the page youre looking for doesnt exist or the page is still under maintenance.
          </p>
          
          {/* Error Code */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 font-mono">
              Error: 404 - Not Found
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
          
          <Link
            href="/"
            className="block w-full bg-white/80 backdrop-blur-sm text-gray-700 py-3 px-6 rounded-lg hover:bg-white/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/30"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/80 mb-4">Try these pages instead:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/profile"
              className="text-white/90 hover:text-white text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/posts"
              className="text-white/90 hover:text-white text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              Posts
            </Link>
            <Link
              href="/messages"
              className="text-white/90 hover:text-white text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              Messages
            </Link>
            <Link
              href="/explore"
              className="text-white/90 hover:text-white text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 