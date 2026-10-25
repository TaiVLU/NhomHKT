import { Suspense } from 'react';
import { AdminOrdersPage } from '../../../features/admin-orders/admin-orders-page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="admin-orders-page" aria-busy="true">
          Đang tải đơn hàng…
        </main>
      }
    >
      <AdminOrdersPage />
    </Suspense>
  );
}
