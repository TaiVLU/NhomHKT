import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../modules/auth/auth.crypto.js';
import {
  demoAdmin,
  demoAuthors,
  demoCategories,
  demoCustomer,
  demoOrderNumbers,
  demoProducts,
  demoPublishers,
  demoStaff,
  isActiveMirrorForSeed,
  money,
} from './demo-data.js';
import { buildOrderItemSnapshotSeed } from './order-snapshot.js';

const customerSeoDescription = (name: string): string =>
  `Mua ${name} tại HKT Store với thông tin giá, tồn kho và phiên bản rõ ràng`;

const reserveSlug = async (
  prisma: PrismaClient,
  resourceType: string,
  slug: string,
  resourceId: bigint,
): Promise<void> => {
  await prisma.slugReservation.upsert({
    where: { resourceType_slug: { resourceType, slug } },
    create: { resourceType, slug, resourceId },
    update: { resourceId },
  });
};

const demoOrderSpecs = [
  {
    orderNumber: demoOrderNumbers[0],
    status: 'PENDING_CONFIRMATION',
    paymentStatus: 'UNPAID',
    sku: 'M6D-REGULAR-STANDARD',
    quantity: 1,
    createdAt: null,
  },
  {
    orderNumber: demoOrderNumbers[1],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    sku: 'M6D-DISCOUNT-STANDARD',
    quantity: 1,
    createdAt: null,
  },
  {
    orderNumber: demoOrderNumbers[2],
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    sku: 'M6D-MULTI-PAPER',
    quantity: 2,
    createdAt: null,
  },
  {
    orderNumber: demoOrderNumbers[3],
    status: 'CANCELLED',
    paymentStatus: 'UNPAID',
    sku: 'M6D-LOW-STOCK',
    quantity: 1,
    createdAt: null,
  },
] as const;

const demoOrderNetDeltaBySku = demoOrderSpecs.reduce((totals, spec) => {
  totals.set(
    spec.sku,
    (totals.get(spec.sku) ?? 0) + (spec.status === 'CANCELLED' ? spec.quantity : -spec.quantity),
  );
  return totals;
}, new Map<string, number>());

export const cleanOldDatabase = async (prisma: PrismaClient): Promise<void> => {
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.inventoryLedger.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.productAuthor.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.author.deleteMany({});
  await prisma.publisher.deleteMany({});
  await prisma.slugReservation.deleteMany({});
};

export const seedReferenceData = async (prisma: PrismaClient): Promise<void> => {
  await prisma.category.upsert({
    where: { slug: 'uncategorized' },
    create: {
      name: 'Danh mục chưa phân loại',
      slug: 'uncategorized',
      description: 'Danh mục nội bộ dành cho dữ liệu chưa hoàn thiện',
      isActive: false,
      sortOrder: 0,
    },
    update: {
      name: 'Danh mục chưa phân loại',
      description: 'Danh mục nội bộ dành cho dữ liệu chưa hoàn thiện',
      isActive: false,
      deletedAt: null,
      sortOrder: 0,
    },
  });
};

