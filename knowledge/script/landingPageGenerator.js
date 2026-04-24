const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1",
});

// Define search keywords for which landing pages will be generated
const searchKeywords = [
  // "ai-anime-upscaler"
  // "ai-action-figure-generator"
  // "ai-avatar-generator"
  // "ai-baby-generator"
  // "ai-background-changer",
  // "ai-background-remover",
  // "ai-blue-background"
  // "ai-boyfriend-generator"
  // "ai-disney-filter-generator"
  // "ai-disney-poster"
  // "ai-face-generator"
  // "ai-face-swap"

  //   "ai-image-enhancer",
  //   "ai-image-to-prompt",
  //   "ai-image-upscaler",
  //   "ai-logo-mockup",
  //   "ai-medal-generator",
  //   "ai-people-remover",
  // "ai-poster-generator",
  //   "ai-product-photo-generator",
  //     "ai-uncrop",
  // "ai-vector-generator",
  // "ai-watermark-remover",
  // "hair-color-changer",
  // "gender-swap"

  // "ai-image-to-caption"

  // "ai-text-remover"

  // "ai-hulk-transformation"

  // "ai-baby-video-generator"

  // "ai-muscle-video-generator"

  // "ai-kissing-video-generator"

  // "ai-dance-video-generator"
  // "change-haircut"
  // "flux-kontext-restore-image
  // "flux-kontext"

  //
  //"spongebob-meme"
  //"ai-clothes-changer",
 //"ai-pet-portrait-generator",
// "remove-text-from-image",
//  "polybuzz-ai",
//    "ai-pet-portrait-generator",
    //"face-swap",
    "ai-character-generator",
    //"ai-watermark-remover",
    //"buzz-cut-filter",
    "ai-image-combiner",

    //"ai-superhero-generator",
    "ai-car-generator",
    //"braces-filter",
    //"ai-outfit-generator",   
];

const brandName = "NanoImg.io";

// const brandEmail = "support@imagegpt.io";

