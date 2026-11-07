import { handleTransactionNotification } from "../handler";

// Payment notification URL: https://volae.id/api/midtrans/notification
export function POST(request: Request) {
  return handleTransactionNotification(request, "payment");
}
