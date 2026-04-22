const OpenAI = require("openai");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1",
});

// Cloudflare R2 configuration
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Define keywords for which images will be generated
const searchKeywords = [
  //   "video-upscaler",
  // "add-sound-to-video",
  // "face-swap-video",
  // "consistent-character-video",
  // "wanx-ai-video-generator",
  // "wanx-image-to-video-generator",
  // "hailuo-ai-text-to-video",
  // "hailuo-ai-image-to-video",
  // "ai-action-figure-generator",
  // "ai-anime-upscaler",
  // "ai-background-changer",
  // "ai-background-remover",
  // "ai-blue-background",
  // "ai-denoise-ai",
  // "ai-disney-poster",
  // "ai-french-kiss-video-generator",
  // "ai-hug-video",
  // "ai-image-enhancer",
  // "ai-image-generator",
  // "ai-image-sharpener",
  // "ai-image-upscaler",
  // "ai-inpainting",
  // "ai-kissing-video-generator",
  // "ai-medal-generator",
  // "ai-object-remover",
  // "ai-outpainting",
  // "ai-poster-generator",
  // "ai-remove-background",
  // "ai-white-background",
  // "gpt-4o-image-generator",
  // "gpt-4o-style-image-generator",
  // "image-to-video-ai",
  // "text-to-video-ai",

  // "runway",
  // "pollo-ai",
  // "hailuo-ai",
  // "kling-ai",
  // "vidu-ai",
  // "pixverse-ai",
  // "wan-ai-video",
  // "luma-ai",
  // "pika-ai",
  // "ai-kissing-video-generator"

  // "ai-hairstyle-changer",
  // "restore-old-photos",
  // "professional-headshots",
  // "remove-text-from-image",
  // "portrait-poses"

/*   "unblur-images",
  "ai-blur-remover",
 "blur-to-clear" */
 //"spongebob-meme",
 //"pet-to-human"

 //"ai-clothes-changer",
 //"polybuzz-ai",

 "ai-superhero-generator",
];

/**
 * Saves an image buffer to the local filesystem
 * @param {Buffer} imageBuffer - The image buffer to save
 * @param {string} keyword - The keyword for the landing page
 * @param {string} sectionType - The type of section (hero, feature, etc.)
 * @param {number} index - The index of the image in the section
 * @returns {Promise<string>} - The local file path
 */
async function saveImageLocally(imageBuffer, keyword, sectionType, index) {
  try {
    console.log(
      `\n[Local Storage] Starting to save image for ${keyword}/${sectionType}_${index}`
    );

    // Create the directory path
    const docDir = path.join(process.cwd(), "knowledge", "doc", keyword);
    const imagesDir = path.join(docDir, "images");

    console.log(`[Local Storage] Creating directories if they don't exist`);
    console.log(`[Local Storage] Doc directory: ${docDir}`);
    console.log(`[Local Storage] Images directory: ${imagesDir}`);

    // Ensure directories exist
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
      console.log(`[Local Storage] Created doc directory`);
    }
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log(`[Local Storage] Created images directory`);
    }

    // Save the image
    const fileName = `${sectionType}_${index}.webp`;
    const filePath = path.join(imagesDir, fileName);
    console.log(`[Local Storage] Saving image to: ${filePath}`);

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`[Local Storage] Image saved successfully`);

    return filePath;
  } catch (error) {
    console.error(
      `[Local Storage] Error saving image locally: ${error.message}`
    );
    throw error;
  }
}

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
 * Generates an image using OpenAI's GPT-4 Vision model via chat completions
 * @param {string} prompt - The prompt for image generation
 * @param {string} keyword - The keyword for the landing page
 * @param {string} sectionType - The type of section (hero, feature, etc.)
 * @param {number} index - The index of the image in the section
 * @returns {Promise<string>} - The URL of the generated image
 */
