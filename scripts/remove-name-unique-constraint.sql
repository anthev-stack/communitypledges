-- Remove unique constraint from name field
-- This allows multiple users to have the same name (or null names)

-- Drop the unique constraint on the name field
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_name_key";

-- Verify the constraint was removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'User'::regclass 
AND conname = 'User_name_key';
