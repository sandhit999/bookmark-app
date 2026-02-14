import { createClientForServer } from "@/utils/supabase/server";
import { signOut } from "@/utils/actions";
import Link from "next/link";
import Navbar from "@/components/Layout/Navbar";
import BookmarkForm from "@/components/Bookmarks/BookmarkForm";
import BookmarkList from "@/components/Bookmarks/BookmarkList";
import BookmarkCount from "@/components/Bookmarks/BookmarkCount";

export default async function Home() {
  const supabase = await createClientForServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-4xl">🔖</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Smart Bookmarks
            </h1>
            <p className="text-gray-600">
              Save and organize your favorite links in one place
            </p>
          </div>

          <Link
            href="/auth"
            className="block w-full px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Sign In with Google
          </Link>
        </div>
      </div>
    );
  }

  const user_metadata = user.user_metadata;
  const { full_name, name, avatar_url, picture } = user_metadata;

  const displayName = full_name || name || "User";
  const displayAvatar = avatar_url || picture;

  // Fetch bookmarks
  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  console.log("Server: Fetched bookmarks:", bookmarks?.length || 0);
  if (error) {
    console.error("Error fetching bookmarks:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar
        userName={displayName}
        userAvatar={displayAvatar}
        signOut={signOut}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
             <BookmarkCount userId={user.id} initialCount={bookmarks?.length || 0} />
            </div>
          </div>
        </div>

        <BookmarkForm userId={user.id} />

        <BookmarkList initialBookmarks={bookmarks || []} userId={user.id} />
      </main>
    </div>
  );
}