async function generateImage(prompt, keyword, sectionType, index) {
  try {
    console.log(
      `\n[Image Generation] Starting image generation for ${keyword}/${sectionType}_${index}`
    );
    console.log(`[Image Generation] Prompt: ${prompt}`);

    console.log(`[OpenAI API] Calling chat completions API...`);
    const response = await openai.chat.completions.create({
      model: "nano-banana",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      stream: false,
    });

    console.log(`[OpenAI API] Response received`);
    console.log(`[OpenAI API] Response ID: ${response.id}`);
    console.log(`[OpenAI API] Model used: ${response.model}`);

    if (
      !response.choices ||
      !response.choices[0] ||
      !response.choices[0].message ||
      !response.choices[0].message.content
    ) {
      throw new Error("No image data received from OpenAI");
    }

    // Extract image URL from markdown content
    const content = response.choices[0].message.content;
    console.log(`[OpenAI API] Extracting image URL from response content`);

    const imageUrlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s]+)\)/);

    if (!imageUrlMatch || !imageUrlMatch[1]) {
      throw new Error("No image URL found in response");
    }

    const imageUrl = imageUrlMatch[1];
    console.log(`[OpenAI API] Image URL extracted: ${imageUrl}`);

    // Download the image
    console.log(`[Image Download] Starting image download from URL`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    console.log(`[Image Download] Image downloaded successfully`);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    console.log(`[Image Download] Image size: ${imageBuffer.length} bytes`);

    // Compress the image before saving and uploading
    const compressedBuffer = await compressImage(imageBuffer);

    // Save compressed image locally
    const localPath = await saveImageLocally(
      compressedBuffer,
      keyword,
      sectionType,
      index
    );

    // Upload compressed image to Cloudflare
    const uploadedImageUrl = await uploadToCloudflare(
      compressedBuffer,
      keyword,
      sectionType,
      index
    );

    return uploadedImageUrl;
  } catch (error) {
    console.error(
      `[Image Generation] Error generating image: ${error.message}`
    );
    throw error;
  }
}

/**
 * Uploads an image to Cloudflare R2
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {string} keyword - The keyword for the landing page
 * @param {string} sectionType - The type of section (hero, feature, etc.)
 * @param {number} index - The index of the image in the section
 * @returns {Promise<string>} - The URL of the uploaded image
 */
async function uploadToCloudflare(imageBuffer, keyword, sectionType, index) {
  try {
    console.log(
      `\n[Cloudflare Upload] Starting upload for ${keyword}/${sectionType}_${index}`
    );

    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
    const fileName = `${keyword}/${sectionType}_${index}.webp`;

    console.log(`[Cloudflare Upload] Bucket: ${bucketName}`);
    console.log(`[Cloudflare Upload] File name: ${fileName}`);
    console.log(`[Cloudflare Upload] File size: ${imageBuffer.length} bytes`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: imageBuffer,
        ContentType: "image/webp",
      })
    );

    const uploadedUrl = `https://${process.env.CLOUDFLARE_CDN_DOMAIN}/${fileName}`;
    console.log(`[Cloudflare Upload] Upload successful`);
    console.log(`[Cloudflare Upload] CDN URL: ${uploadedUrl}`);

    return uploadedUrl;
  } catch (error) {
    console.error(
      `[Cloudflare Upload] Error uploading to Cloudflare: ${error.message}`
    );
    throw error;
  }
}

/**
 * Reads the landing page JSON file for a given keyword
 * @param {string} keyword - The keyword for the landing page
 * @returns {Promise<Object>} - The landing page JSON content
 */
async function readLandingPageJson(keyword) {
  try {
    console.log(`\n[File Read] Reading landing page JSON for ${keyword}`);
    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const filePath = path.join(
      process.cwd(),
      "i18n",
      "pages",
      "landing",
      dirName,
      "en.json"
    );

    console.log(`[File Read] Reading file from: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Landing page JSON file not found for ${keyword}`);
    }

    const content = fs.readFileSync(filePath, "utf8");
    const jsonContent = JSON.parse(content);
    console.log(`[File Read] Successfully read and parsed JSON file`);
    return jsonContent;
  } catch (error) {
    console.error(
      `[File Read] Error reading landing page JSON: ${error.message}`
    );
    throw error;
  }
}

