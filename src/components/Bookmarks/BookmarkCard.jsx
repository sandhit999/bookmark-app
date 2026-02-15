"use client";

import { deleteBookmark } from "@/utils/actions";
import { useState, useEffect } from "react";

export default function BookmarkCard({ bookmark }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  // Format date only on client side
  useEffect(() => {
    setFormattedDate(new Date(bookmark.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }));
  }, [bookmark.created_at]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBookmark(bookmark.id);
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      alert("Failed to delete bookmark. Please try again.");
      setIsDeleting(false);
    }
  };

  // Extract domain from URL for display
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-100 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {bookmark.title}
          </h3>
          
          {/* URL Link */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm group/link transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="truncate group-hover/link:underline">{getDomain(bookmark.url)}</span>
          </a>
          
          {/* Date */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate || 'Loading...'}</span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:text-gray-500"
          title="Delete bookmark"
        >
          {isDeleting ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}