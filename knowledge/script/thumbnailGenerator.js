const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Video } = require("lucide-react");
require("dotenv").config();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1",
});

// Define keywords for which thumbnails will be generated
const toolKeywords = [
  // {
  //   keyword: "image-to-video",
  //   prompt: "Create a visually striking thumbnail for an 'Image to Video' AI tool. Show a dynamic transformation process where a static image on the left side is morphing into a vibrant video on the right side. Include visual flow elements or arrows indicating the conversion process. Display multiple frames of the video emerging from the single image, suggesting motion and animation. Use a modern tech aesthetic with a gradient background transitioning from blue to purple. Include subtle UI elements like play buttons, timeline, or editing controls to emphasize the video creation aspect. The composition should clearly illustrate the concept of turning still images into dynamic videos. Add small visual indicators of AI processing, such as subtle circuit patterns or data visualization elements. The image should convey innovation and creativity while maintaining a clean, professional look. The final image should be in WebP format with dimensions of 1200x900 pixels (4:3 ratio)."
  // },
  {
    keyword: "why-choose-wan-ai",
    prompt: "Create a visually striking thumbnail for 'Why Choose Wan AI' section that showcases advanced AI video generation technology. Design a high-tech, professional composition featuring the Wan 2.1 model with visual representations of its superior video quality and coherence. Show a split-screen comparison between Wan AI and other solutions, with Wan AI clearly producing sharper, more vibrant results. Include visual elements representing different video resolutions (480p, 580p, 720p) and aspect ratios (16:9, 9:16). Add a subtle visualization of the low VRAM requirement (8.19 GB) with a small RTX 4090 GPU icon to emphasize consumer accessibility. Use a modern tech aesthetic with a deep blue to purple gradient background, incorporating subtle circuit patterns and AI processing indicators. Include small data visualization elements showing benchmark performance metrics. The image should convey cutting-edge innovation while maintaining a clean, professional look with Alibaba's Tongyi Lab branding subtly integrated. The final image should be in WebP format with dimensions of 1200x900 pixels (4:3 ratio)."
  },
  {
    keyword: "lora-video-effects",
    prompt: "Create a visually striking thumbnail for 'Comprehensive LoRA Video Effects With Wan AI' section. Design a dynamic, creative composition showcasing multiple LoRA model transformations simultaneously being applied to a video. Include visual examples of physical transformations (squish, rotate, inflate), character transformations (princess, samurai, warrior), and artistic style applications, all applied to the same base video in different segments. Show a central interface with a video timeline and multiple LoRA effect options being selected and chained together. Visualize the transformation process with flow lines or particles connecting the original video to the various effect outputs. Use a vibrant, colorful palette with a modern tech aesthetic and a gradient background transitioning from purple to teal. Include subtle UI elements like sliders, effect selectors, and transformation controls to emphasize the customization aspect. Add small visual indicators of the 100+ available pre-trained LoRA models as a library interface element. The image should convey creative freedom and professional-quality results while maintaining a clean, accessible look. The final image should be in WebP format with dimensions of 1200x900 pixels (4:3 ratio)."
  }
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
      .webp({ quality: 85 }) // Balanced quality for thumbnails
      .resize(1200, 900, { // Resize to 4:3 ratio
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
 * Generates a thumbnail using OpenAI's GPT-4 Vision model via chat completions
 * @param {string} prompt - The prompt for thumbnail generation
 * @param {string} keyword - The keyword for the thumbnail
 * @returns {Promise<Buffer>} - The image buffer of the generated thumbnail
 */
async function generateThumbnail(prompt, keyword) {
  try {
    console.log(`\n[Thumbnail Generation] Starting thumbnail generation for ${keyword}`);
    console.log(`[Thumbnail Generation] Prompt: ${prompt}`);

    console.log(`[OpenAI API] Calling chat completions API...`);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-image-vip",
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
      throw new Error("No thumbnail data received from OpenAI");
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

    // Compress the image
    const compressedBuffer = await compressImage(imageBuffer);

    return compressedBuffer;
  } catch (error) {
    console.error(`[Thumbnail Generation] Error generating thumbnail: ${error.message}`);
    throw error;
  }
}

/**
 * Saves a thumbnail to the doc/all-tools directory
 * @param {Buffer} imageBuffer - The image buffer to save
 * @param {string} keyword - The keyword for the thumbnail
 * @returns {Promise<string>} - The file path of the saved thumbnail
 */
async function saveThumbnail(imageBuffer, keyword) {
  try {
    console.log(`\n[Thumbnail Save] Starting to save thumbnail for ${keyword}`);

    // Create the directory path
    const thumbnailDir = path.join(process.cwd(), "knowledge", "doc", "all-tools");

    console.log(`[Thumbnail Save] Creating directory if it doesn't exist`);
    console.log(`[Thumbnail Save] Thumbnail directory: ${thumbnailDir}`);

    // Ensure directory exists
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
      console.log(`[Thumbnail Save] Created thumbnail directory`);
    }

    // Save the thumbnail
    const fileName = `${keyword}.webp`;
    const filePath = path.join(thumbnailDir, fileName);
    console.log(`[Thumbnail Save] Saving thumbnail to: ${filePath}`);

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`[Thumbnail Save] Thumbnail saved successfully`);

    return filePath;
  } catch (error) {
    console.error(`[Thumbnail Save] Error saving thumbnail: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if a thumbnail already exists
 * @param {string} keyword - The keyword for the thumbnail
 * @returns {boolean} - Whether the thumbnail exists
 */
function checkThumbnailExists(keyword) {
  try {
    const thumbnailDir = path.join(process.cwd(), "knowledge", "doc", "all-tools");
    const fileName = `${keyword}.webp`;
    const filePath = path.join(thumbnailDir, fileName);

    const exists = fs.existsSync(filePath);
    console.log(`[Thumbnail Check] Thumbnail ${exists ? 'exists' : 'does not exist'} for ${keyword}`);
    return exists;
  } catch (error) {
    console.error(`[Thumbnail Check] Error checking thumbnail existence: ${error.message}`);
    return false;
  }
}

// Main function to process all keywords
async function processKeywords() {
  try {
    console.log("\n[Main Process] Starting thumbnail generation process...");
    console.log(`[Main Process] Processing ${toolKeywords.length} keywords`);

    if (!process.env.TUZI_OPENAI_API_KEY) {
      console.error(
        "[Main Process] TUZI_OPENAI_API_KEY is not set in environment variables"
      );
      process.exit(1);
    }

    // Process each keyword
    for (const { keyword, prompt } of toolKeywords) {
      console.log(`\n[Main Process] Processing thumbnail for: ${keyword}`);

      try {
        if (!checkThumbnailExists(keyword)) {
          const imageBuffer = await generateThumbnail(prompt, keyword);
          await saveThumbnail(imageBuffer, keyword);
          console.log(`[Main Process] Successfully generated thumbnail for ${keyword}`);
        } else {
          console.log(`[Main Process] Thumbnail already exists for ${keyword}, skipping generation`);
        }
      } catch (error) {
        console.error(
          `[Main Process] Failed to generate thumbnail for ${keyword}:`,
          error.message
        );
        continue;
      }
    }

    console.log("\n[Main Process] Thumbnail generation process completed");
  } catch (error) {
    console.error("[Main Process] Error in main process:", error.message);
    process.exit(1);
  }
}

// Run the script
processKeywords().catch(console.error);
