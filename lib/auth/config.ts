import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { createAdminClient } from '@/lib/supabase/admin'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        console.log('=== AUTHORIZE START ===')

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          console.log('Attempting login for:', credentials.email)
          const supabase = createAdminClient()

          // Autenticar con Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          })

          if (authError || !authData.user) {
            console.log('Auth error:', authError?.message)
            return null
          }

          console.log('Supabase auth successful, user id:', authData.user.id)

          // Obtener información del usuario de nuestra tabla
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle()

          console.log('User lookup result:', user)

          if (!user) {
            console.log('Usuario no encontrado en tabla users, creando...')

            // Si no existe en nuestra tabla, crear registro
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email!,
                name: authData.user.user_metadata?.name || null,
                role: 'super_admin', // Primer usuario es super_admin
              })
              .select()
              .maybeSingle()

            console.log('Create user result:', { newUser, createError: createError?.message })

            if (createError || !newUser) {
              console.error('Error creando usuario:', createError)
              // Si ya existe (race condition), intentar obtenerlo de nuevo
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle()

              console.log('Fallback lookup:', existingUser)

              if (existingUser) {
                const result = {
                  id: existingUser.id,
                  email: existingUser.email,
                  name: existingUser.name,
                  role: existingUser.role,
                  image: existingUser.avatar_url,
                }
                console.log('=== AUTHORIZE SUCCESS (fallback) ===', result)
                return result
              }
              console.error('Failed to create or find user')
              return null
            }

            const result = {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              image: newUser.avatar_url,
            }
            console.log('=== AUTHORIZE SUCCESS (new user) ===', result)
            return result
          }

          if (!user.is_active) {
            console.log('User is inactive')
            return null
          }

          const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar_url,
          }
          console.log('=== AUTHORIZE SUCCESS (existing user) ===', result)
          return result
        } catch (error) {
          console.error('Authorize error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google sign in
      if (account?.provider === 'google' && user.email) {
        try {
          const supabase = createAdminClient()

          // Check if user exists in our table
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()

          if (!existingUser) {
            // Create user in our table for Google users
            const { error } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.image,
                role: 'customer',
              })

            if (error) {
              console.error('Error creating Google user:', error)
            }
          }
        } catch (error) {
          console.error('SignIn callback error:', error)
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'customer'
      }

      // For Google users, fetch role from database
      if (account?.provider === 'google' && user?.email) {
        try {
          const supabase = createAdminClient()
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .maybeSingle()

          if (data) {
            token.role = data.role
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  trustHost: true,
})

// Extend types for NextAuth v5
declare module 'next-auth' {
  interface User {
    id: string
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
