import { Prisma } from '@prisma/client';

export type PublicationState = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export const isActiveMirrorForSeed = (publicationState: PublicationState): boolean =>
  publicationState === 'ACTIVE';

export interface DemoCategorySeed {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly deletedAt?: Date | null;
}

export interface DemoAuthorSeed {
  readonly name: string;
  readonly slug: string;
}

export interface DemoPublisherSeed {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
}

export interface DemoVariantSeed {
  readonly sku: string;
  readonly isbn: string | null;
  readonly name: string;
  readonly coverType: string;
  readonly listPrice: number;
  readonly salePrice: number;
  readonly isActive: boolean;
  readonly onHandQuantity: number;
  readonly reservedQuantity: number;
  readonly lowStockThreshold: number;
}

export type DemoProductImageRole = 'cover' | 'back-cover' | 'preview-01' | 'preview-02';

export interface DemoProductImageSeed {
  readonly role: DemoProductImageRole;
  readonly path: string;
  readonly altText: string;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
}

export interface DemoProductSeed {
  readonly name: string;
  readonly slug: string;
  readonly publicationState: PublicationState;
  readonly categorySlugs: readonly string[];
  readonly primaryCategorySlug: string | null;
  readonly authorSlugs: readonly string[];
  readonly publisherSlug: string | null;
  readonly shortDescription: string;
  readonly description: string;
  readonly language?: string | null;
  readonly pageCount?: number | null;
  readonly isFeatured?: boolean;
  readonly isNew?: boolean;
  readonly images?: readonly DemoProductImageSeed[];
  readonly variants: readonly DemoVariantSeed[];
}

export const approvedPublicCategoryNames = [
  'Manga Shonen',
  'Manga Trinh Thám',
  'Light Novel',
  'Kỹ Năng Sống',
  'Phát Triển Bản Thân',
  'Tư Duy Phản Biện',
  'Kinh Doanh & Khởi Nghiệp',
  'Công Nghệ Thông Tin',
] as const;

export const demoCategories: readonly DemoCategorySeed[] = [
  {
    name: 'Manga Shonen',
    slug: 'manga-shonen',
    description: 'Truyện tranh hành động, phiêu lưu và nhiệt huyết thiếu niên xuất bản chính hãng',
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Manga Trinh Thám',
    slug: 'manga-trinh-tham',
    description: 'Các tác phẩm phá án, đấu trí ly kỳ và hồi hộp từng trang truyện',
    sortOrder: 20,
    isActive: true,
  },
  {
    name: 'Light Novel',
    slug: 'light-novel',
    description: 'Tiểu thuyết ánh sáng Nhật Bản bản quyền, cốt truyện hấp dẫn và minh họa đặc sắc',
    sortOrder: 30,
    isActive: true,
  },
  {
    name: 'Phát Triển Bản Thân',
    slug: 'phat-trien-ban-than',
    description: 'Xây dựng thói quen, kỷ luật tự giác và phương pháp khai phá tiềm năng cá nhân',
    sortOrder: 40,
    isActive: true,
  },
  {
    name: 'Kỹ Năng Sống',
    slug: 'ky-nang-song',
    description: 'Cẩm nang nghệ thuật giao tiếp, lắng nghe và quản lý cảm xúc hiệu quả',
    sortOrder: 50,
    isActive: true,
  },
  {
    name: 'Tư Duy Phản Biện',
    slug: 'tu-duy-phan-bien',
    description: 'Rèn luyện tư duy logic, nhận diện ngụy biện và kỹ năng ra quyết định chính xác',
    sortOrder: 60,
    isActive: true,
  },
  {
    name: 'Kinh Doanh & Khởi Nghiệp',
    slug: 'kinh-doanh-khoi-nghiep',
    description: 'Kiến thức khởi nghiệp tinh gọn, quản trị tài chính và tư duy thị trường thực chiến',
    sortOrder: 70,
    isActive: true,
  },
  {
    name: 'Công Nghệ Thông Tin',
    slug: 'cong-nghe-thong-tin',
    description: 'Tài liệu kiến trúc phần mềm, nguyên lý viết mã sạch và khoa học dữ liệu tuyển chọn bởi HKT Store',
    sortOrder: 80,
    isActive: true,
  },
  {
    name: 'Hàng Đang Cập Nhật',
    slug: 'danh-muc-noi-bo',
    description: 'Danh mục tạm thời dùng trong quá trình cập nhật sản phẩm mới',
    sortOrder: 90,
    isActive: false,
  },
];

