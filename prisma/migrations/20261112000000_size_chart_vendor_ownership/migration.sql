-- Give existing global size charts a stable IcchaStore owner before adding
-- per-owner uniqueness. Vendors will have separate, private chart lists.
ALTER TABLE "SizeChartOption" ADD COLUMN "userId" TEXT;
ALTER TABLE "SizeChartOption" ADD COLUMN "vendorId" TEXT;

UPDATE "SizeChartOption"
SET "userId" = (
  SELECT "id" FROM "User"
  WHERE "role" IN ('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_MANAGER')
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
);

-- If an installation has no staff user yet, remove orphaned global options;
-- they cannot be assigned to a valid owner and should not remain globally visible.
DELETE FROM "SizeChartOption" WHERE "userId" IS NULL;

ALTER TABLE "SizeChartOption" DROP CONSTRAINT IF EXISTS "SizeChartOption_name_key";
CREATE UNIQUE INDEX "SizeChartOption_userId_name_key" ON "SizeChartOption"("userId", "name");
CREATE UNIQUE INDEX "SizeChartOption_vendorId_name_key" ON "SizeChartOption"("vendorId", "name");
CREATE INDEX "SizeChartOption_userId_sortOrder_idx" ON "SizeChartOption"("userId", "sortOrder");
CREATE INDEX "SizeChartOption_vendorId_sortOrder_idx" ON "SizeChartOption"("vendorId", "sortOrder");

ALTER TABLE "SizeChartOption" ADD CONSTRAINT "SizeChartOption_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SizeChartOption" ADD CONSTRAINT "SizeChartOption_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
