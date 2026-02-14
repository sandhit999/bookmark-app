'use server'

import { redirect } from 'next/navigation'
import { createClientForServer } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signInWithGoogle() {
  const supabase = await createClientForServer()
  
  // Get the base URL dynamically
  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : 'http://localhost:3000/auth/callback'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  if (error) {
    console.error('OAuth error:', error)
    throw new Error('Failed to sign in with Google')
  }

  if (data?.url) {
    redirect(data.url)
  }
}

export const signOut = async () => {
  const supabase = await createClientForServer()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw new Error('Failed to sign out')
  }
  
  revalidatePath('/', 'layout')
  redirect('/auth')
}

export async function addBookmark({ title, url, userId }) {
  if (!title || !url || !userId) {
    throw new Error('Missing required fields')
  }

  const supabase = await createClientForServer()

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([
      {
        title: title.trim(),
        url: url.trim(),
        user_id: userId,
      },
    ])
    .select()

  if (error) {
    console.error('Error adding bookmark:', error)
    throw new Error('Failed to add bookmark')
  }

  revalidatePath('/')
  return data
}

export async function deleteBookmark(bookmarkId) {
  if (!bookmarkId) {
    throw new Error('Bookmark ID is required')
  }

  const supabase = await createClientForServer()

  // Verify the bookmark belongs to the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting bookmark:', error)
    throw new Error('Failed to delete bookmark')
  }

  revalidatePath('/')
}