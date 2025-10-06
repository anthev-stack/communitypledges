-- AddPaypalFields
ALTER TABLE "User" ADD COLUMN "paypalUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "paypalConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "paypalConnectedAt" TIMESTAMP(3);
