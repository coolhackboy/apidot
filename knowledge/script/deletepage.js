const fs = require("fs");
const path = require("path");

// Define search keywords for which landing pages will be deleted
const searchKeywords = [
  "ai-action-figure-generator",
  "ai-anime-upscaler",
  "ai-avatar-generator",
  "ai-baby-generator",
  "ai-background-changer",
  "ai-background-remover",
  "ai-blue-background",
  "ai-blur-remover",
  "ai-boyfriend-generator",
  "ai-denoise-ai",
  "ai-disney-filter-generator",
  "ai-disney-poster",
  "ai-face-generator",
  "ai-face-swap",
  "ai-icon-generator",
  "ai-image-enhancer",
  "ai-image-sharpener",
  "ai-image-to-caption",
  "ai-image-to-prompt",
  "ai-image-upscaler",
  "ai-inpainting",
  "ai-logo-background-remover",
  "ai-logo-mockup",
  "ai-medal-generator",
  "ai-minecraft-image-generator",
  "ai-object-remover",
  "ai-outpainting",
  "ai-people-remover",
  "ai-photo-restore",
  "ai-poster-generator",
  "ai-product-photo-generator",
  "ai-prompt-generator",
  "ai-remove-background",
  "ai-speech-generator",
  "ai-text-remover",
  "ai-uncrop",
  "ai-vector-generator",
  "ai-virtual-try-on",
  "ai-watermark-remover",
  "ai-white-background",
  "before-and-after-generator",
  "blur-to-clear",
  "deep-nostalgia-ai",
  "flux-krea-dev",
  "flux-kontext",
  "gender-swap",
  "gemini-25-flash-image",
  "gpt-4o-ghibli-image-generator",
  "gpt-4o-image-edition",
  "gpt-4o-image-generator",
  "gpt-4o-style-image-generator",
  "hair-color-changer",
  "text-to-image",
  "unblur-images"
];

// Define languages to delete
const languages = [
  'es', // Español
  'fr', // Français
  'pt', // Português
  'it', // Italiano
  'ja', // 日本語
  'ko', // 한국어
  'de', // Deutsch
  'nb', // Norsk bokmål
  'da', // Dansk
  'nl', // Nederlands
  'pl', // Polski
  'tr'  // Türkçe
];

// Function to delete landing page JSON files
async function deleteLandingPage(keyword) {
  try {
    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const baseDirPath = path.join(process.cwd(), "i18n", "pages", "landing", dirName);

    // Check if the directory exists
    if (!fs.existsSync(baseDirPath)) {
      console.log(`Directory does not exist for ${keyword}: ${baseDirPath}`);
      return false;
    }

    // Delete JSON files for each language
    for (const lang of languages) {
      const filePath = path.join(baseDirPath, `${lang}.json`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted ${lang}.json for ${keyword}`);
      } else {
        console.log(`File does not exist: ${filePath}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error deleting landing page for ${keyword}:`, error);
    return false;
  }
}

// Main function to process all keywords
async function processKeywords() {
  console.log("Starting landing page deletion process...");

  for (const keyword of searchKeywords) {
    console.log(`Processing deletion for: ${keyword}`);

    // Delete landing page files
    const deleted = await deleteLandingPage(keyword);

    if (deleted) {
      console.log(`Successfully deleted landing page files for ${keyword}`);
    } else {
      console.error(`Failed to delete landing page files for ${keyword}`);
    }
  }

  console.log("Landing page deletion process completed");
}

// Run the script
processKeywords().catch(console.error);
