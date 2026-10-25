import { OrderDetailPage } from '../../../../features/orders/order-detail-page';

export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailPage orderNumber={orderNumber} />;
}
