import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user has completed profile setup
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      
      // If no profile exists, show new account configuration modal
      // You can redirect to a dedicated onboarding page that shows the modal
      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
      
      // If user has profile but no avatar, update with Google avatar if available
      if (profile && !profile.avatar_url) {
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatar) {
          await supabase
            .from('users')
            .update({ avatar_url: googleAvatar, updated_at: new Date().toISOString() })
            .eq('id', user.id)
        }
      }
      
      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      // Redirect based on role
      if (roleData?.role === 'student') {
        return NextResponse.redirect(new URL('/student', requestUrl.origin))
      } else if (roleData?.role === 'adviser') {
        return NextResponse.redirect(new URL('/adviser', requestUrl.origin))
      } else if (roleData?.role === 'coordinator') {
        return NextResponse.redirect(new URL('/coordinator', requestUrl.origin))
      }
    }
  }

  // Fallback to login if something goes wrong
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
