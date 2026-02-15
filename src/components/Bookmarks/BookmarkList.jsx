"use client";

import { useEffect, useState } from "react";
import createClientForBrowser from "@/utils/supabase/client";
import BookmarkCard from "./BookmarkCard";

export default function BookmarkList({ initialBookmarks, userId }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks || []);

  useEffect(() => {
    const supabase = createClientForBrowser();
    
    // Set initial bookmarks
    if (initialBookmarks && initialBookmarks.length > 0) {
      setBookmarks(initialBookmarks);
    }

    // Fetch fresh data
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (data) {
        setBookmarks(data);
      }
    };

    fetchBookmarks();

    // Poll every 2 seconds as fallback
    const pollInterval = setInterval(fetchBookmarks, 2000);

    // Also try realtime
    const channel = supabase
      .channel('db-changes')
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          console.log('Realtime event:', payload);
          // Just refetch everything when any change happens
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [userId, initialBookmarks]);

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <span className="text-4xl">📭</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No bookmarks yet
        </h3>
        <p className="text-gray-600 mb-6">
          Add your first bookmark using the form above to get started
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>💡</span>
          <span>Tip: Bookmarks sync automatically</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          All Bookmarks ({bookmarks.length})
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refresh</span>
        </div>
      </div>
      
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}