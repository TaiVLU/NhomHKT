import { v2 as cloudinary } from 'cloudinary';
import { parseEnvironment } from '../config/environment.js';

const environment = parseEnvironment(process.env);
const dryRun = !process.argv.includes('--apply');
if (
  !environment.CLOUDINARY_CLOUD_NAME ||
  !environment.CLOUDINARY_API_KEY ||
  !environment.CLOUDINARY_API_SECRET
)
  throw new Error('Cloudinary environment is not configured.');
cloudinary.config({
  cloud_name: environment.CLOUDINARY_CLOUD_NAME,
  api_key: environment.CLOUDINARY_API_KEY,
  api_secret: environment.CLOUDINARY_API_SECRET,
  secure: true,
});
const prefix = `${environment.CLOUDINARY_PRODUCT_FOLDER}/`;
const rawResult: unknown = await cloudinary.api.resources({
  type: 'upload',
  resource_type: 'image',
  prefix,
  max_results: 500,
});
const result = rawResult as { resources?: Array<{ public_id: string }> };
const assets = (result.resources ?? []).filter((asset) => asset.public_id.startsWith(prefix));
process.stdout.write(
  `${dryRun ? 'DRY RUN' : 'APPLY'}: ${assets.length} Product namespace assets found.\n`,
);
if (!dryRun)
  for (const asset of assets)
    await cloudinary.uploader.destroy(asset.public_id, { resource_type: 'image' });
