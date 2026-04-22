export interface FluxKontextPrompt {
  id: string;
  title: string;
  prompt: string;
  beforeImage: string;
  afterImage: string;
  category: string;
  tags: string[];
}

export const fluxKontextPrompts: FluxKontextPrompt[] = [
  {
    id: "1",
    title: "Pearl Earring Headscarf Color Change",
    prompt: "Change the woman's blue headscarf to a vibrant green headscarf while keeping the same facial features, pearl earring, and pose exactly as they are",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-20.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-4.webp",
    category: "Object Editing",
    tags: ["portrait", "classic", "art", "color-change", "flux-kontext"]
  },
  {
    id: "2", 
    title: "Hair Color Transformation",
    prompt: "Change the woman's brown hair to blonde hair while maintaining the exact same hairstyle, facial features, and expression",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-22.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-8.webp",
    category: "Object Editing",
    tags: ["portrait", "hair", "color", "transformation", "flux-kontext"]
  },
  {
    id: "3",
    title: "Sketch to Photorealistic Portrait",
    prompt: "Transform this pencil sketch into a photorealistic portrait while maintaining the exact same composition, pose, and facial structure",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-21.webp", 
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-11.webp",
    category: "Style Transfer",
    tags: ["sketch", "realistic", "art", "transformation", "flux-kontext"]
  },
  {
    id: "4",
    title: "Facial Expression Modification",
    prompt: "Change the person's neutral facial expression to a warm, genuine smile while keeping the same facial features, pose, and lighting exactly as they are",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-29.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-12.webp", 
    category: "Character Consistency",
    tags: ["portrait", "expression", "emotion", "face", "flux-kontext"]
  },
  {
    id: "5",
    title: "Indoor to Garden Background Replace",
    prompt: "Change the background from indoor setting to a beautiful outdoor garden setting while keeping the person in the exact same position, pose, and lighting",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-30.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-5.webp",
    category: "Background Replace", 
    tags: ["background", "environment", "scene", "outdoor", "flux-kontext"]
  },
  {
    id: "6",
    title: "Casual to Business Attire",
    prompt: "Change the person's casual clothing to a professional business suit while maintaining the same pose, facial features, and body position",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-31.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-7.webp",
    category: "Object Editing",
    tags: ["clothing", "fashion", "style", "formal", "flux-kontext"]
  },
  {
    id: "7",
    title: "Age Progression with Feature Consistency",
    prompt: "Age the person by 20 years while maintaining the exact same facial bone structure, eye color, and distinctive features",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-18.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-14.webp",
    category: "Character Consistency",
    tags: ["age", "progression", "time", "transformation", "flux-kontext"]
  },
  {
    id: "8",
    title: "Van Gogh Style Transformation",
    prompt: "Transform this photograph into a Van Gogh impressionist painting with visible brushstrokes and rich color depth while maintaining the original composition",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-19.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-15.webp",
    category: "Style Transfer",
    tags: ["art", "style", "painting", "van-gogh", "flux-kontext"]
  },
  {
    id: "9",
    title: "Long to Short Bob Haircut",
    prompt: "Change the woman's long hair to a sleek shoulder-length bob haircut while keeping the same hair color, facial features, and pose exactly as they are",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-23.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-17.webp",
    category: "Change Haircut",
    tags: ["haircut", "bob", "short-hair", "styling", "flux-kontext"]
  },
  {
    id: "10",
    title: "Curly to Straight Hair Transformation",
    prompt: "Change the person's curly hair to straight, sleek hair while maintaining the same length, color, and facial features",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-24.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-3.webp",
    category: "Change Haircut",
    tags: ["haircut", "straight", "texture", "styling", "flux-kontext"]
  },
  {
    id: "11",
    title: "Pixie Cut Transformation",
    prompt: "Change the woman's medium-length hair to a modern pixie cut while keeping the same hair color, facial structure, and expression",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-3.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-2.webp",
    category: "Change Haircut",
    tags: ["haircut", "pixie", "short", "modern", "flux-kontext"]
  },
  {
    id: "12",
    title: "Professional LinkedIn Headshot",
    prompt: "Create a professional headshot suitable for LinkedIn with clean, non-sweaty skin, confident smile, professional attire, and good lighting while maintaining the person's natural features",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-10.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-11.webp",
    category: "Headshot",
    tags: ["professional", "linkedin", "business", "portrait", "flux-kontext"]
  },
  {
    id: "13",
    title: "Social Media Profile Picture",
    prompt: "Transform this into a polished social media profile picture with bright, even lighting, clear skin, and an approachable smile while keeping the person's distinctive features",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-14.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-13.webp",
    category: "Headshot",
    tags: ["social-media", "profile", "polished", "friendly", "flux-kontext"]
  },
  {
    id: "14",
    title: "Corporate Executive Headshot",
    prompt: "Create a corporate executive headshot with formal business attire, confident posture, and professional studio lighting while maintaining the person's natural appearance",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-25.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-16.webp",
    category: "Headshot",
    tags: ["corporate", "executive", "formal", "studio", "flux-kontext"]
  },
  {
    id: "15",
    title: "Store Sign Text Replacement",
    prompt: "Change the text on the store sign from 'Old Shop' to 'New Boutique' while maintaining the same font style, size, and sign design",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-28.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-9.webp",
    category: "Text Editing",
    tags: ["sign", "store", "text-replacement", "commercial", "flux-kontext"]
  },
  {
    id: "16",
    title: "Remove Person from Any Scene",
    prompt: "Remove the person walking in the background while keeping the [building, shop , and pathway] exactly as they are, filling the space naturally",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-27.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-6.webp",
    category: "People Removal",
    tags: ["removal", "building", "shop", "background", "cleanup", "flux-kontext"]
  },
  {
    id: "17",
    title: "Remove Person from Any Scene",
    prompt: "Remove the person walking in the background while keeping the [building, shop , and pathway, and car] exactly as they are, filling the space naturally",
    beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-26.webp",
    afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-1.webp",
    category: "People Removal",
    tags: ["removal", "building", "shop", "car", "background", "cleanup", "flux-kontext"]
  }
];

export const fluxKontextCategories = [
  "All",
  "Object Editing", // 对象修改
  "People Removal", // 人物去除
  "Style Transfer", // 风格转换
  "Background Replace", // 背景替换
  "Character Consistency", // 角色一致性编辑
  "Text Editing", // 文本编辑
  "Change Haircut", // 换发型
  "Headshot" // 头像
]; 