export const demoAuthors: readonly DemoAuthorSeed[] = [
  { name: 'Eiichiro Oda', slug: 'eiichiro-oda' },
  { name: 'Gege Akutami', slug: 'gege-akutami' },
  { name: 'Gosho Aoyama', slug: 'gosho-aoyama' },
  { name: 'Tatsuya Endo', slug: 'tatsuya-endo' },
  { name: 'Reki Kawahara', slug: 'reki-kawahara' },
  { name: 'James Clear', slug: 'james-clear' },
  { name: 'Dale Carnegie', slug: 'dale-carnegie' },
  { name: 'Cal Newport', slug: 'cal-newport' },
  { name: 'Robert Martin', slug: 'robert-martin' },
];

export const approvedPublicAuthorNames = demoAuthors.map((author) => author.name);

export const demoPublishers: readonly DemoPublisherSeed[] = [
  {
    name: 'NXB Kim Đồng',
    slug: 'nxb-kim-dong',
    description: 'Nhà xuất bản truyện tranh và sách thiếu nhi uy tín hàng đầu Việt Nam',
  },
  {
    name: 'NXB Trẻ',
    slug: 'nxb-tre',
    description: 'Đơn vị phát hành manga bản quyền và sách phát triển kỹ năng chất lượng',
  },
  {
    name: 'IPM',
    slug: 'ipm',
    description: 'Đơn vị chuyên phát hành các dòng Manga, Light Novel thịnh hành',
  },
  {
    name: 'NXB Thế Giới',
    slug: 'nxb-the-gioi',
    description: 'Nhà xuất bản các tác phẩm tư duy, kinh tế và kỹ năng sống quốc tế',
  },
];

export const approvedPublicPublisherNames = demoPublishers.map((publisher) => publisher.name);

