/**
 * 处理 prompts.json 中的图片
 * 1. 下载图片
 * 2. 压缩并转成 webp
 * 3. 上传到 R2
 * 4. 更新 prompts.json 中的路径
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 配置
const CONFIG = {
  sourceBaseUrl: 'https://opennana.com/awesome-prompt-gallery/',
  r2Folder: 'nano-banana-pro-prompt',
  cdnDomain: process.env.CLOUDFLARE_CDN_DOMAIN || 'storage.apidot.ai',
  tempDir: path.join(__dirname, '..', 'temp-images'),
  promptsJsonPath: path.join(__dirname, '..', 'data', 'prompts.json'),
};

// 初始化 S3 客户端 (R2 兼容 S3 API)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// 确保临时目录存在
function ensureTempDir() {
  if (!fs.existsSync(CONFIG.tempDir)) {
    fs.mkdirSync(CONFIG.tempDir, { recursive: true });
  }
}

// 下载图片到 buffer
function downloadImageToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImageToBuffer(response.headers.location)
          .then(resolve)
          .catch(reject);
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

// 转换为 webp 并压缩 (使用 buffer)
async function convertToWebpBuffer(inputBuffer) {
  return await sharp(inputBuffer)
    .webp({ quality: 80 })
    .toBuffer();
}

// 上传到 R2
async function uploadToR2(buffer, r2Key) {
  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: 'image/webp',
  });
  await s3Client.send(command);
  return `https://${CONFIG.cdnDomain}/${r2Key}`;
}

// 处理单个图片 (使用 buffer，避免文件系统问题)
async function processImage(imagePath) {
  // 获取原始文件名（不含扩展名）
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const webpFileName = `${baseName}.webp`;

  // 构建下载URL
  const downloadUrl = `${CONFIG.sourceBaseUrl}${imagePath}`;

  // R2 key
  const r2Key = `${CONFIG.r2Folder}/${webpFileName}`;

  try {
    console.log(`  下载: ${downloadUrl}`);
    const imageBuffer = await downloadImageToBuffer(downloadUrl);

    console.log(`  转换为 webp: ${webpFileName}`);
    const webpBuffer = await convertToWebpBuffer(imageBuffer);

    console.log(`  上传到 R2: ${r2Key}`);
    const cdnUrl = await uploadToR2(webpBuffer, r2Key);

    return cdnUrl;
  } catch (error) {
    console.error(`  处理失败: ${error.message}`);
    return null;
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('开始处理 prompts.json 中的图片...\n');

  ensureTempDir();

  // 读取 prompts.json
  const promptsData = JSON.parse(fs.readFileSync(CONFIG.promptsJsonPath, 'utf-8'));

  // 用于跟踪已处理的图片，避免重复处理
  const processedImages = new Map();

  let totalImages = 0;
  let successCount = 0;
  let failCount = 0;

  // 处理每个 item
  for (let i = 0; i < promptsData.items.length; i++) {
    const item = promptsData.items[i];
    console.log(`\n[${i + 1}/${promptsData.items.length}] 处理 #${item.id}: ${item.title}`);

    // 收集该 item 中所有需要处理的图片路径
    const imagesToProcess = new Set();

    if (item.images && item.images.length > 0) {
      for (const img of item.images) {
        if (!img.startsWith('http')) {
          imagesToProcess.add(img);
        }
      }
    }

    if (item.coverImage && !item.coverImage.startsWith('http')) {
      imagesToProcess.add(item.coverImage);
    }

    // 处理所有唯一的图片
    for (const imagePath of imagesToProcess) {
      // 检查是否已处理过（全局）
      if (processedImages.has(imagePath)) {
        console.log(`  复用已处理: ${imagePath}`);
        continue;
      }

      totalImages++;

      const cdnUrl = await processImage(imagePath);
      if (cdnUrl) {
        processedImages.set(imagePath, cdnUrl);
        successCount++;
        console.log(`  成功: ${imagePath} -> ${cdnUrl}`);
      } else {
        failCount++;
      }

      // 小延迟避免请求过快
      await delay(100);
    }

    // 更新 item 中的路径
    if (item.images && item.images.length > 0) {
      for (let j = 0; j < item.images.length; j++) {
        const originalPath = item.images[j];
        if (processedImages.has(originalPath)) {
          item.images[j] = processedImages.get(originalPath);
        }
      }
    }

    if (item.coverImage && processedImages.has(item.coverImage)) {
      item.coverImage = processedImages.get(item.coverImage);
    }

    // 每处理 10 个 item 保存一次，防止中断丢失进度
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CONFIG.promptsJsonPath, JSON.stringify(promptsData, null, 2));
      console.log(`\n--- 已保存进度 (${i + 1}/${promptsData.items.length}) ---\n`);
    }
  }

  // 最终保存
  fs.writeFileSync(CONFIG.promptsJsonPath, JSON.stringify(promptsData, null, 2));

  // 清理临时目录
  try {
    fs.rmdirSync(CONFIG.tempDir);
  } catch {}

  console.log('\n========== 处理完成 ==========');
  console.log(`总图片数: ${totalImages}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`prompts.json 已更新`);
}

main().catch(console.error);
