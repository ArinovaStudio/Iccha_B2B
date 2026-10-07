-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "selectedSize" SET DEFAULT 'NO_SIZE';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "gst" TEXT,
ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "ProductUploadSession" ALTER COLUMN "vendorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "bannerAssetId" TEXT;

-- CreateTable
CREATE TABLE "ProductUploadSessionAsset" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUploadSessionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductUploadSessionAsset_sessionId_idx" ON "ProductUploadSessionAsset"("sessionId");

-- CreateIndex
CREATE INDEX "ProductUploadSessionAsset_mediaAssetId_idx" ON "ProductUploadSessionAsset"("mediaAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUploadSessionAsset_sessionId_mediaAssetId_key" ON "ProductUploadSessionAsset"("sessionId", "mediaAssetId");

-- CreateIndex
CREATE INDEX "Category_vendorId_idx" ON "Category"("vendorId");

-- CreateIndex
CREATE INDEX "VendorProfile_bannerAssetId_idx" ON "VendorProfile"("bannerAssetId");

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_bannerAssetId_fkey" FOREIGN KEY ("bannerAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUploadSessionAsset" ADD CONSTRAINT "ProductUploadSessionAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProductUploadSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUploadSessionAsset" ADD CONSTRAINT "ProductUploadSessionAsset_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

