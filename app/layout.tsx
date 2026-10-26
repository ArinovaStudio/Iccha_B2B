import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';
import ToastContainer from '@/components/common/ToastContainer';
import SellerRequestModal from '@/components/cart/SellerRequestModal';
import ChunkRecovery from '@/components/common/ChunkRecovery';
import ProductReturnScrollReset from '@/components/common/ProductReturnScrollReset';

export const metadata: Metadata = {
  title: "IcchaStore - B2B Women's Kurti Wholesale Platform",
  description: "Wholesale manufacturer of stitched 2-piece and 3-piece women's kurtis, pants, and dupattas for verified boutiques, retailers, and distributors.",
  openGraph: {
    title: "IcchaStore - B2B Kurti Wholesale",
    description: "Verified B2B wholesale platform for stitched ethnic sets.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9f7f2] text-[#1a1a1a] antialiased flex flex-col selection:bg-[#1a1a1a] selection:text-[#f9f7f2]" suppressHydrationWarning>
        <AppProvider>
          <ChunkRecovery />
          <ProductReturnScrollReset />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <ToastContainer />
          
          <SellerRequestModal />
        </AppProvider>
      </body>
    </html>
  );
}
