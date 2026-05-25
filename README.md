# Community Pledges

A modern web application for community commitments and pledges built with Next.js 15, TypeScript, Tailwind CSS, and Prisma.

## Features

- ✅ **Authentication System**
  - Email & Password login with hCaptcha verification
  - Discord OAuth integration
  - Secure session management with NextAuth.js

- ✅ **User Management**
  - User registration with bot prevention
  - Profile settings page
  - Public user profiles
  - User listing page

- ✅ **Modern UI**
  - Beautiful, responsive design
  - Tailwind CSS styling
  - Gradient backgrounds and smooth transitions

- 🚧 **Coming Soon**
  - Pledge creation and tracking
  - Community features
  - Notifications

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js
- **OAuth Provider:** Discord
- **Bot Prevention:** hCaptcha

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd community-pledges
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"

   # Discord OAuth
   DISCORD_CLIENT_ID="your-discord-client-id"
   DISCORD_CLIENT_SECRET="your-discord-client-secret"

   # hCaptcha
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY="your-hcaptcha-site-key"
   HCAPTCHA_SECRET_KEY="your-hcaptcha-secret-key"
   ```

4. **Configure Discord OAuth**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add OAuth2 redirect URL: `http://localhost:3000/api/auth/callback/discord`
   - Copy Client ID and Client Secret to your `.env` file

5. **Configure hCaptcha**
   - Sign up at [hCaptcha](https://www.hcaptcha.com/)
   - Get your Site Key and Secret Key
   - Add them to your `.env` file
   - For testing, you can use: `10000000-ffff-ffff-ffff-000000000001` (test key)

6. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```
   Add the output to `NEXTAUTH_SECRET` in your `.env` file

7. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
community-pledges/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth routes
│   │   ├── register/            # User registration
│   │   └── user/update/         # User profile updates
│   ├── dashboard/               # Dashboard page
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── settings/                # Settings page
│   ├── users/                   # Users listing & profiles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── components/
│   └── Navbar.tsx               # Navigation component
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   └── prisma.ts                # Prisma client
├── prisma/
│   └── schema.prisma            # Database schema
└── types/
    └── next-auth.d.ts           # NextAuth type definitions
```

## Available Pages

- `/` - Homepage
- `/login` - Sign in page
- `/register` - Sign up page (with hCaptcha)
- `/dashboard` - User dashboard (protected)
- `/settings` - Profile settings (protected)
- `/users` - List of all users
- `/users/[id]` - Public user profile

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User** - User accounts with email, password, profile info
- **Account** - OAuth account connections
- **Session** - User sessions
- **VerificationToken** - Email verification tokens

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Prisma commands
npx prisma studio      # Open Prisma Studio
npx prisma migrate dev # Create and apply migration
npx prisma generate    # Generate Prisma Client
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ hCaptcha verification for registration
- ✅ Secure session management
- ✅ Protected API routes
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)

## Contributing

This is a personal project. Feel free to fork and modify as needed.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on the repository.
