import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Cột 1: Thương hiệu & Giới thiệu */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight">HKT Store</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Thế giới Manga & Sách kỹ năng — Đồng hành cùng đam mê và tư duy bứt phá của người trẻ.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>📍 TP. Hồ Chí Minh, Việt Nam</p>
              <p>✉️ contact@hktstore.vn</p>
            </div>
          </div>

          {/* Cột 2: Điều hướng nhanh */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Khám phá</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/san-pham" className="hover:text-white transition">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/danh-muc" className="hover:text-white transition">
                  Danh mục
                </Link>
              </li>
              <li>
                <Link href="/tai-khoan" className="hover:text-white transition">
                  Tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ & Chính sách */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Hướng dẫn mua hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Phương thức thanh toán */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Thanh toán an toàn</h4>
            <p className="text-xs text-slate-400">Hỗ trợ thanh toán tiện lợi qua cổng thanh toán điện tử:</p>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-300">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">MoMo</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">VNPay QR</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">ZaloPay</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">COD</span>
            </div>
          </div>
        </div>

        {/* Bản quyền cuối trang */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 HKT Store. Đồ án môn Thương mại điện tử.</p>
          <p className="text-slate-600">Built with Next.js, Prisma & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}