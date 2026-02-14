"use client";

import { useEffect, useState } from "react";
import createClientForBrowser from "@/utils/supabase/client";

export default function BookmarkCount({ userId, initialCount }) {
  const [count, setCount] = useState(initialCount || 0);

  useEffect(() => {
    const supabase = createClientForBrowser();

    // Fetch count immediately
    const fetchCount = async () => {
      const { count: newCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (newCount !== null) {
        setCount(newCount);
      }
    };

    fetchCount();

    // Poll every 2 seconds
    const interval = setInterval(fetchCount, 2000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <p className="text-gray-600 mt-1">
      {count} bookmark{count !== 1 ? 's' : ''} saved
    </p>
  );
}