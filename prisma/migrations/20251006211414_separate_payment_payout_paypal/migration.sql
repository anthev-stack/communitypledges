-- SeparatePaymentPayoutPaypal
-- Rename existing PayPal fields to payout-specific
ALTER TABLE "User" RENAME COLUMN "paypalEmail" TO "payoutPaypalEmail";
ALTER TABLE "User" RENAME COLUMN "paypalUserId" TO "payoutPaypalUserId";
ALTER TABLE "User" RENAME COLUMN "paypalConnected" TO "payoutPaypalConnected";
ALTER TABLE "User" RENAME COLUMN "paypalConnectedAt" TO "payoutPaypalConnectedAt";

-- Add payment-specific PayPal fields
ALTER TABLE "User" ADD COLUMN "paymentPaypalEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "paymentPaypalUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "paymentPaypalConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "USER" ADD COLUMN "paymentPaypalConnectedAt" TIMESTAMP(3);
