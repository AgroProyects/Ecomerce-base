import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createAdminClient } from '@/lib/supabase/admin'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        const supabase = createAdminClient()

        // Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (authError || !authData.user) {
          throw new Error('Credenciales inválidas')
        }

        // Obtener información del usuario de nuestra tabla
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) {
          // Si no existe en nuestra tabla, crear registro
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              name: authData.user.user_metadata?.name || null,
              role: 'viewer',
            })
            .select()
            .single()

          if (createError) {
            throw new Error('Error al crear usuario')
          }

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            image: newUser.avatar_url,
          }
        }

        if (!user.is_active) {
          throw new Error('Usuario desactivado')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar_url,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Extend types for NextAuth
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

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
