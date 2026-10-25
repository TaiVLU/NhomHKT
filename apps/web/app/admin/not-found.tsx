import Link from 'next/link';

export default function AdminNotFoundPage() {
  return (
    <main className="empty-state">
      <h1>Không tìm thấy trang quản trị</h1>
      <p>Đường dẫn quản trị này không tồn tại.</p>
      <Link href="/admin/dashboard">Về tổng quan</Link>
    </main>
  );
}
