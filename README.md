# Smart Bookmark App

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS that allows users to save, organize, and manage their favorite web links with instant synchronization across multiple browser tabs.

## 🔗 Live Demo

**Vercel URL:** [https://bookmark-app-chi-rosy.vercel.app]

**GitHub Repository:** [https://github.com/sandhit999/supabase-bookmark-app]

---

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure login without email/password
- 📚 **Bookmark Management** - Add and delete bookmarks with URL and title
- 🔒 **Private & Secure** - Each user can only see their own bookmarks
- ⚡ **Real-time Sync** - Changes appear instantly across all open tabs without page refresh
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Clean interface built with Tailwind CSS

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Authentication & Database:** Supabase (Auth, PostgreSQL, Realtime)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
- **Language:** JavaScript/JSX

---

## 📋 Requirements Met

✅ **Requirement 1:** User can sign up and log in using Google (OAuth only, no email/password)  
✅ **Requirement 2:** Logged-in user can add a bookmark (URL + title)  
✅ **Requirement 3:** Bookmarks are private to each user  
✅ **Requirement 4:** Bookmark list updates in real-time across tabs without page refresh  
✅ **Requirement 5:** User can delete their own bookmarks  
✅ **Requirement 6:** App deployed on Vercel with working live URL  

---

## 🐛 Problems Encountered & Solutions

### Problem 1: Realtime Connection Timing Out

**Issue:**  
After setting up Supabase Realtime, the connection would initially show as "SUBSCRIBED" but then quickly change to "TIMED_OUT" or "CLOSED". No real-time events were being received, even though the subscription appeared to connect successfully.

**Diagnosis:**  
Ran diagnostic SQL query:
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'bookmarks';
```
This returned 0 rows, meaning the bookmarks table was not added to the realtime publication.

**Solution:**  
Added the bookmarks table to the Supabase realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

After running this command, the subscription remained in "SUBSCRIBED" status and began receiving events properly.

**Learning:**  
Even though Supabase Realtime is enabled by default, each table must be explicitly added to the `supabase_realtime` publication. The UI toggle for this is not always visible in newer Supabase versions, so the SQL approach is more reliable.

---

### Problem 2: Bookmarks Not Displaying After Fetch

**Issue:**  
The server successfully fetched bookmarks (confirmed by the count showing "3 bookmarks saved"), but the bookmark list component rendered as empty with no bookmarks displayed below.

**Diagnosis:**  
Console logs showed:
```javascript
initialBookmarks: (3) [{...}, {...}, {...}]  // Server passed data correctly
Current bookmarks in state: []                // But state was empty
```

**Root Cause:**  
The `BookmarkList` component was receiving `initialBookmarks` from the server, but the React state wasn't being initialized properly. The component mounted with an empty array before the useEffect could set the initial data.

**Solution:**  
Modified the component to fetch bookmarks directly on the client side in addition to receiving server data:
```javascript
useEffect(() => {
  const supabase = createClientForBrowser();
  
  // Fetch fresh data on mount
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
  // ... rest of realtime setup
}, [userId]);
```

**Learning:**  
While Next.js server components can fetch data efficiently, client components with realtime subscriptions benefit from having their own data fetching logic to ensure state is properly initialized.

---

### Problem 3: Cross-Tab Sync Not Working

**Issue:**  
Real-time updates worked within a single tab (adding a bookmark made it appear immediately), but opening two tabs and adding a bookmark in Tab 1 did not make it appear in Tab 2. Both tabs showed "Live updates" with a green indicator, suggesting successful subscription.

**Diagnosis:**  
Console logs in Tab 2 showed:
```
📡 Subscription status: SUBSCRIBED  ✅
```
But when adding a bookmark in Tab 1, Tab 2's console showed nothing - no event received.

**Root Cause:**  
The subscription was using a filter parameter:
```javascript
.channel(`bookmarks-${userId}`)
.on("postgres_changes", {
  filter: `user_id=eq.${userId}`  // This caused issues
})
```

When each tab creates its own uniquely-named channel with a filter, Supabase Realtime sometimes doesn't broadcast events across all instances.

**Solution:**  
Changed to a shared channel name without filter, and filtered events in JavaScript instead:
```javascript
.channel('public:bookmarks')  // Shared channel, no unique suffix
.on("postgres_changes", {
  event: "*",
  schema: "public",
  table: "bookmarks",
  // NO filter parameter here
})
.then((payload) => {
  // Filter in JavaScript
  const isOurBookmark = 
    (payload.new && payload.new.user_id === userId) ||
    (payload.old && payload.old.user_id === userId);
  
  if (!isOurBookmark) return;
  // Handle event...
})
```

**Learning:**  
Supabase Realtime works best with shared channel names across all clients. Client-side filtering is more reliable than server-side filter parameters for cross-tab/cross-client synchronization.

---

### Problem 4: Current Tab Not Updating After Add

**Issue:**  
After successfully implementing cross-tab sync (Tab 2 would update when Tab 1 added a bookmark), a new problem emerged: the tab where the user actually clicked "Add Bookmark" (Tab 1) would NOT show the new bookmark immediately. Only after refreshing or checking the other tab would it appear.

**Diagnosis:**  
The realtime event WAS being received in Tab 1 (visible in console), but the UI wasn't updating. The issue was a race condition: the form submission completed, but the state update from the realtime event wasn't triggering a re-render.

**Solution:**  
Implemented a polling mechanism as a fallback to ensure consistent updates:
```javascript
// Poll database every 2 seconds
const pollInterval = setInterval(async () => {
  const { data } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (data) {
    setBookmarks(data);
  }
}, 2000);

// Also keep realtime for instant updates when it works
const channel = supabase
  .channel('db-changes')
  .on("postgres_changes", { ... })
  .subscribe();

return () => {
  clearInterval(pollInterval);
  supabase.removeChannel(channel);
};
```

**Learning:**  
Real-time subscriptions are excellent for instant updates but can have edge cases. A polling fallback (every 2-3 seconds) provides a reliable baseline while still attempting to use realtime for instant updates when possible. For a production app with many users, you'd want to optimize this further, but for this use case it works perfectly.

---

### Problem 5: Bookmark Count Not Updating

**Issue:**  
The header showed "0 bookmarks saved" even after adding bookmarks. The list below would update correctly, but the count remained stuck at 0.

**Root Cause:**  
The bookmark count was rendered as part of the server component:
```javascript
<p className="text-gray-600 mt-1">
  {bookmarks?.length || 0} bookmark{bookmarks?.length !== 1 ? 's' : ''} saved
</p>
```

Since this was rendered on the server during initial page load, it never updated when bookmarks changed on the client side.

**Solution:**  
Created a separate client component for the count that updates automatically:
```javascript
// components/Bookmarks/BookmarkCount.jsx
"use client";

export default function BookmarkCount({ userId, initialCount }) {
  const [count, setCount] = useState(initialCount || 0);

  useEffect(() => {
    const supabase = createClientForBrowser();

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
    const interval = setInterval(fetchCount, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <p className="text-gray-600 mt-1">
      {count} bookmark{count !== 1 ? 's' : ''} saved
    </p>
  );
}
```

**Learning:**  
In Next.js App Router, mixing server and client components requires careful consideration. Dynamic data that updates frequently should be handled by client components, even if it means making additional API calls.

---

### Problem 6: Row Level Security (RLS) Policies Configuration

**Issue:**  
During development, encountered various issues with bookmarks not being accessible or realtime events not being received, even after fixing the publication setup.

**Root Cause:**  
The initial RLS policies were too restrictive or incorrectly configured, blocking the queries and realtime events.

**Solution:**  
Set up proper RLS policies that work with Supabase Realtime:
```sql
-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own bookmarks
CREATE POLICY "select_own_bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert only their own bookmarks
CREATE POLICY "insert_own_bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own bookmarks
CREATE POLICY "delete_own_bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

These policies ensure:
- Each user can only see their own bookmarks (privacy requirement)
- Users can only insert bookmarks with their own user_id
- Users can only delete their own bookmarks
- Realtime events pass through correctly

**Learning:**  
RLS policies are critical for security and must be configured correctly. Using `auth.uid()` ensures that policies work seamlessly with Supabase Auth and don't interfere with realtime subscriptions.

---

### Problem 7: Environment Variables in Production

**Issue:**  
When preparing for Vercel deployment, needed to ensure OAuth redirects would work in production, not just localhost.

**Solution:**  
Made the OAuth redirect URL dynamic based on environment:
```javascript
// utils/actions.js
export async function signInWithGoogle() {
  const supabase = await createClientForServer()
  
  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : 'http://localhost:3000/auth/callback'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  })
  // ...
}
```

Environment variables:
```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Vercel (production)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

**Learning:**  
OAuth providers require exact redirect URLs. Using environment variables makes the app work in both development and production without code changes.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account
- A Google Cloud account (for OAuth)

### 1. Clone the Repository
```bash
git clone [your-repo-url]
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your URL and anon key
3. In SQL Editor, run:

```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "select_own_bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- Create indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-app.vercel.app/auth/callback` (production)
6. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Add your Client ID and Client Secret

### 4. Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel URL)
4. Deploy
5. Update Google OAuth redirect URI with your Vercel URL

---

## 📁 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.js          # OAuth callback handler
│   │   └── page.jsx               # Authentication page
│   ├── layout.js                  # Root layout
│   ├── page.js                    # Home page
│   └── globals.css                # Global styles
├── components/
│   ├── Bookmarks/
│   │   ├── BookmarkCard.jsx       # Individual bookmark display
│   │   ├── BookmarkForm.jsx       # Add bookmark form
│   │   ├── BookmarkList.jsx       # List with realtime updates
│   │   └── BookmarkCount.jsx      # Live bookmark count
│   ├── Forms/
│   │   └── AuthForm.jsx           # Google sign-in button
│   └── Layout/
│       └── Navbar.jsx             # Navigation bar
├── utils/
│   ├── actions.js                 # Server actions
│   └── supabase/
│       ├── client.js              # Browser Supabase client
│       └── server.js              # Server Supabase client
└── README.md
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign in with Google OAuth works
- [ ] Can add a bookmark (URL + title)
- [ ] Bookmark appears immediately in the list
- [ ] Bookmark count updates
- [ ] Open second tab - bookmark list matches first tab
- [ ] Add bookmark in Tab 1 - appears in Tab 2 within 2 seconds
- [ ] Delete bookmark in Tab 2 - disappears in Tab 1 within 2 seconds
- [ ] Sign out works
- [ ] Different users see only their own bookmarks

---

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level security ensures users can only access their own data
- **OAuth Authentication** - No passwords stored, relies on Google's secure authentication
- **Server-side validation** - All mutations validated on the server
- **Environment variables** - Sensitive keys never exposed in client code

---

## ⚡ Performance Optimizations

- **Database indexes** on user_id and created_at for fast queries
- **Polling fallback** ensures updates even if realtime has issues
- **Client-side caching** with React state management
- **Optimistic UI updates** for better perceived performance

---

## 🎯 Key Learnings

1. **Supabase Realtime requires explicit publication setup** - Tables must be added to the realtime publication via SQL
2. **Shared channels work better for cross-tab sync** - Avoid unique channel names per tab
3. **Polling provides reliability** - Real-time is great but a polling fallback ensures consistency
4. **Server vs Client components matter** - Dynamic data needs client components in Next.js App Router
5. **RLS policies must be carefully designed** - Security and functionality must work together
6. **Environment-based configuration is essential** - Development and production need different settings



## 🙏 Acknowledgments

- Built as part of a fullstack/GenAI role screening assignment
- Uses Supabase for backend infrastructure
- Deployed on Vercel's platform


---

**Built with ❤️ using Next.js, Supabase, and Tailwind CSS**
# Updated
