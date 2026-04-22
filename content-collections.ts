import { defineCollection, defineConfig } from "@content-collections/core";

const articles = defineCollection({
  name: "articles",
  directory: "content/articles",
  include: "**/*.md",
  exclude: ["**/node_modules/**"],
  schema: (z) => ({
    title: z.string(),
    category: z.string().optional(),
    description: z.string().optional(),
    locale: z.string().optional(),
    image: z.string().optional(),
    author: z.string().optional(),
    datePublished: z.string().optional(),
    dateModified: z.string().optional(),
    tags: z.string().optional(),
    popular: z.boolean().optional(),
  }),
  transform: (data) => {
    // 安全地获取文件路径
    const filePath = data._meta?.filePath || '';
    const pathParts = filePath.split(/[\/\\]/); // 同时处理正斜杠和反斜杠
    
    // 从路径中提取locale和slug
    const locale = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : 'en';
    const fileName = pathParts[pathParts.length - 1] || '';
    const slug = fileName.replace(/\.md$/, '');
    
    // 确保日期格式正确
    const now = new Date().toISOString();
    const datePublished = data.datePublished ? new Date(data.datePublished).toISOString() : now;
    const dateModified = data.dateModified ? new Date(data.dateModified).toISOString() : now;
    
    return {
      ...data,
      slug,
      locale: data.locale || locale,
      datePublished,
      dateModified,
      category: data.category || "how-tos",
      author: data.author || "Admin",
      image: data.image || "",
      tags: data.tags || "",
      popular: data.popular || false
    };
  },
});

export default defineConfig({
  collections: [articles],
});