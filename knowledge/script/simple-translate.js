const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { supportedLanguages } = require("../../data/languages");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1",
});

// 配置要翻译的文件夹
const FOLDERS_TO_TRANSLATE = [
  "gemini-25-flash-image"
];

/**
 * 超级简化版翻译函数 - 一次性翻译整个JSON
 */
async function translateJsonFile(sourceContent, targetLang) {
  const prompt = `请将以下JSON内容翻译成${targetLang}。

重要规则：
1. 保持JSON结构完全不变
2. 只翻译文本内容，不要翻译技术字段
3. 不要翻译以下内容：
   - URL路径 (http开头、/开头)
   - 图片文件名 (.jpg, .png, .webp等)
   - 图标名称 (icon字段)
   - 技术字段 (url, src, alt等)
4. 确保翻译的专业性和一致性
5. 保持品牌名称不变 (如Gemini, ImageGPT.io等)
6. 返回完整的JSON，格式与输入完全相同

JSON内容：
${JSON.stringify(sourceContent, null, 2)}`;

  try {
    console.log(`🚀 正在翻译为${targetLang}... (整体翻译模式)`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "你是一个专业的翻译专家，专门负责将技术文档和营销内容进行高质量翻译。请严格按照用户的要求进行翻译，保持JSON格式不变。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // 降低随机性，提高一致性
    });

    const translatedContent = response.choices[0].message.content;
    
    // 尝试解析返回的JSON
    try {
      return JSON.parse(translatedContent);
    } catch (parseError) {
      // 如果解析失败，尝试提取JSON部分
      console.log("⚠️ AI返回格式需要清理，正在提取JSON...");
      const jsonMatch = translatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("无法解析AI返回的JSON");
    }
    
  } catch (error) {
    console.error(`❌ 翻译失败 (${targetLang}):`, error.message);
    throw error;
  }
}

/**
 * 翻译单个文件
 */
async function translateFile(sourcePath, targetLang) {
  try {
    console.log(`\n📖 读取源文件: ${sourcePath}`);
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

    const targetPath = path.join(
      path.dirname(sourcePath), 
      `${targetLang}.json`
    );

    console.log(`📝 目标文件: ${targetPath}`);

    // 一次性翻译整个JSON
    const translatedContent = await translateJsonFile(sourceContent, targetLang);

    // 写入翻译结果
    fs.writeFileSync(
      targetPath,
      JSON.stringify(translatedContent, null, 4),
      "utf-8"
    );

    console.log(`✅ ${targetLang} 翻译完成!`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ 翻译${targetLang}失败:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 翻译整个项目文件夹
 */
async function translateLandingPage(folderName) {
  const baseDir = path.join(process.cwd(), "i18n", "pages", "landing", folderName);
  const sourceFile = path.join(baseDir, "en.json");

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ 源文件不存在: ${sourceFile}`);
    return;
  }

  console.log(`\n🌐 开始翻译项目: ${folderName}`);
  console.log(`📂 源文件夹: ${baseDir}`);

  // 获取需要翻译的语言 (跳过英语)
  const languagesToTranslate = supportedLanguages.filter(
    (lang) => lang.code !== "en"
  );

  console.log(`🔄 需要翻译 ${languagesToTranslate.length} 种语言`);

  // 逐个翻译 (避免API限流)
  for (const lang of languagesToTranslate) {
    console.log(`\n📍 正在处理: ${lang.name} (${lang.code})`);
    const result = await translateFile(sourceFile, lang.code);
    
    if (!result.success) {
      console.error(`❌ ${lang.name} 翻译失败: ${result.error}`);
    }
    
    // 短暂暂停避免API限流
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`\n🎉 项目 ${folderName} 翻译完成!`);
}

/**
 * 主函数
 */
async function main() {
  if (!process.env.TUZI_OPENAI_API_KEY) {
    console.error("❌ 请设置 TUZI_OPENAI_API_KEY 环境变量");
    process.exit(1);
  }

  console.log("🚀 启动简化版翻译脚本...");
  console.log("💡 特点: 整体翻译，一次性API调用，高效率高一致性\n");

  for (const folder of FOLDERS_TO_TRANSLATE) {
    await translateLandingPage(folder);
  }

  console.log("\n🎊 所有翻译任务完成!");
}

// 运行脚本
main().catch(console.error);