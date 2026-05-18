import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // redirect to dashboard after login or fallback to home
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Sync user profile data to database on login callback
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            const profileData = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              updated_at: new Date().toISOString(),
            }

            await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(profileData),
            })
          }
        }
      } catch (syncError) {
        console.warn(
          'Failed to sync profile during auth callback (this is expected if profiles table or triggers are not yet built):',
          syncError
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to signin with error context if authentication failed
  return NextResponse.redirect(`${origin}/auth?error=auth-callback-failed`)
}
