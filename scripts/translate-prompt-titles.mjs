/**
 * 翻译 prompts.json 中的 title 到英文
 * 添加 titleEn 字段
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  promptsJsonPath: path.join(__dirname, '..', 'data', 'prompts.json'),
  apiKey: process.env.TUZI_OPENAI_API_KEY,
  batchSize: 20, // 每批翻译数量
};

// 检测是否为中文
function isChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// 批量翻译
async function translateBatch(titles) {
  const prompt = `Translate the following Chinese titles to English. Keep them concise and natural. Return ONLY a JSON array of translated strings in the same order, no explanations.

Titles to translate:
${JSON.stringify(titles, null, 2)}`;

  try {
    const response = await fetch('https://api.tu-zi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate Chinese to English accurately and concisely. Return only JSON array format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // 解析 JSON 数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse translation response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Translation error:', error.message);
    return null;
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('开始翻译 prompts.json 中的标题...\n');

  // 读取 prompts.json
  const promptsData = JSON.parse(fs.readFileSync(CONFIG.promptsJsonPath, 'utf-8'));

  // 筛选需要翻译的项目（中文标题且没有 titleEn）
  const itemsToTranslate = promptsData.items.filter(
    item => isChinese(item.title) && !item.titleEn
  );

  console.log(`总共 ${promptsData.items.length} 条记录`);
  console.log(`需要翻译 ${itemsToTranslate.length} 条中文标题\n`);

  if (itemsToTranslate.length === 0) {
    console.log('没有需要翻译的标题');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // 分批处理
  for (let i = 0; i < itemsToTranslate.length; i += CONFIG.batchSize) {
    const batch = itemsToTranslate.slice(i, i + CONFIG.batchSize);
    const titles = batch.map(item => item.title);

    console.log(`[${i + 1}-${Math.min(i + CONFIG.batchSize, itemsToTranslate.length)}/${itemsToTranslate.length}] 翻译中...`);

    const translations = await translateBatch(titles);

    if (translations && translations.length === batch.length) {
      // 更新翻译结果
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const translation = translations[j];

        // 在原数据中找到对应的 item 并更新
        const originalItem = promptsData.items.find(p => p.id === item.id);
        if (originalItem) {
          originalItem.titleEn = translation;
          successCount++;
          console.log(`  ✓ ${item.title} -> ${translation}`);
        }
      }
    } else {
      failCount += batch.length;
      console.log(`  ✗ 批次翻译失败`);
    }

    // 每批之间延迟避免速率限制
    if (i + CONFIG.batchSize < itemsToTranslate.length) {
      await delay(1000);
    }

    // 每 100 条保存一次
    if ((i + CONFIG.batchSize) % 100 === 0 || i + CONFIG.batchSize >= itemsToTranslate.length) {
      fs.writeFileSync(CONFIG.promptsJsonPath, JSON.stringify(promptsData, null, 2));
      console.log(`\n--- 已保存进度 ---\n`);
    }
  }

  // 最终保存
  fs.writeFileSync(CONFIG.promptsJsonPath, JSON.stringify(promptsData, null, 2));

  console.log('\n========== 翻译完成 ==========');
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`prompts.json 已更新`);
}

main().catch(console.error);
