import { prisma } from '@/lib/db';
function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
export class AdminDashboardService {
  static async getDashboard() {
    const [
      pendingKyc,
      totalKyc,
      activeOrders,
      activeProducts,
      lowStockProducts,
      approvedRetailers,
      activeVendors,
      recentKyc,
      recentOrders,
    ] = await Promise.all([
      prisma.kYCApplication.count({
        where: {
          status: {
            in: [
              'APPLICATION_RECEIVED',
              'UNDER_REVIEW',
              'ADDITIONAL_INFORMATION_REQUIRED',
            ],
          },
        },
      }),

      prisma.kYCApplication.count(),

      prisma.orderEnquiry.count({
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED'],
          },
        },
      }),

      prisma.product.count({
        where: { isActive: true },
      }),

      prisma.product.findMany({
        where: {
          isActive: true,
          availableSets: { lte: 8 },
        },
        orderBy: { availableSets: 'asc' },
        take: 10,
        select: {
          id: true,
          sku: true,
          designNumber: true,
          name: true,
          availableSets: true,
          totalAvailablePieces: true,
        },
      }),

      prisma.retailerProfile.count({
        where: { status: 'APPROVED' },
      }),

      prisma.vendorProfile.count({
        where: { isActive: true },
      }),

      prisma.kYCApplication.findMany({
        where: {
          status: {
            in: [
              'APPLICATION_RECEIVED',
              'UNDER_REVIEW',
              'ADDITIONAL_INFORMATION_REQUIRED',
            ],
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          businessName: true,
          applicantName: true,
          mobile: true,
          email: true,
          gstin: true,
          status: true,
          submittedAt: true,
        },
      }),

      prisma.orderEnquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          retailerBusinessName: true,
          retailerApplicantName: true,
          totalDesigns: true,
          totalSets: true,
          totalPieces: true,
          subtotal: true,
          totalGst: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Only active enquiries contribute to the pipeline.
    const pipelineOrders = await prisma.orderEnquiry.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      select: {
        subtotal: true,
        totalGst: true,
        totalSets: true,
      },
    });

    // Shipping is deliberately excluded.
    // Pipeline = Subtotal + GST.
    const grossEnquiryPipeline = roundMoney(
      pipelineOrders.reduce(
        (total, order) =>
          total +
          Number(order.subtotal) +
          Number(order.totalGst),
        0
      )
    );

    const totalSetsInPipeline = pipelineOrders.reduce(
      (total, order) => total + order.totalSets,
      0
    );

    return {
      metrics: {
        pendingKyc,
        totalKycApplications: totalKyc,
        activeOrderEnquiries: activeOrders,
        grossEnquiryPipeline,
        totalSetsInPipeline,
        activeProducts,
        lowStockProducts: lowStockProducts.length,
        approvedRetailers,
        activeVendors,
      },

      pendingKyc: recentKyc.map((application) => ({
        id: application.id,
        businessName: application.businessName,
        applicantName: application.applicantName,
        mobile: application.mobile,
        email: application.email,
        gstin: application.gstin,
        status: application.status,
        submittedAt: application.submittedAt.toISOString(),
      })),

      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        retailerBusinessName: order.retailerBusinessName,
        retailerApplicantName: order.retailerApplicantName,
        totalDesigns: order.totalDesigns,
        totalSets: order.totalSets,
        totalPieces: order.totalPieces,

        // Master Total = Subtotal + GST.
        // Shipping charges are not included.
        masterTotal: roundMoney(
          Number(order.subtotal) + Number(order.totalGst)
        ),

        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),

      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        sku: product.sku,
        designNumber: product.designNumber,
        name: product.name,
        availableSets: product.availableSets,
        totalAvailablePieces: product.totalAvailablePieces,
      })),
    };
  }
}
