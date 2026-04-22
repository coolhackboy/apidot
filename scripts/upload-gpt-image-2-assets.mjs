/**
 * Download, compress, and upload GPT Image 2 landing page images to R2
 *
 * Usage: node scripts/upload-gpt-image-2-assets.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const R2_FOLDER = 'landing/gpt-image-2';
const CDN_DOMAIN = process.env.CLOUDFLARE_CDN_DOMAIN || 'storage.poyo.ai';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Images to download - curated from OpenAI cookbook (official examples)
const IMAGES = [
  {
    name: 'hero',
    url: 'https://developers.openai.com/cookbook/assets/images/photorealism.png',
    description: 'Hero section - photorealistic example',
  },
  {
    name: 'text-rendering',
    url: 'https://developers.openai.com/cookbook/assets/images/infographic_coffee_machine.png',
    description: 'Text rendering - infographic with accurate text',
  },
  {
    name: 'logo-generation',
    url: 'https://developers.openai.com/cookbook/assets/images/logo_generation_1.png',
    description: 'Logo generation example',
  },
  {
    name: 'comic-strip',
    url: 'https://developers.openai.com/cookbook/assets/images/comic-reel.png',
    description: 'Character consistency - comic strip',
  },
  {
    name: 'ui-mockup',
    url: 'https://developers.openai.com/cookbook/assets/images/ui_farmers_market.png',
    description: 'UI mockup / design prototype',
  },
  {
    name: 'product-shot',
    url: 'https://developers.openai.com/cookbook/assets/images/extract_product.png',
    description: 'Product extraction / e-commerce',
  },
  {
    name: 'billboard',
    url: 'https://developers.openai.com/cookbook/assets/images/billboard.png',
    description: 'Billboard mockup with text',
  },
  {
    name: 'landscape',
    url: 'https://developers.openai.com/cookbook/assets/images/realistic_valley.png',
    description: 'Photorealistic landscape',
  },
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function compressToWebp(buffer) {
  return sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function uploadToR2(buffer, r2Key) {
  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: 'image/webp',
  });
  await s3Client.send(command);
  return `https://${CDN_DOMAIN}/${r2Key}`;
}

async function main() {
  console.log('=== GPT Image 2 Asset Upload ===\n');

  const results = {};

  for (const img of IMAGES) {
    const r2Key = `${R2_FOLDER}/${img.name}.webp`;
    try {
      process.stdout.write(`[${img.name}] Downloading... `);
      const buffer = await downloadImage(img.url);
      console.log(`${(buffer.length / 1024).toFixed(0)}KB`);

      process.stdout.write(`[${img.name}] Compressing... `);
      const webpBuffer = await compressToWebp(buffer);
      console.log(`${(webpBuffer.length / 1024).toFixed(0)}KB`);

      process.stdout.write(`[${img.name}] Uploading to R2... `);
      const cdnUrl = await uploadToR2(webpBuffer, r2Key);
      console.log('Done!');
      console.log(`  -> ${cdnUrl}\n`);

      results[img.name] = cdnUrl;
    } catch (err) {
      console.error(`FAILED: ${err.message}\n`);
    }
  }

  console.log('\n=== Upload Results ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
