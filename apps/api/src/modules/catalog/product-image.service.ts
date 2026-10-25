import { Readable } from 'node:stream';
import { fileTypeFromBuffer } from 'file-type';
import { v2 as cloudinary } from 'cloudinary';
import type { Environment } from '../../config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';

export interface UploadedProductAsset {
  url: string;
  publicId: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}
export interface ProductImageAdapter {
  upload(buffer: Buffer, mimeType: UploadedProductAsset['mimeType']): Promise<UploadedProductAsset>;
  destroy(publicId: string): Promise<void>;
}

export const validateProductImage = async (
  file: Express.Multer.File,
): Promise<UploadedProductAsset['mimeType']> => {
  if (file.size < 1 || file.size > 5 * 1024 * 1024)
    throw new AppError(400, 'CATALOG_IMAGE_INVALID', 'Ảnh phải nhỏ hơn hoặc bằng 5 MB');
  const actual = await fileTypeFromBuffer(file.buffer);
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!actual || !allowed.has(actual.mime) || actual.mime !== file.mimetype)
    throw new AppError(400, 'CATALOG_IMAGE_INVALID', 'Định dạng ảnh không hợp lệ');
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const extensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };
  if (!extension || !extensions[actual.mime]?.includes(extension))
    throw new AppError(400, 'CATALOG_IMAGE_INVALID', 'Phần mở rộng ảnh không hợp lệ');
  return actual.mime as UploadedProductAsset['mimeType'];
};

export class CloudinaryProductImageAdapter implements ProductImageAdapter {
  constructor(private readonly environment: Environment) {
    if (
      environment.CLOUDINARY_CLOUD_NAME &&
      environment.CLOUDINARY_API_KEY &&
      environment.CLOUDINARY_API_SECRET
    )
      cloudinary.config({
        cloud_name: environment.CLOUDINARY_CLOUD_NAME,
        api_key: environment.CLOUDINARY_API_KEY,
        api_secret: environment.CLOUDINARY_API_SECRET,
        secure: true,
      });
  }
  private assertConfigured(): void {
    if (
      !this.environment.CLOUDINARY_CLOUD_NAME ||
      !this.environment.CLOUDINARY_API_KEY ||
      !this.environment.CLOUDINARY_API_SECRET
    )
      throw new AppError(503, 'CATALOG_IMAGE_UNAVAILABLE', 'Dịch vụ ảnh chưa được cấu hình');
  }
  async upload(
    buffer: Buffer,
    mimeType: UploadedProductAsset['mimeType'],
  ): Promise<UploadedProductAsset> {
    this.assertConfigured();
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: this.environment.CLOUDINARY_PRODUCT_FOLDER ?? 'hktstore/products',
            resource_type: 'image',
          },
          (error, value) =>
            error || !value
              ? reject(error instanceof Error ? error : new Error('Cloudinary upload failed'))
              : resolve(value),
        );
        Readable.from(buffer).pipe(stream);
      },
    );
    return {
      url: result.secure_url,
      publicId: result.public_id,
      mimeType,
      sizeBytes: buffer.length,
    };
  }
  async destroy(publicId: string): Promise<void> {
    this.assertConfigured();
    if (!publicId.startsWith(`${this.environment.CLOUDINARY_PRODUCT_FOLDER ?? 'hktstore/products'}/`))
      throw new AppError(400, 'CATALOG_IMAGE_SCOPE_INVALID', 'Asset ngoài Product namespace');
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}

export class FakeProductImageAdapter implements ProductImageAdapter {
  upload(
    buffer: Buffer,
    mimeType: UploadedProductAsset['mimeType'],
  ): Promise<UploadedProductAsset> {
    const assetId = crypto.randomUUID();
    return Promise.resolve({
      url: `https://example.invalid/${assetId}.webp`,
      publicId: `hktstore/products/${assetId}`,
      mimeType,
      sizeBytes: buffer.length,
    });
  }
  destroy(publicId: string): Promise<void> {
    void publicId;
    return Promise.resolve();
  }
}