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
  events: {
    async linkAccount({ user, account, profile }) {
      console.log('🔗 Account linked:', { 
        userEmail: user.email, 
        provider: account.provider,
        providerAccountId: account.providerAccountId 
      })
    },
    async createUser({ user }) {
      console.log('👤 User created:', { 
        userEmail: user.email, 
        userId: user.id 
      })
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback called:', { 
        userEmail: user?.email, 
        userName: user?.name,
        accountProvider: account?.provider,
        hasProfile: !!profile,
        userId: user?.id,
        userImage: user?.image
      })
      
      // Handle Discord OAuth
      if (account?.provider === 'discord') {
        console.log('🎮 Processing Discord OAuth...')
        
        // Validate required user data
        if (!user.email) {
          console.error('❌ Discord OAuth: No email provided')
          return '/auth/error?error=Configuration'
        }
        
        console.log('✅ Discord OAuth: Email validated:', user.email)
        
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          if (existingUser) {
            console.log('👤 Existing user found, manually linking Discord account:', existingUser.email, 'ID:', existingUser.id)
            
            // Manually create the account link since PrismaAdapter isn't doing it
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'discord',
                  providerAccountId: account.providerAccountId
                }
              },
              update: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state
              }
            })
            
            console.log('✅ Discord account linked successfully to existing user')
          } else {
            console.log('🆕 New user, will be created by PrismaAdapter')
          }
        } catch (error) {
          console.error('❌ Error in Discord OAuth signIn callback:', error)
          return '/auth/error?error=Configuration'
        }
        
        return true
      }
      
      console.log('✅ SignIn callback returning true')
      return true
    },
    async jwt({ token, user, account, trigger }) {
      console.log('🔑 JWT callback called:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        hasAccount: !!account,
        trigger: trigger,
        tokenId: token?.id,
        tokenRole: token?.role,
        userEmail: user?.email,
        userRole: user?.role,
        userIsNewUser: user?.isNewUser,
        accountProvider: account?.provider,
        tokenEmail: token?.email,
        tokenIsNewUser: token?.isNewUser
      })
      
      // For Discord OAuth, fetch user data from database
      if (account?.provider === 'discord' && user?.email) {
        try {
          console.log('🔍 Fetching user from database for Discord OAuth:', user.email)
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, createdAt: true, batsEnabled: true }
          })
          
          console.log('📊 Database user found:', dbUser)
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.batsEnabled = dbUser.batsEnabled
            
            // Check if this is a new user (created within last 5 minutes)
            const isNewUser = new Date().getTime() - new Date(dbUser.createdAt).getTime() < 5 * 60 * 1000
            if (isNewUser) {
              token.isNewUser = true
              console.log('🆕 Marking as new user (created recently)')
            }
            
            console.log('✅ Token updated with user data:', { id: dbUser.id, role: dbUser.role, batsEnabled: dbUser.batsEnabled, isNewUser })
          } else {
            console.error('❌ No user found in database for email:', user.email)
            console.log('🔄 Will use user data from OAuth:', { id: user.id, email: user.email })
            // Use the user data from OAuth if database user not found
            token.id = user.id
            token.role = 'user' // Default role
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
            select: { id: true, role: true, batsEnabled: true }
          })
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.batsEnabled = dbUser.batsEnabled
            console.log('Updated token from database:', { id: dbUser.id, role: dbUser.role, batsEnabled: dbUser.batsEnabled })
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback (refresh):', error)
        }
      }
      
      // Clear isNewUser flag after first use to prevent repeated notifications
      if (token.isNewUser && trigger !== 'signIn') {
        console.log('🧹 Clearing isNewUser flag after first use')
        delete token.isNewUser
      }
      
      console.log('Final token:', { id: token.id, role: token.role, isNewUser: token.isNewUser })
      return token
    },
    async session({ session, token }) {
      console.log('📋 Session callback:', { 
        sessionUser: session?.user,
        tokenId: token?.id,
        tokenRole: token?.role,
        tokenIsNewUser: token?.isNewUser,
        tokenEmail: token?.email,
        hasSession: !!session,
        hasToken: !!token
      })
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.batsEnabled = token.batsEnabled as boolean
        // Pass through isNewUser flag if it exists
        if (token.isNewUser) {
          session.user.isNewUser = true
        }
        console.log('Updated session with:', { id: session.user.id, role: session.user.role, batsEnabled: token.batsEnabled, isNewUser: token.isNewUser })
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


