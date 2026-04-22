const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { AimOutlined } = require('@ant-design/icons');
const { Pickaxe } = require('lucide-react');
require('dotenv').config();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  baseURL:"https://api.tu-zi.com/v1",
});

// Search keywords to generate documentation for
const searchKeywords = [

  "GPT Image 2"

];

// Function to create directory if it doesn't exist
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Function to generate documentation using OpenAI with streaming
const generateDocumentation = async (keyword, filePath) => {
  try {
    const prompt = `Gather all information about ${keyword} from the internet and write a detailed documentation about it in markdown format.
    Make the content detailed, well-structured, and include recent information, and use frequently asked questions from the internet.`;

    // Create or clear the file before streaming
    fs.writeFileSync(filePath, '', 'utf8');
    
    let fullContent = '';
    
    const stream = await openai.chat.completions.create({
      model: "grok-3-deepersearch",
      messages: [
        {
          role: "system",
          content: "You are a technical documentation expert who creates comprehensive, well-structured markdown documentation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
      web_search: true
    });
    
    console.log(`\nGenerating documentation for ${keyword}...\n`);
    console.log('----------------------------------------------------------');
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // Append to file
        fs.appendFileSync(filePath, content, 'utf8');
        
        // Output to console
        process.stdout.write(content);
        
        // Add to full content
        fullContent += content;
      }
    }
    
    console.log('\n----------------------------------------------------------');
    console.log(`\nDocumentation for ${keyword} completed!\n`);
    
    return fullContent;
  } catch (error) {
    console.error(`Error generating documentation for ${keyword}:`, error);
    return null;
  }
};

// Main function to process all keywords
const processKeywords = async () => {
  if (!process.env.TUZI_OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }

  const docBasePath = path.join(process.cwd(), 'knowledge', 'doc');

  for (const keyword of searchKeywords) {
    console.log(`Processing documentation for: ${keyword}`);
    
    // Create directory for the keyword
    const dirName = keyword.toLowerCase().replace(/\s+/g, '-');
    const dirPath = path.join(docBasePath, dirName);
    createDirectory(dirPath);

    // Generate documentation with streaming directly to file
    const filePath = path.join(dirPath, 'doc.md');
    await generateDocumentation(keyword, filePath);
    
    console.log(`Documentation saved to: ${filePath}`);
  }
};

// Run the script
processKeywords().catch(console.error);
