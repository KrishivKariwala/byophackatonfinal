/** SAP-DR-<year>-<6 digits>: kept in its own tiny module so the seed (and anything else) can format numbers without loading the PDF stack. */
export const receiptNumber = (year: number, n: number) => `SAP-DR-${year}-${String(n).padStart(6, "0")}`;
