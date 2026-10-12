-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "selectedColor" TEXT NOT NULL DEFAULT '__NO_COLOR__';

-- DropIndex
DROP INDEX "CartItem_cartId_productId_selectedSize_key";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_selectedSize_selectedColor_key" ON "CartItem"("cartId", "productId", "selectedSize", "selectedColor");