export const seedDemoCatalog = async (prisma: PrismaClient): Promise<void> => {
  const categoryBySlug = new Map<string, { id: bigint; slug: string }>();
  for (const item of demoCategories) {
    const row = await prisma.category.upsert({
      where: { slug: item.slug },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        deletedAt: item.deletedAt ?? null,
      },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        deletedAt: item.deletedAt ?? null,
      },
    });
    await reserveSlug(prisma, 'CATEGORY', row.slug, row.id);
    categoryBySlug.set(row.slug, row);
  }

  const authorBySlug = new Map<string, { id: bigint; slug: string }>();
  for (const item of demoAuthors) {
    const row = await prisma.author.upsert({
      where: { slug: item.slug },
      create: { name: item.name, slug: item.slug, isActive: true, deletedAt: null },
      update: { name: item.name, isActive: true, deletedAt: null },
    });
    await reserveSlug(prisma, 'AUTHOR', row.slug, row.id);
    authorBySlug.set(row.slug, row);
  }

  const publisherBySlug = new Map<string, { id: bigint; slug: string }>();
  for (const item of demoPublishers) {
    const row = await prisma.publisher.upsert({
      where: { slug: item.slug },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        isActive: true,
        deletedAt: null,
      },
      update: {
        name: item.name,
        description: item.description,
        isActive: true,
        deletedAt: null,
      },
    });
    await reserveSlug(prisma, 'PUBLISHER', row.slug, row.id);
    publisherBySlug.set(row.slug, row);
  }

  for (const item of demoProducts) {
    const primaryCategoryId = item.primaryCategorySlug
      ? (categoryBySlug.get(item.primaryCategorySlug)?.id ?? null)
      : null;
    const publisherId = item.publisherSlug
      ? (publisherBySlug.get(item.publisherSlug)?.id ?? null)
      : null;

    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        language: item.language ?? 'Tiếng Việt',
        pageCount: item.pageCount ?? 200,
        publisherId,
        publicationState: item.publicationState,
        isActive: isActiveMirrorForSeed(item.publicationState),
        primaryCategoryId,
        isFeatured: item.isFeatured ?? false,
        isNew: item.isNew ?? false,
        seoTitle: `${item.name} | HKT Store`.slice(0, 60),
        seoDescription: customerSeoDescription(item.name),
      },
    });
    await reserveSlug(prisma, 'PRODUCT', product.slug, product.id);

    for (const categorySlug of item.categorySlugs) {
      const category = categoryBySlug.get(categorySlug);
      if (category) {
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId: category.id },
        });
      }
    }

    for (const [sortOrder, authorSlug] of item.authorSlugs.entries()) {
      const author = authorBySlug.get(authorSlug);
      if (author) {
        await prisma.productAuthor.create({
          data: { productId: product.id, authorId: author.id, sortOrder },
        });
      }
    }

    for (const variant of item.variants) {
      const row = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variant.sku,
          isbn: variant.isbn,
          name: variant.name,
          coverType: variant.coverType,
          costPrice: money(Math.floor(variant.salePrice * 0.65)),
          listPrice: money(variant.listPrice),
          salePrice: money(variant.salePrice),
          isActive: variant.isActive,
        },
      });

      const initialQuantity =
        variant.onHandQuantity - (demoOrderNetDeltaBySku.get(variant.sku) ?? 0);
      const initialReceiptReason = `Local demo SKU ${variant.sku}: initial stock receipt`;

      await prisma.inventory.create({
        data: {
          productVariantId: row.id,
          onHandQuantity: variant.onHandQuantity,
          reservedQuantity: variant.reservedQuantity,
          lowStockThreshold: variant.lowStockThreshold,
        },
      });

      if (initialQuantity > 0) {
        await prisma.inventoryLedger.create({
          data: {
            inventoryId: row.id,
            adjustmentType: 'RECEIVE_STOCK',
            quantityDelta: initialQuantity,
            beforeQuantity: 0,
            afterQuantity: initialQuantity,
            reason: initialReceiptReason,
          },
        });
      }
    }

    if (item.images && item.images.length > 0) {
      for (const image of item.images) {
        const publicId = `hkt-demo/${item.slug}/${image.role}`;
        const mimeType = image.path.endsWith('.png') ? 'image/png' : 'image/jpeg';

        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: image.path,
            publicId,
            mimeType,
            sizeBytes: 2048,
            altText: image.altText,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          },
        });
      }
    }
  }
};

const ensureDemoUser = async (
  prisma: PrismaClient,
  account: typeof demoCustomer | typeof demoStaff | typeof demoAdmin,
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN',
): Promise<{ id: bigint }> => {
  const passwordHash = await hashPassword(account.password);
  return prisma.user.upsert({
    where: { username: account.username },
    create: {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      passwordHash,
      role,
      status: 'ACTIVE',
    },
    update: {
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      passwordHash,
      role,
      status: 'ACTIVE',
    },
  });
};

