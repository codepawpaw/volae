import { handleTransactionNotification } from "../handler";

// Recurring payment notification URL: https://volae.id/api/midtrans/recurring-notification
// The shop has no subscriptions yet; these are logged, and any that belong to an order sync it.
export function POST(request: Request) {
  return handleTransactionNotification(request, "recurring");
}