export const demoProducts: readonly DemoProductSeed[] = [
  {
    name: 'One Piece - Tập 100: Đại Hải Trình Rực Lửa',
    slug: 'one-piece-tap-100',
    publicationState: 'ACTIVE',
    categorySlugs: ['manga-shonen'],
    primaryCategorySlug: 'manga-shonen',
    authorSlugs: ['eiichiro-oda'],
    publisherSlug: 'nxb-kim-dong',
    shortDescription: 'Cột mốc lịch sử đưa liên minh Luffy bước vào trận quyết chiến tại đảo Wano',
    description: 'Hành trình vĩ đại tìm kiếm kho báu One Piece của Monkey D. Luffy và băng Mũ Rơm bước vào hồi cao trào rực lửa nhất. Bản in chính thức từ NXB Kim Đồng với chất lượng giấy tiêu chuẩn và bọc màng co bảo vệ',
    language: 'Tiếng Việt',
    pageCount: 208,
    isFeatured: true,
    isNew: true,
    images: [
      {
        path: '/product-images/one-piece.jpg',
        altText: 'One Piece Tập 100',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-REGULAR-STANDARD',
        isbn: '9786042220011',
        name: 'Bản Bìa Mềm Tiêu Chuẩn',
        coverType: 'paperback',
        listPrice: 45000,
        salePrice: 45000,
        isActive: true,
        onHandQuantity: 35,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Jujutsu Kaisen - Tập 1: Chú Thai Đới Mệnh',
    slug: 'jujutsu-kaisen-tap-1',
    publicationState: 'ACTIVE',
    categorySlugs: ['manga-shonen'],
    primaryCategorySlug: 'manga-shonen',
    authorSlugs: ['gege-akutami'],
    publisherSlug: 'nxb-kim-dong',
    shortDescription: 'Yuji Itadori nuốt ngón tay Sukuna và bước chân vào thế giới Chú thuật sư hiểm nguy',
    description: 'Bộ truyện manga Shonen hiện đại bùng nổ toàn cầu với những màn đối đầu chiến thuật nghẹt thở và triết lý sâu sắc về ranh giới sinh tử',
    language: 'Tiếng Việt',
    pageCount: 192,
    images: [
      {
        path: '/product-images/jujutsu-kaisen.jpg',
        altText: 'Jujutsu Kaisen Tập 1',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-OUT-STOCK',
        isbn: '9786042220044',
        name: 'Bản Tiêu Chuẩn Kèm Obi',
        coverType: 'paperback',
        listPrice: 40000,
        salePrice: 36000,
        isActive: true,
        onHandQuantity: 15,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Spy x Family - Tập 1: Gia Đình Điệp Viên',
    slug: 'spy-x-family-tap-1',
    publicationState: 'ACTIVE',
    categorySlugs: ['manga-trinh-tham', 'manga-shonen'],
    primaryCategorySlug: 'manga-trinh-tham',
    authorSlugs: ['tatsuya-endo'],
    publisherSlug: 'nxb-kim-dong',
    shortDescription: 'Gia đình giả định gồm chàng điệp viên, cô vợ sát thủ và bé gái ngoại cảm vui nhộn',
    description: 'Một tác phẩm hài hước, kịch tính nhưng tràn đầy tình cảm gia đình. Điệp viên Twilight phải giữ kín thân phận trong khi nuôi dạy cô bé Anya có siêu năng lực đọc suy nghĩ',
    language: 'Tiếng Việt',
    pageCount: 212,
    isFeatured: true,
    images: [
      {
        path: '/product-images/spy-family.jpg',
        altText: 'Spy x Family Tập 1',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-MULTI-PAPER',
        isbn: '9786042220055',
        name: 'Bản Bìa Rời Cán Bóng',
        coverType: 'paperback',
        listPrice: 40000,
        salePrice: 38000,
        isActive: true,
        onHandQuantity: 20,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Deep Work - Làm Việc Sâu Trong Kỷ Nguyên Xao Nhãng',
    slug: 'deep-work-lam-viec-sau',
    publicationState: 'ACTIVE',
    categorySlugs: ['phat-trien-ban-than'],
    primaryCategorySlug: 'phat-trien-ban-than',
    authorSlugs: ['cal-newport'],
    publisherSlug: 'nxb-tre',
    shortDescription: 'Quy tắc rèn luyện sự tập trung cao độ để bứt phá năng suất học tập và làm việc',
    description: 'Cuốn sách phân tích giá trị của năng lực làm việc không xao nhãng trong thời đại mạng xã hội bùng nổ, cung cấp lộ trình thực hành chia ca làm việc tập trung cao độ',
    language: 'Tiếng Việt',
    pageCount: 280,
    images: [
      {
        path: '/product-images/deep-work.jpg',
        altText: 'Làm Việc Sâu Mỗi Ngày',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-OPTIONAL-MISSING',
        isbn: '9786042220066',
        name: 'Bản Bìa Mềm Nhám',
        coverType: 'paperback',
        listPrice: 165000,
        salePrice: 139000,
        isActive: true,
        onHandQuantity: 12,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Sword Art Online - Tập 1: Tòa Tháp Sinh Tử Aincrad',
    slug: 'sword-art-online-tap-1',
    publicationState: 'ACTIVE',
    categorySlugs: ['light-novel'],
    primaryCategorySlug: 'light-novel',
    authorSlugs: ['reki-kawahara'],
    publisherSlug: 'ipm',
    shortDescription: 'Trò chơi thực tế ảo định mệnh nơi thất bại trong game đồng nghĩa với cái chết thực',
    description: 'Tác phẩm tiên phong cho thể loại game thực tế ảo và Isekai. Kirito và Asuna cùng nhau vượt qua các tầng tháp để tìm đường trở về thế giới thực',
    language: 'Tiếng Việt',
    pageCount: 340,
    isFeatured: true,
    images: [
      {
        path: '/product-images/sword-art-online-1.jpg',
        altText: 'Sword Art Online Tập 1',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-BOOK-20',
        isbn: '9786042220088',
        name: 'Bản Light Novel Bìa Rời',
        coverType: 'paperback',
        listPrice: 85000,
        salePrice: 75000,
        isActive: true,
        onHandQuantity: 18,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Clean Code - Mã Sạch & Tư Duy Kiến Trúc Phần Mềm',
    slug: 'clean-code-ma-sach',
    publicationState: 'ACTIVE',
    categorySlugs: ['cong-nghe-thong-tin'],
    primaryCategorySlug: 'cong-nghe-thong-tin',
    authorSlugs: ['robert-martin'],
    publisherSlug: 'nxb-the-gioi',
    shortDescription: 'Cẩm nang kinh điển về nguyên lý viết code sạch, dễ đọc và dễ bảo trì cho kỹ sư IT',
    description: 'Tập hợp các chuẩn mực, quy tắc đặt tên hàm, tách module và tối ưu hóa hệ thống phần mềm nhằm giảm thiểu nợ kỹ thuật và nâng cao chất lượng dự án',
    language: 'Tiếng Việt',
    pageCount: 460,
    isFeatured: true,
    isNew: true,
    images: [
      {
        path: '/product-images/clean-code.jpg',
        altText: 'Clean Code Mã Sạch',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-BOOK-23',
        isbn: '9786042220099',
        name: 'Bản Bìa Cứng Khổ Lớn',
        coverType: 'hardcover',
        listPrice: 280000,
        salePrice: 235000,
        isActive: true,
        onHandQuantity: 25,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Kimetsu no Yaiba - Tập 1: Tàn Khốc',
    slug: 'kimetsu-no-yaiba-tap-1',
    publicationState: 'ACTIVE',
    categorySlugs: ['manga-shonen'],
    primaryCategorySlug: 'manga-shonen',
    authorSlugs: ['gege-akutami'],
    publisherSlug: 'nxb-kim-dong',
    shortDescription: 'Hành trình diệt quỷ và tìm phương thuốc cứu em gái Nezuko của Tanjiro',
    description: 'Tác phẩm manga kiếm hiệp kỳ ảo đẫm nước mắt và ý chí kiên cường không chịu khuất phục trước số phận',
    language: 'Tiếng Việt',
    pageCount: 192,
    images: [
      {
        path: '/product-images/kimetsu-no-yaiba.jpg',
        altText: 'Kimetsu no Yaiba Tập 1',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-DISCOUNT-STANDARD',
        isbn: '9786042220022',
        name: 'Bản Tiêu Chuẩn',
        coverType: 'paperback',
        listPrice: 40000,
        salePrice: 38000,
        isActive: true,
        onHandQuantity: 40,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
  {
    name: 'Đắc Nhân Tâm - Nghệ Thuật Thu Phục Lòng Người',
    slug: 'dac-nhan-tam-kinh-dien',
    publicationState: 'ACTIVE',
    categorySlugs: ['ky-nang-song'],
    primaryCategorySlug: 'ky-nang-song',
    authorSlugs: ['dale-carnegie'],
    publisherSlug: 'nxb-the-gioi',
    shortDescription: 'Cuốn sách nghệ thuật ứng xử, giao tiếp và kết nối bền chặt giữa người với người',
    description: 'Cuốn cẩm nang kinh điển về kỹ năng giao tiếp, lắng nghe chân thành và xây dựng niềm tin với đối tác, bạn bè và đồng nghiệp',
    language: 'Tiếng Việt',
    pageCount: 320,
    isFeatured: true,
    images: [
      {
        path: '/product-images/dac-nhan-tam.jpg',
        altText: 'Đắc Nhân Tâm',
        role: 'cover',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'M6D-LOW-STOCK',
        isbn: '9786042220033',
        name: 'Bản Bìa Mềm Tái Bản',
        coverType: 'paperback',
        listPrice: 120000,
        salePrice: 99000,
        isActive: true,
        onHandQuantity: 15,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
  },
];

export const demoCustomer = {
  username: 'hkt_customer',
  email: 'customer@hktstore.vn',
  phone: '+84988000001',
  fullName: 'Khách Hàng HKT',
  password: 'HktCustomer123',
} as const;

export const demoStaff = {
  username: 'hkt_staff',
  email: 'staff@hktstore.vn',
  phone: '+84988000002',
  fullName: 'Nhân Viên HKT Store',
  password: 'HktStaff123',
} as const;

export const demoAdmin = {
  username: 'hkt_admin',
  email: 'admin@hktstore.vn',
  phone: '+84988000003',
  fullName: 'Quản Trị Viên HKT',
  password: 'HktAdmin123',
} as const;

export const demoOrderNumbers = [
  'HKT-ORD-1001',
  'HKT-ORD-1002',
  'HKT-ORD-1003',
  'HKT-ORD-1004',
  'HKT-ORD-2001',
  'HKT-ORD-2002',
  'HKT-ORD-3001',
  'HKT-ORD-3002',
] as const;

export const money = (value: number): Prisma.Decimal => new Prisma.Decimal(value);