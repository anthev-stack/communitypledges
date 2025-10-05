import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Force fresh build - Google OAuth removed
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email'
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account, profile })
      
      // Handle Discord OAuth
      if (account?.provider === 'discord') {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user from Discord OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image,
                emailVerified: new Date(), // Discord emails are pre-verified
                role: 'user'
              }
            })
            console.log('Created new user from Discord OAuth:', user.email, 'with ID:', newUser.id)
          } else {
            console.log('Existing user found:', user.email, 'with ID:', existingUser.id, 'role:', existingUser.role)
          }
        } catch (error) {
          console.error('Error in Discord OAuth signIn:', error)
          return false
        }
      }
      
      return true
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account })
      
      // For Discord OAuth, we need to fetch user data from database
      if (account?.provider === 'discord' && user?.email) {
        try {
          console.log('Fetching user from database for Discord OAuth:', user.email)
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true }
          })
          
          console.log('Database user found:', dbUser)
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            console.log('Updated token with database user data:', { id: dbUser.id, role: dbUser.role })
          } else {
            console.error('No user found in database for email:', user.email)
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error)
          // Fallback to user data if database query fails
          if (user) {
            token.id = user.id
            token.role = 'user' // Default role
            console.log('Using fallback user data:', { id: user.id, role: 'user' })
          }
        }
      }
      
      // For non-Discord OAuth (like credentials)
      if (user && !account?.provider) {
        token.id = user.id
        token.role = user.role
        console.log('Using user data for non-OAuth:', { id: user.id, role: user.role })
      }
      
      console.log('Final token:', { id: token.id, role: token.role })
      return token
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token })
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        console.log('Updated session with:', { id: session.user.id, role: session.user.role })
      } else {
        console.error('No token provided to session callback')
      }
      console.log('Final session:', session)
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl })
      
      // If url is a callback URL, redirect to dashboard
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      
      // Default redirect to dashboard for successful logins
      return `${baseUrl}/dashboard`
    }
  }
}