// Function to transform hyphenated keywords to proper title case
function formatKeywordToTitle(keyword) {
  return keyword
    .split("-")
    .map((word) => {
      // Special handling for "ai" to ensure it becomes "AI"
      if (word.toLowerCase() === "ai") {
        return "AI";
      }
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Function to read markdown content from doc folder
async function readDocumentation(keyword) {
  try {
    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const filePath = path.join(
      process.cwd(),
      "knowledge",
      "doc",
      dirName,
      "doc.md"
    );

    if (!fs.existsSync(filePath)) {
      console.error(`Documentation file not found for ${keyword}: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (error) {
    console.error(`Error reading documentation for ${keyword}:`, error);
    return null;
  }
}

// Function to read tool component code
async function readToolComponent(keyword) {
  try {
    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const filePath = path.join(
      process.cwd(),
      "components",
      "tool",
      dirName,
      "index.tsx"
    );

    if (!fs.existsSync(filePath)) {
      console.log(
        `[Tool Component] No tool component file found for ${keyword}, proceeding without it`
      );
      return null;
    }

    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (error) {
    console.log(
      `[Tool Component] Error reading tool component for ${keyword}, proceeding without it:`,
      error
    );
    return null;
  }
}

// Function to generate landing page JSON using OpenAI with streaming
async function generateLandingPage(keyword, docContent, toolComponent) {
  try {
    if (!docContent) {
      console.error(
        `[Landing Page] No documentation content available for ${keyword}`
      );
      return null;
    }

    console.log(`\n[Landing Page] Starting generation for ${keyword}`);
    console.log(
      `[Landing Page] Documentation content length: ${docContent.length} characters`
    );

    // Format keyword for display in titles
    const formattedKeyword = formatKeywordToTitle(keyword);
    console.log(`[Landing Page] Formatted keyword: ${formattedKeyword}`);

    const prompt = `
    I need you to create a landing page content for an AI tool called "${formattedKeyword}" offered by ${brandName}.
    
    Here is the documentation about the tool:
    ${docContent}
    
    ${
      toolComponent
        ? `Here is the actual tool component code that shows the functionality:
    ${toolComponent}`
        : "Note: No tool component code is available, please focus on the documentation content."
    }

    Create a JSON structure for a landing page with the following components:
    
    1. Meta section with title and description (SEO-optimized) - include the brand name ${brandName} in meta description for better SEO
       - Meta title must be less than 60 characters
       - Meta title format must be: "[Tool Name] - [Description]"
       - Meta description must be less than 160 characters
    2. Hero section with title and concise description (1 sentences max) - focus on the tool's core value proposition
    3. 3 feature sections highlighting key benefits based on the documentation
    4. "How it works" section with 3 steps based on the documentation
    5. FAQ section with 6 common questions and answers
       - The FAQ must include at least the following 2 question types (adapt wording to the tool name):
         1. What is ${formattedKeyword}?
         2. How does ${formattedKeyword} work?
       - The remaining FAQ questions should be based on the documentation and actual tool component code
    
    IMPORTANT SEO REQUIREMENTS:
    - The keyword "${formattedKeyword}" must appear at least 3% of the total text content
    - Include variations of the keyword naturally in the content
    - Ensure keyword placement in strategic locations (titles, headings, first paragraph)
    - Maintain natural readability while meeting keyword density requirements
    - Meta title must be less than 60 characters
    - Meta description must be less than 160 characters
    
    The JSON should follow this exact structure:
    {
      "meta": {
        "title": "...", 
        "description": "..." 
      },
      "hero": {
        "title": ${formattedKeyword},
        "description": "...",
        "buttons": [
          {
            "title": "Try ${formattedKeyword}",
            "url": "#",
            "icon": ""
          }
        ],
        "images": [
          "https://storage.apidot.ai/${keyword}/hero_1.webp"
        ]
      },
      "sections": [
        {
          "title": "...",
          "subtitle": "",
          "tag": "Features",
          "media": {
            "type": "image",
            "src": "https://storage.apidot.ai/${keyword}/feature_1.webp",
            "alt": "..."
          },
          "reverse": true,
          "titleCenter": false,
          "descriptions": [
            {
              "text": "..."
            }
          ]
        },
        // Two more similar feature sections...
      ],
      "howItWork": {
        "title": "How to Use ${formattedKeyword}",
        "steps": [
          {
            "title": "...",
            "description": "..."
          },
          // Two more steps...
        ]
      },
      "faq": {
        "title": "FAQs About ${formattedKeyword}",
        "subtitle": "Common questions about our comprehensive AI creative platform",
        "contactText": "Need additional help with ${formattedKeyword}?",
        "contactLinkText": "Contact our support team",
        "items": {
          "0": {
            "question": "...",
            "answer": "..." 
          },
          // Five more Q&A pairs.
        }
      }
    }
    
    IMPORTANT: Your response must be a valid JSON object without any explanation or text before or after the JSON.
    Do not include any explanations, introductions, or additional text in your response.
    Only return the JSON object and nothing else.`;

    console.log(
      `[OpenAI API] Starting streaming chat completions API for landing page content...`
    );
    let fullContent = "";

    const stream = await openai.chat.completions.create({
      model: "claude-sonnet-4-20250514",
      messages: [
        {
          role: "system",
          content: `You are a specialist in creating marketing content for AI tools. Your goal is to create compelling landing pages that convert visitors into users for ${brandName}. You must ensure the keyword density is at least 2% and maintain natural readability. You must ONLY return valid JSON without any explanation text.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      stream: true,
    });

    console.log("----------------------------------------------------------");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // Output to console
        process.stdout.write(content);

        // Add to full content
        fullContent += content;
      }
    }

    console.log("\n----------------------------------------------------------");
    console.log(`\n[OpenAI API] Landing page content generation completed!`);

    // Extract JSON from the response if it contains any text before the JSON object
    let jsonToProcess = fullContent;

    // Try to find the start of the JSON object if the response includes text before it
    const jsonStartIndex = fullContent.indexOf("{");
    if (jsonStartIndex > 0) {
      console.log(
        `[JSON Processing] Found non-JSON text at the beginning of response. Extracting JSON part...`
      );
      jsonToProcess = fullContent.substring(jsonStartIndex);
    }

    // Parse the JSON from the response
    try {
      console.log(`[JSON Processing] Parsing JSON content...`);
      const jsonContent = JSON.parse(jsonToProcess);

      // Validate meta title and description length
      // const metaTitle = jsonContent.meta?.title || '';
      // const metaDescription = jsonContent.meta?.description || '';

      // if (metaTitle.length > 60) {
      //   console.log(`[Meta Validation] Warning: Meta title length (${metaTitle.length}) exceeds 60 characters`);
      //   jsonContent.meta.title = metaTitle.substring(0, 57) + '...';
      // }

      // if (metaDescription.length > 160) {
      //   console.log(`[Meta Validation] Warning: Meta description length (${metaDescription.length}) exceeds 160 characters`);
      //   jsonContent.meta.description = metaDescription.substring(0, 157) + '...';
      // }

      // Validate keyword density
      const totalText = JSON.stringify(jsonContent);
      const keywordCount = (
        totalText.match(new RegExp(formattedKeyword, "gi")) || []
      ).length;
      const totalWords = totalText.split(/\s+/).length;
      const keywordDensity = (keywordCount / totalWords) * 100;

      console.log(
        `[Keyword Density] Current density: ${keywordDensity.toFixed(2)}%`
      );

      if (keywordDensity < 2) {
        console.log(
          `[Keyword Density] Warning: Keyword density (${keywordDensity.toFixed(
            2
          )}%) is below the required 2%`
        );
        // You might want to regenerate the content here if density is too low
      }

      console.log(`[JSON Processing] JSON parsed successfully`);
      return jsonContent;
    } catch (parseError) {
      console.error(
        `[JSON Processing] Error parsing JSON for ${keyword}:`,
        parseError
      );
      console.log("[JSON Processing] Raw response:", fullContent);
      return null;
    }
  } catch (error) {
    console.error(
      `[Landing Page] Error generating landing page for ${keyword}:`,
      error
    );
    return null;
  }
}

// Function to save the generated landing page JSON
async function saveLandingPage(keyword, content) {
  try {
    if (!content) {
      console.error(`[File Save] No content to save for ${keyword}`);
      return false;
    }

    const dirName = keyword.toLowerCase().replace(/\s+/g, "-");
    const dirPath = path.join(
      process.cwd(),
      "i18n",
      "pages",
      "landing",
      dirName
    );

    console.log(
      `[File Save] Creating directory if it doesn't exist: ${dirPath}`
    );
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[File Save] Directory created`);
    }

    const filePath = path.join(dirPath, "en.json");
    console.log(`[File Save] Saving content to: ${filePath}`);

    // Save the JSON content
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4), "utf8");
    console.log(`[File Save] Content saved successfully`);

    return true;
  } catch (error) {
    console.error(
      `[File Save] Error saving landing page for ${keyword}:`,
      error
    );
    return false;
  }
}

// Main function to process all keywords
async function processKeywords() {
  console.log("\n[Main Process] Starting landing page generation process...");
  console.log(`[Main Process] Processing ${searchKeywords.length} keywords`);

  if (!process.env.TUZI_OPENAI_API_KEY) {
    console.error(
      "[Main Process] OPENAI_API_KEY is not set in environment variables"
    );
    process.exit(1);
  }

  for (const keyword of searchKeywords) {
    console.log(`\n[Main Process] Processing landing page for: ${keyword}`);

    // Read documentation content
    console.log(`[Main Process] Reading documentation for ${keyword}`);
    const docContent = await readDocumentation(keyword);

    if (!docContent) {
      console.error(
        `[Main Process] Skipping ${keyword} due to missing documentation`
      );
      continue;
    }

    // Read tool component code (now optional)
    const toolComponent = await readToolComponent(keyword);

    // Generate landing page content
    console.log(`[Main Process] Generating landing page content`);
    const landingPageContent = await generateLandingPage(
      keyword,
      docContent,
      toolComponent
    );

    if (!landingPageContent) {
      console.error(
        `[Main Process] Failed to generate landing page for ${keyword}`
      );
      continue;
    }

    // Save landing page
    console.log(`[Main Process] Saving landing page`);
    const saved = await saveLandingPage(keyword, landingPageContent);

    if (saved) {
      console.log(
        `[Main Process] Successfully generated landing page for ${keyword}`
      );
    } else {
      console.error(
        `[Main Process] Failed to save landing page for ${keyword}`
      );
    }
  }

  console.log("\n[Main Process] Landing page generation process completed");
}

// Run the script
processKeywords().catch(console.error);