/**
 * Checks if an image already exists locally
 * @param {string} keyword - The keyword for the landing page
 * @param {string} sectionType - The type of section (hero, feature, etc.)
 * @param {number} index - The index of the image in the section
 * @returns {boolean} - Whether the image exists
 */
function checkImageExists(keyword, sectionType, index) {
  try {
    const docDir = path.join(process.cwd(), "knowledge", "doc", keyword);
    const imagesDir = path.join(docDir, "images");
    const fileName = `${sectionType}_${index}.webp`;
    const filePath = path.join(imagesDir, fileName);

    const exists = fs.existsSync(filePath);
    console.log(`[Image Check] ${sectionType} image ${index} ${exists ? 'exists' : 'does not exist'} for ${keyword}`);
    return exists;
  } catch (error) {
    console.error(`[Image Check] Error checking image existence: ${error.message}`);
    return false;
  }
}

/**
 * Generates images for a landing page based on its JSON content
 * @param {string} keyword - The keyword for the landing page
 * @returns {Promise<Object>} - The landing page with updated image URLs
 */
async function generateImagesForLandingPage(keyword) {
  try {
    console.log(`\n[Main Process] Starting image generation for landing page: ${keyword}`);
    
    // Read the landing page JSON
    const landingPage = await readLandingPageJson(keyword);
    
    // Generate hero image
    // if (landingPage.hero) {
    //   console.log(`[Image Generation] Processing hero image`);
    //   if (!checkImageExists(keyword, "hero", 1)) {
    //     console.log(`[Image Generation] Generating hero image`);
        
    //     // Enhanced prompt for hero image
    //     const heroPrompt = `Create a professional hero image that visually represents the concept of ${landingPage.hero.title}. 
    //     The image should capture the essence of: ${landingPage.hero.description}
    //     Important requirements:
    //     - Maintain a 4:3 aspect ratio (width:height)
    //     - Create a visually striking and engaging composition that embodies the core concept
    //     - Use a modern, clean design style with ample white space
    //     - Focus on visual storytelling that communicates the main purpose
    //     - Use a professional color scheme that matches the landing page's theme
    //     - Ensure the image is suitable for both desktop and mobile viewing
    //     - Add subtle shadows and depth to make the image more engaging
    //     - Include relevant visual elements that demonstrate the tool's functionality
    //     - Make the image immediately communicate the tool's value through visuals only
    //     - Consider adding a subtle gradient or overlay for better visual appeal
    //     - Ensure the image works well as a background for text content`;
        
    //     const heroImageUrl = await generateImage(heroPrompt, keyword, "hero", 1);
    //     landingPage.hero.images[0] = heroImageUrl;
    //     console.log(`[Image Generation] Hero image generated and URL updated`);
    //   } else {
    //     console.log(`[Image Generation] Hero image already exists, skipping generation`);
    //   }
    // }

    // Generate feature section images
    if (landingPage.sections) {
      console.log(`[Image Generation] Processing feature section images`);
      for (let i = 0; i < landingPage.sections.length; i++) {
        const section = landingPage.sections[i];
        if (section.media && section.media.type === "image") {
          console.log(`[Image Generation] Checking feature image ${i + 1} existence`);
          if (!checkImageExists(keyword, "feature", i + 1)) {
            console.log(`[Image Generation] Generating feature image ${i + 1}`);
            
            // Enhanced prompt for feature images
            const featurePrompt = `Create a professional image that visually represents the concept of ${section.title}. 
            The image should capture the essence of: ${section.descriptions[0].text}
            Important requirements:
            - Maintain a 4:3 aspect ratio (width:height)
            - Create a visual representation that embodies the feature's purpose
            - Use a clean, minimalist design style
            - Focus on showing the feature's functionality through visuals
            - If the feature involves a comparison or transformation, show the visual difference
            - Use a professional color scheme that matches the landing page's theme
            - Ensure the image is suitable for both desktop and mobile viewing
            - Add subtle shadows and depth to make the image more engaging
            - Include relevant visual elements that demonstrate the feature's value
            - Make the image self-explanatory without any text`;
            
            const featureImageUrl = await generateImage(featurePrompt, keyword, "feature", i + 1);
            section.media.src = featureImageUrl;
            console.log(`[Image Generation] Feature image ${i + 1} generated and URL updated`);
          } else {
            console.log(`[Image Generation] Feature image ${i + 1} already exists, skipping generation`);
          }
        }
      }
    }

    if (landingPage.benefits) {
      console.log(`[Image Generation] Processing benefits section images`);
      for (let i = 0; i < landingPage.benefits.length; i++) {
        const section = landingPage.benefits[i];
        if (section.media && section.media.type === "image") {
          console.log(`[Image Generation] Checking benefit image ${i + 1} existence`);
          if (!checkImageExists(keyword, "benefit", i + 1)) {
            console.log(`[Image Generation] Generating benefit image ${i + 1}`);
            
            // Enhanced prompt for benefit images
            const benefitPrompt = `Create a professional image that visually represents the concept of ${section.title}. 
            The image should capture the essence of: ${section.descriptions[0].text}
            Important requirements:
            - Maintain a 4:3 aspect ratio (width:height)
            - Create a visual scene that embodies the benefit's value
            - Show the real-world impact or outcome through visuals
            - Use a warm and inviting color palette
            - Focus on visual storytelling that makes the benefit tangible
            - If the benefit involves a transformation, show the positive visual outcome
            - Add subtle visual cues that reinforce the benefit's value
            - Ensure the image is emotionally engaging and relatable
            - Include relevant context or environment to make the benefit more concrete
            - Make the image communicate the benefit's value through visuals only`;
            
            const benefitImageUrl = await generateImage(benefitPrompt, keyword, "benefit", i + 1);
            section.media.src = benefitImageUrl;
            console.log(`[Image Generation] Benefit image ${i + 1} generated and URL updated`);
          } else {
            console.log(`[Image Generation] Benefit image ${i + 1} already exists, skipping generation`);
          }
        }
      }
    }

    // Save the updated JSON back to the file
    console.log(`[File Save] Saving updated JSON with image URLs`);
    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const filePath = path.join(
      process.cwd(),
      "i18n",
      "pages",
      "landing",
      dirName,
      "en.json"
    );
    
    fs.writeFileSync(filePath, JSON.stringify(landingPage, null, 4), "utf8");
    console.log(`[File Save] Updated JSON saved successfully`);

    return landingPage;
  } catch (error) {
    console.error(`[Main Process] Error generating images for landing page: ${error.message}`);
    throw error;
  }
}

// Main function to process all keywords
async function processKeywords() {
  try {
    console.log("\n[Main Process] Starting image generation process...");
    console.log(`[Main Process] Processing ${searchKeywords.length} keywords`);

    if (!process.env.TUZI_OPENAI_API_KEY) {
      console.error(
        "[Main Process] TUZI_OPENAI_API_KEY is not set in environment variables"
      );
      process.exit(1);
    }

    // Process each landing page
    for (const keyword of searchKeywords) {
      console.log(`\n[Main Process] Processing images for: ${keyword}`);

      try {
        await generateImagesForLandingPage(keyword);
        console.log(
          `[Main Process] Successfully generated images for ${keyword}`
        );
      } catch (error) {
        console.error(
          `[Main Process] Failed to generate images for ${keyword}:`,
          error.message
        );
        continue;
      }
    }

    console.log("\n[Main Process] Image generation process completed");
  } catch (error) {
    console.error("[Main Process] Error in main process:", error.message);
    process.exit(1);
  }
}

// Run the script
processKeywords().catch(console.error);
