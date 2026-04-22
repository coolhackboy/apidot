// 统一的输出数据结构类型定义

// 基础文件类型
export type FileType = "video" | "image" | "audio" | "text";

// 文本内容类型
export type TextContentType = "prompt" | "prompts" | "description" | "summary" | "analysis";

// 基础输出项接口
export interface BaseOutputItem {
  file_type: FileType;
  request_id?: string;
  created_time?: string;
  metadata?: Record<string, any>;
}

// 媒体文件输出项（图片、视频、音频）
export interface MediaOutputItem extends BaseOutputItem {
  file_type: "video" | "image" | "audio";
  file_url: string;
  watermark_url?: string;
  thumbnail_url?: string;
  duration?: number; // 视频/音频时长（秒）
  file_size?: number; // 文件大小（字节）
  dimensions?: {
    width: number;
    height: number;
  };
}

// 文本输出项
export interface TextOutputItem extends BaseOutputItem {
  file_type: "text";
  content_type: TextContentType;
  content: string | string[]; // 支持单个文本或文本数组
  word_count?: number;
  language?: string;
  // 对于提示词生成，可能包含分类信息
  categories?: string[];
  // 对于分析类文本，可能包含置信度
  confidence?: number;
}

// 联合类型：所有可能的输出项
export type OutputItem = MediaOutputItem | TextOutputItem;

// 完整的输出数据结构
export interface OutputData {
  items: OutputItem[];
  total_count: number;
  success_count: number;
  error_count: number;
  processing_time?: number; // 处理时间（毫秒）
  task_id?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
}

// 针对你的具体用例的类型定义

// 图片生成提示词的输出
export interface ImagePromptOutput extends TextOutputItem {
  content_type: "prompt";
  content: string;
  categories: string[];
}

// 提示词生成器的输出
export interface PromptsGeneratorOutput extends TextOutputItem {
  content_type: "prompts";
  content: string[];
}

// 图片/视频生成的输出
export interface MediaGenerationOutput extends MediaOutputItem {
  file_url: string;
  watermark_url?: string;
}

// 工具函数：创建不同类型的输出项
export const createTextOutput = (
  contentType: TextContentType,
  content: string | string[],
  options?: Partial<TextOutputItem>
): TextOutputItem => ({
  file_type: "text",
  content_type: contentType,
  content,
  word_count: Array.isArray(content) 
    ? content.join(' ').split(' ').length 
    : content.split(' ').length,
  created_time: new Date().toISOString(),
  ...options,
});

export const createMediaOutput = (
  fileType: "video" | "image" | "audio",
  fileUrl: string,
  options?: Partial<MediaOutputItem>
): MediaOutputItem => ({
  file_type: fileType,
  file_url: fileUrl,
  created_time: new Date().toISOString(),
  ...options,
});

// 工具函数：创建完整的输出数据
export const createOutputData = (items: OutputItem[]): OutputData => {
  const successItems = items.filter(item => 
    item.file_type === "text" ? !!item.content : !!(item as MediaOutputItem).file_url
  );
  
  return {
    items,
    total_count: items.length,
    success_count: successItems.length,
    error_count: items.length - successItems.length,
    processing_time: Date.now(),
  };
}; 