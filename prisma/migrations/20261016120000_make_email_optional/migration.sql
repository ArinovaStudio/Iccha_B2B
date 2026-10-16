-- Email becomes optional
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "KYCApplication" ALTER COLUMN "email" DROP NOT NULL;

-- Mobile becomes the unique identifier
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- Bring the migration history in line with the drift already in the database
-- (harmless no-ops here, but they make a fresh database match)
ALTER TABLE "VendorProfile" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "Product" ALTER COLUMN "availableSets" SET DEFAULT 1;