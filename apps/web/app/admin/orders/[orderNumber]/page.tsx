import { AdminOrderDetailPage } from '../../../../features/admin-orders/admin-order-detail-page';

export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) {
  return <AdminOrderDetailPage orderNumber={(await params).orderNumber} />;
}
