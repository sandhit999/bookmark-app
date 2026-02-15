"use client";

import Image from "next/image";

export default function Navbar({ userName, userAvatar, signOut }) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Bookmarks</h1>
              <p className="text-xs text-gray-500">Organize your web</p>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {userAvatar && (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white shadow-sm"
                />
              )}
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </div>
            
            {/* Mobile user avatar */}
            <div className="sm:hidden">
              {userAvatar && (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white shadow-sm"
                />
              )}
            </div>
            
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}