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

// Define keywords for which icons will be generated
const menuKeywords = [
  // {
  //   keyword: "add-sound",
  //   prompt: "Create a modern app icon that represents adding sound to videos. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a video or film element with sound waves or audio symbols, with subtle gradients between the primary and secondary colors. The icon should have good contrast and visibility in both light mode (against HSL(250, 30%, 98%) background) and dark mode (against HSL(250, 30%, 8%) background). The image should be in WebP format with a size of 1024x1024 pixels."
  // },
  // {
  //   keyword: "video-upscaler",
  //   prompt: "Create a modern app icon that represents video upscaling or enhancing video quality. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and accent color of HSL(270, 70%, 75%). The design should show a video frame being enhanced or upscaled with quality indicators, with subtle gradients between the primary and accent colors. The icon should have good contrast and visibility in both light mode (against HSL(250, 30%, 98%) background) and dark mode (against HSL(250, 30%, 8%) background). The image should be in WebP format with a size of 1024x1024 pixels."
  // },
  // {
  //   keyword: "face-swap-video",
  //   prompt: "Create a modern app icon that represents face swapping in videos. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and gradient ending with HSL(270, 80%, 60%). The design should show two faces being exchanged or swapped in a video context, with subtle gradients between the primary and gradient end colors. The icon should have good contrast and visibility in both light mode (against HSL(250, 30%, 98%) background) and dark mode (against HSL(250, 30%, 8%) background). The image should be in WebP format with a size of 1024x1024 pixels."
  // }

  // AI Inpainting and Outpainting icons
  // {
  //   keyword: "ai-inpainting",
  //   prompt: "Create a modern app icon in Apple design style that represents AI inpainting technology. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image with a selected area being edited or filled in with AI, featuring clean lines and subtle gradients typical of Apple's design language. The icon should illustrate the concept of editing specific parts of an image. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-outpainting",
  //   prompt: "Create a modern app icon in Apple design style that represents AI outpainting technology. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being extended beyond its original boundaries with AI-generated content, featuring the clean, minimal aesthetic typical of Apple's design language. The icon should illustrate the concept of expanding images beyond their original frame. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },

  // // Free Tools icons with Apple design style
  // {
  //   keyword: "ai-prompt-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents an AI prompt generator. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a text prompt with AI elements or suggestion indicators, featuring clean lines, minimal design, and subtle gradients typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-image-to-prompt",
  //   prompt: "Create a modern app icon in Apple design style that represents converting images to text prompts. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image transforming into text or prompt elements, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-image-to-caption",
  //   prompt: "Create a modern app icon in Apple design style that represents AI generating captions for images. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image with a caption or text being generated below it, featuring the elegant simplicity characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-remove-background",
  //   prompt: "Create a modern app icon in Apple design style that represents removing backgrounds from images. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an object being separated from its background, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-photo-restore",
  //   prompt: "Create a modern app icon in Apple design style that represents photo restoration. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a damaged or old photo being restored to pristine condition, with the refined aesthetics and attention to detail characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-speech-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI speech generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show sound waves or voice patterns with AI elements, featuring the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // // WanVideo Image icons
  // {
  //   keyword: "ai-logo-mockup",
  //   prompt: "Create a modern app icon in Apple design style that represents AI logo mockup generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a logo being placed in various mockup scenarios, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-vector-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI vector graphics generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show vector paths or shapes being created, with the elegant simplicity characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-icon-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI icon generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an icon being created or designed, with the refined aesthetics typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-poster-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI poster generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a poster or artwork being created, with the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-medal-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI medal generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a medal or award being created, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-face-swap",
  //   prompt: "Create a modern app icon in Apple design style that represents AI face swapping. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show faces being exchanged or swapped, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-avatar-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI avatar generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a personalized avatar being created, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-face-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI face generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a realistic face being generated, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-baby-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI baby face generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a baby face being created, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-boyfriend-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI boyfriend face generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a male face being generated, with the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-product-photo-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI product photo generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a product being photographed or rendered, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-virtual-try-on",
  //   prompt: "Create a modern app icon in Apple design style that represents AI virtual try-on. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show clothing or accessories being virtually tried on, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-disney-poster",
  //   prompt: "Create a modern app icon in Apple design style that represents AI Disney-style poster generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a Disney-inspired artwork being created, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "before-and-after-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents before and after image generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a transformation or comparison between two states, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "hair-color-changer",
  //   prompt: "Create a modern app icon in Apple design style that represents AI hair color changing. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show hair color being changed or transformed, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "gender-swap",
  //   prompt: "Create a modern app icon in Apple design style that represents AI gender swapping. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show gender transformation or swapping, with the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-minecraft-image-generator",
  //   prompt: "Create a modern app icon in Apple design style that represents AI Minecraft-style image generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show Minecraft-style pixelated art being created, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // // Magic Tools icons
  // {
  //   keyword: "ai-background-changer",
  //   prompt: "Create a modern app icon in Apple design style that represents AI background changing. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a background being changed or replaced, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-background-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI background removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a background being removed or made transparent, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-logo-background-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI logo background removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a logo's background being removed, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-white-background",
  //   prompt: "Create a modern app icon in Apple design style that represents AI white background generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being placed on a white background, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-blue-background",
  //   prompt: "Create a modern app icon in Apple design style that represents AI blue background generation. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being placed on a blue background, with the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-object-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI object removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an object being removed from an image, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-people-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI people removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show people being removed from an image, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-text-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI text removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show text being removed from an image, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-watermark-remover",
  //   prompt: "Create a modern app icon in Apple design style that represents AI watermark removal. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a watermark being removed from an image, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-uncrop",
  //   prompt: "Create a modern app icon in Apple design style that represents AI image uncropping. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being extended beyond its original boundaries, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },

  

  // // Image Enhancement icons
  // {
  //   keyword: "ai-image-enhancer",
  //   prompt: "Create a modern app icon in Apple design style that represents AI image enhancement. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being enhanced or improved in quality, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-image-upscaler",
  //   prompt: "Create a modern app icon in Apple design style that represents AI image upscaling. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being increased in size or resolution, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-anime-upscaler",
  //   prompt: "Create a modern app icon in Apple design style that represents AI anime upscaling. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show anime-style art being enhanced or upscaled, with the clean, minimal aesthetic typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-denoise-ai",
  //   prompt: "Create a modern app icon in Apple design style that represents AI image denoising. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show noise or grain being removed from an image, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "ai-image-sharpener",
  //   prompt: "Create a modern app icon in Apple design style that represents AI image sharpening. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an image being sharpened or made more crisp, with the minimalist elegance typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // // Video Tools icons
  // {
  //   keyword: "video-upscaler",
  //   prompt: "Create a modern app icon in Apple design style that represents video upscaling. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show a video being enhanced or increased in resolution, with the clean lines and subtle depth typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "add-sound",
  //   prompt: "Create a modern app icon in Apple design style that represents adding sound to videos. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show sound or audio being added to video content, with the refined aesthetics characteristic of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },
  // {
  //   keyword: "face-swap-video",
  //   prompt: "Create a modern app icon in Apple design style that represents face swapping in videos. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show faces being exchanged or swapped in video content, with the elegant simplicity typical of Apple's design language. The icon should have good contrast and visibility in both light mode and dark mode. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // }

  // Deep Nostalgia AI icon
  // {
  //   keyword: "deep-nostalgia-ai",
  //   prompt: "Create a modern app icon in Apple design style that represents Deep Nostalgia AI technology. The icon should use a color scheme with primary color of HSL(250, 80%, 60%) and secondary color of HSL(270, 80%, 65%). The design should show an old photograph coming to life with animated facial movements, capturing the essence of bringing ancestors' photos to life. Include subtle elements that suggest motion or animation within a still image. The icon should follow Apple's clean, minimal aesthetic with good contrast for both light and dark mode visibility. The image should be in WebP format with a size of 1024x1024 pixels with a transparent background."
  // },

  


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
      .webp({ quality: 90 }) // Increased quality for app icon
      .resize(1024, 1024, { // Resize to 1024x1024 for app icon
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
 * Generates an icon using OpenAI's GPT-4 Vision model via chat completions
 * @param {string} prompt - The prompt for icon generation
 * @param {string} keyword - The keyword for the icon
 * @returns {Promise<Buffer>} - The image buffer of the generated icon
 */
async function generateIcon(prompt, keyword) {
  try {
    console.log(`\n[Icon Generation] Starting icon generation for ${keyword}`);
    console.log(`[Icon Generation] Prompt: ${prompt}`);

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
      throw new Error("No icon data received from OpenAI");
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
    console.error(`[Icon Generation] Error generating icon: ${error.message}`);
    throw error;
  }
}

/**
 * Saves an icon to the public/icon directory
 * @param {Buffer} imageBuffer - The image buffer to save
 * @param {string} keyword - The keyword for the icon
 * @returns {Promise<string>} - The file path of the saved icon
 */
async function saveIcon(imageBuffer, keyword) {
  try {
    console.log(`\n[Icon Save] Starting to save icon for ${keyword}`);

    // Create the directory path
    const iconDir = path.join(process.cwd(), "public", "icon");

    console.log(`[Icon Save] Creating directory if it doesn't exist`);
    console.log(`[Icon Save] Icon directory: ${iconDir}`);

    // Ensure directory exists
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
      console.log(`[Icon Save] Created icon directory`);
    }

    // Save the icon
    const fileName = `${keyword}.webp`;
    const filePath = path.join(iconDir, fileName);
    console.log(`[Icon Save] Saving icon to: ${filePath}`);

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`[Icon Save] Icon saved successfully`);

    return filePath;
  } catch (error) {
    console.error(`[Icon Save] Error saving icon: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if an icon already exists
 * @param {string} keyword - The keyword for the icon
 * @returns {boolean} - Whether the icon exists
 */
function checkIconExists(keyword) {
  try {
    const iconDir = path.join(process.cwd(), "public", "icon");
    const fileName = `${keyword}.webp`;
    const filePath = path.join(iconDir, fileName);

    const exists = fs.existsSync(filePath);
    console.log(`[Icon Check] Icon ${exists ? 'exists' : 'does not exist'} for ${keyword}`);
    return exists;
  } catch (error) {
    console.error(`[Icon Check] Error checking icon existence: ${error.message}`);
    return false;
  }
}

// Main function to process all keywords
async function processKeywords() {
  try {
    console.log("\n[Main Process] Starting icon generation process...");
    console.log(`[Main Process] Processing ${menuKeywords.length} keywords`);

    if (!process.env.TUZI_OPENAI_API_KEY) {
      console.error(
        "[Main Process] TUZI_OPENAI_API_KEY is not set in environment variables"
      );
      process.exit(1);
    }

    // Process each keyword
    for (const { keyword, prompt } of menuKeywords) {
      console.log(`\n[Main Process] Processing icon for: ${keyword}`);

      try {
        if (!checkIconExists(keyword)) {
          const imageBuffer = await generateIcon(prompt, keyword);
          await saveIcon(imageBuffer, keyword);
          console.log(`[Main Process] Successfully generated icon for ${keyword}`);
        } else {
          console.log(`[Main Process] Icon already exists for ${keyword}, skipping generation`);
        }
      } catch (error) {
        console.error(
          `[Main Process] Failed to generate icon for ${keyword}:`,
          error.message
        );
        continue;
      }
    }

    console.log("\n[Main Process] Icon generation process completed");
  } catch (error) {
    console.error("[Main Process] Error in main process:", error.message);
    process.exit(1);
  }
}

// Run the script
processKeywords().catch(console.error);
