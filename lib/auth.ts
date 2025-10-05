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
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback called:', { 
        userEmail: user?.email, 
        userName: user?.name,
        accountProvider: account?.provider,
        hasProfile: !!profile
      })
      
      // Handle Discord OAuth
      if (account?.provider === 'discord') {
        try {
          // Validate required user data
          if (!user.email) {
            console.error('❌ Discord OAuth: No email provided')
            return '/auth/error?error=Configuration'
          }
          
          console.log('✅ Discord OAuth: Email validated:', user.email)

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            console.log('🆕 Creating new user from Discord OAuth:', user.email)
            // Create new user from Discord OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || `Discord User ${user.email.split('@')[0]}`,
                image: user.image,
                emailVerified: new Date(), // Discord emails are pre-verified
                role: 'user'
              }
            })
            console.log('✅ Created new user from Discord OAuth:', user.email, 'with ID:', newUser.id)
            
            // Store in user object that this is a new signup
            user.isNewUser = true
          } else {
            console.log('👤 Existing user found:', user.email, 'with ID:', existingUser.id, 'role:', existingUser.role)
          }
        } catch (error) {
          console.error('❌ Error in Discord OAuth signIn:', error)
          // Return error page URL instead of false
          return '/auth/error?error=Configuration'
        }
      }
      
      console.log('✅ SignIn callback returning true')
      return true
    },
    async jwt({ token, user, account, trigger }) {
      console.log('JWT callback called:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        hasAccount: !!account,
        trigger: trigger,
        tokenId: token?.id,
        tokenRole: token?.role,
        userEmail: user?.email,
        accountProvider: account?.provider
      })
      
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
            // Pass through isNewUser flag if it exists
            if (user.isNewUser) {
              token.isNewUser = true
            }
            console.log('Updated token with database user data:', { id: dbUser.id, role: dbUser.role, isNewUser: user.isNewUser })
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
      
      // If token doesn't have id/role but has email, try to fetch from database
      if (!token.id && token.email && !user) {
        try {
          console.log('Token missing id/role, fetching from database:', token.email)
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true }
          })
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            console.log('Updated token from database:', { id: dbUser.id, role: dbUser.role })
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback (refresh):', error)
        }
      }
      
      console.log('Final token:', { id: token.id, role: token.role })
      return token
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token })
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        // Pass through isNewUser flag if it exists
        if (token.isNewUser) {
          session.user.isNewUser = true
        }
        console.log('Updated session with:', { id: session.user.id, role: session.user.role, isNewUser: token.isNewUser })
      } else {
        console.error('No token provided to session callback')
      }
      console.log('Final session:', session)
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl })
      
      // If url is a callback URL, redirect to dashboard
      if (url.includes('/api/auth/callback')) {
        console.log('🔄 Redirecting from callback to dashboard')
        return `${baseUrl}/dashboard`
      }
      
      // If url is the login page, redirect to dashboard (successful OAuth)
      if (url.includes('/auth/login')) {
        console.log('🔄 Redirecting from login to dashboard')
        return `${baseUrl}/dashboard`
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        console.log('🔄 Using relative URL:', `${baseUrl}${url}`)
        return `${baseUrl}${url}`
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        console.log('🔄 Using same origin URL:', url)
        return url
      }
      
      // Default redirect to dashboard for successful logins
      console.log('🔄 Default redirect to dashboard')
      return `${baseUrl}/dashboard`
    }
  }
}


