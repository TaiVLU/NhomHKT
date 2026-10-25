'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="catalog-page">
      <h1>Không thể tải catalog</h1>
      <button onClick={reset}>Thử lại</button>
    </main>
  );
}