export const seedDemoCommerce = async (prisma: PrismaClient): Promise<void> => {
  const customer = await ensureDemoUser(prisma, demoCustomer, 'CUSTOMER');
  await ensureDemoUser(prisma, demoStaff, 'STAFF');
  await ensureDemoUser(prisma, demoAdmin, 'ADMIN');

  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      recipientName: demoCustomer.fullName,
      phone: demoCustomer.phone,
      line1: 'Địa chỉ demo HKT Store',
      ward: 'Phuong Ben Nghe',
      district: 'Quan 1',
      province: 'TP. Ho Chi Minh',
      postalCode: '700000',
      isDefault: true,
    },
  });

  const cart = await prisma.cart.create({
    data: { customerId: customer.id },
  });

  const cartVariant = await prisma.productVariant.findUniqueOrThrow({
    where: { sku: 'M6D-DISCOUNT-STANDARD' },
  });

  await prisma.cartItem.create({
    data: { cartId: cart.id, variantId: cartVariant.id, quantity: 1, unitPrice: money(38000) },
  });

  for (const spec of demoOrderSpecs) {
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { sku: spec.sku },
      include: { inventory: true },
    });
    const snapshot = await buildOrderItemSnapshotSeed(prisma, variant.id, spec.quantity);
    const order = await prisma.order.create({
      data: {
        orderNumber: spec.orderNumber,
        customerId: customer.id,
        shippingAddressId: address.id,
        status: spec.status,
        paymentMethod: 'COD',
        paymentStatus: spec.paymentStatus,
        shippingRecipientName: demoCustomer.fullName,
        shippingPhone: demoCustomer.phone,
        shippingLine1: 'Địa chỉ demo HKT Store',
        shippingWard: 'Phuong Ben Nghe',
        shippingDistrict: 'Quan 1',
        shippingProvince: 'TP. Ho Chi Minh',
        shippingPostalCode: '700000',
        subtotal: money(snapshot.lineTotal),
        total: money(snapshot.lineTotal),
        grandTotal: money(snapshot.lineTotal),
        ...(spec.createdAt ? { createdAt: new Date(spec.createdAt) } : {}),
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
        quantity: spec.quantity,
        unitPrice: money(snapshot.unitEffectivePrice),
        productTitleSnapshot: snapshot.productTitleSnapshot,
        productSlugSnapshot: snapshot.productSlugSnapshot,
        variantNameSnapshot: snapshot.variantNameSnapshot,
        skuSnapshot: snapshot.skuSnapshot,
        isbnSnapshot: snapshot.isbnSnapshot,
        languageSnapshot: snapshot.languageSnapshot,
        coverImageUrlSnapshot: snapshot.coverImageUrlSnapshot,
        primaryCategoryNameSnapshot: snapshot.primaryCategoryNameSnapshot,
        authorNamesSnapshot: snapshot.authorNamesSnapshot,
        publisherNameSnapshot: snapshot.publisherNameSnapshot,
        unitListPrice: money(snapshot.unitListPrice),
        unitSalePrice: snapshot.unitSalePrice === null ? null : money(snapshot.unitSalePrice),
        unitEffectivePrice: money(snapshot.unitEffectivePrice),
        lineTotal: money(snapshot.lineTotal),
      },
    });

    const ledgerReason =
      spec.status === 'CANCELLED'
        ? `Local demo order ${spec.orderNumber}: cancellation restoration history`
        : `Local demo order ${spec.orderNumber}: checkout consumption history`;

    await prisma.inventoryLedger.create({
      data: {
        inventoryId: variant.id,
        adjustmentType:
          spec.status === 'CANCELLED' ? 'ORDER_CANCELLATION_RESTORE' : 'CHECKOUT_CONSUMPTION',
        quantityDelta: spec.status === 'CANCELLED' ? spec.quantity : -spec.quantity,
        beforeQuantity:
          spec.status === 'CANCELLED'
            ? (variant.inventory?.onHandQuantity ?? 0)
            : (variant.inventory?.onHandQuantity ?? 0) + spec.quantity,
        afterQuantity: variant.inventory?.onHandQuantity ?? 0,
        reason: ledgerReason,
        actorUserId: spec.status === 'CANCELLED' ? customer.id : null,
        actorNameSnapshot: spec.status === 'CANCELLED' ? demoCustomer.fullName : null,
        actorEmailSnapshot: spec.status === 'CANCELLED' ? demoCustomer.email : null,
      },
    });
  }
};

export const runDemoSeed = async (prisma: PrismaClient): Promise<void> => {
  await cleanOldDatabase(prisma);
  await seedReferenceData(prisma);
  await seedDemoCatalog(prisma);
  await seedDemoCommerce(prisma);
};