-- Create UserRole enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('user', 'partner', 'moderator', 'admin');
        RAISE NOTICE 'UserRole enum created successfully';
    ELSE
        RAISE NOTICE 'UserRole enum already exists';
    END IF;
END $$;

-- Add role column to User table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';
        RAISE NOTICE 'Role column added to User table';
    ELSE
        RAISE NOTICE 'Role column already exists in User table';
    END IF;
END $$;

-- Update existing users to have 'user' role if they don't have one
UPDATE "User" SET "role" = 'user' WHERE "role" IS NULL;

-- Verify the setup
SELECT 
    'UserRole enum exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') 
         THEN 'YES' ELSE 'NO' END as result
UNION ALL
SELECT 
    'Role column exists',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'role'
    ) THEN 'YES' ELSE 'NO' END;
