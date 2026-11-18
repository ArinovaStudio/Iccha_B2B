import { OrderEnquiryStatus, SellerOrderStatus } from "@prisma/client";

// Keep UI options and API validation derived from the Prisma enums, so the
// dropdowns cannot drift away from the statuses accepted by the database.
export const ORDER_ENQUIRY_STATUSES = Object.values(OrderEnquiryStatus);
export const SELLER_ORDER_STATUSES = Object.values(SellerOrderStatus);
export const ORDER_STATUS_FILTER_OPTIONS = ["ALL", ...SELLER_ORDER_STATUSES] as const;
