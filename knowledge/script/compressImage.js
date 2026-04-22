const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config();

// Cloudflare R2 configuration
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Define keywords to process
const searchKeywords = [
  // "loginform",
  // "image-translator",
  // "document-translator"
  // "wanx-ai-video-generator",
  // "wanx-image-to-video-generator",
  // "hailuo-ai-text-to-video",
  // "hailuo-ai-image-to-video",
  // "ai-image-generator"
  // "ai-compress-image"


  // "unblur-images"
  // "ai-blur-remover"
  // "blur-to-clear"
  //"flux-krea-dev",
  //"ai-clothes-changer",
  //"polybuzz-ai",

  // "remove-text-from-image",
  "wan-2-7-image",


  
];

/**
 * Compresses an image buffer using Sharp
 * @param {Buffer} imageBuffer - The image buffer to compress
 * @returns {Promise<Buffer>} - The compressed image buffer
 */
async function compressImage(imageBuffer) {
  try {
    console.log(`[Image Compression] Starting image compression`);
    const compressedBuffer = await sharp(imageBuffer)
      .webp({ quality: 80 }) // 设置 WebP 质量为 80%
      .resize(1920, 1080, { // 限制最大尺寸为 1920x1080
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();
    
    console.log(`[Image Compression] Compression completed. Original size: ${imageBuffer.length} bytes, Compressed size: ${compressedBuffer.length} bytes`);
    return compressedBuffer;
  } catch (error) {
    console.error(`[Image Compression] Error compressing image: ${error.message}`);
    throw error;
  }
}

/**
 * Uploads an image to Cloudflare R2
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {string} keyword - The keyword for the landing page
 * @param {string} fileName - The name of the file
 * @returns {Promise<string>} - The URL of the uploaded image
 */
async function uploadToCloudflare(imageBuffer, keyword, fileName) {
  try {
    console.log(`\n[Cloudflare Upload] Starting upload for ${keyword}/${fileName}`);

    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
    const fileKey = `${keyword}/${fileName}`;

    console.log(`[Cloudflare Upload] Bucket: ${bucketName}`);
    console.log(`[Cloudflare Upload] File key: ${fileKey}`);
    console.log(`[Cloudflare Upload] File size: ${imageBuffer.length} bytes`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: imageBuffer,
        ContentType: "image/webp",
      })
    );

    const uploadedUrl = `https://${process.env.CLOUDFLARE_CDN_DOMAIN}/${fileKey}`;
    console.log(`[Cloudflare Upload] Upload successful`);
    console.log(`[Cloudflare Upload] CDN URL: ${uploadedUrl}`);

    return uploadedUrl;
  } catch (error) {
    console.error(`[Cloudflare Upload] Error uploading to Cloudflare: ${error.message}`);
    throw error;
  }
}

/**
 * Processes all images in a directory
 * @param {string} keyword - The keyword for the landing page
 * @returns {Promise<void>}
 */
async function processImagesForKeyword(keyword) {
  try {
    console.log(`\n[Main Process] Processing images for keyword: ${keyword}`);
    
    const docDir = path.join(process.cwd(), "knowledge", "doc", keyword);
    const imagesDir = path.join(docDir, "images");

    if (!fs.existsSync(imagesDir)) {
      console.log(`[Main Process] No images directory found for ${keyword}`);
      return;
    }

    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => 
      file.endsWith('.jpg') || 
      file.endsWith('.jpeg') || 
      file.endsWith('.png') ||
      file.endsWith('.webp')
    );

    if (imageFiles.length === 0) {
      console.log(`[Main Process] No images found in ${imagesDir}`);
      return;
    }

    console.log(`[Main Process] Found ${imageFiles.length} images to process`);

    for (const file of imageFiles) {
      try {
        console.log(`\n[Image Process] Processing ${file}`);
        
        // Read the original image
        const filePath = path.join(imagesDir, file);
        const imageBuffer = fs.readFileSync(filePath);
        
        // Compress the image
        const compressedBuffer = await compressImage(imageBuffer);
        
        // Save the compressed image locally
        const newFileName = file.replace(/\.(jpg|jpeg|png)$/, '.webp');
        const newFilePath = path.join(imagesDir, newFileName);
        fs.writeFileSync(newFilePath, compressedBuffer);
        
        // Upload to Cloudflare
        await uploadToCloudflare(compressedBuffer, keyword, newFileName);
        
        // Remove the original file if it's not already a webp
        if (!file.endsWith('.webp')) {
          fs.unlinkSync(filePath);
        }
        
        console.log(`[Image Process] Successfully processed ${file}`);
      } catch (error) {
        console.error(`[Image Process] Error processing ${file}: ${error.message}`);
        continue;
      }
    }
  } catch (error) {
    console.error(`[Main Process] Error processing images for ${keyword}: ${error.message}`);
    throw error;
  }
}

// Main function to process all keywords
async function processKeywords() {
  try {
    console.log("\n[Main Process] Starting image compression process...");
    console.log(`[Main Process] Processing ${searchKeywords.length} keywords`);

    if (!process.env.CLOUDFLARE_ACCESS_KEY_ID || !process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
      console.error("[Main Process] Cloudflare credentials are not set in environment variables");
      process.exit(1);
    }

    for (const keyword of searchKeywords) {
      try {
        await processImagesForKeyword(keyword);
        console.log(`[Main Process] Successfully processed images for ${keyword}`);
      } catch (error) {
        console.error(`[Main Process] Failed to process images for ${keyword}: ${error.message}`);
        continue;
      }
    }

    console.log("\n[Main Process] Image compression process completed");
  } catch (error) {
    console.error("[Main Process] Error in main process:", error.message);
    process.exit(1);
  }
}

// Run the script
processKeywords().catch(console.error);
