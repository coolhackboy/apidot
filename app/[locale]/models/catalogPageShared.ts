import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { appConfig } from "@/data/config";
import { defaultLocale, locales } from "@/i18n/routing";
import {
  getCatalogCategoryFromLegacyQuery,
  getCatalogRouteByCategory,
  type PublicCatalogCategory,
} from "@/lib/modelCatalog";

export interface CatalogPageProps {
  params: {
    locale: string;
  };
}

export interface CatalogIndexPageProps extends CatalogPageProps {
  searchParams?: {
    category?: string | string[];
  };
}

type LocaleCopy = {
  title: string;
  description: string;
};

const CATALOG_PAGE_COPY: Record<PublicCatalogCategory, { en: LocaleCopy; zh: LocaleCopy }> = {
  all: {
    en: {
      title: `Model APIs | Image, Video, Music, and Chat Models | ${appConfig.appNameInHeader}`,
      description:
        "Explore APIDot's active image, video, music, and chat model lineup, including GPT Image 2, Seedance 2, Veo 3.1, Claude Opus 4.7, and MiniMax Music 2.6.",
    },
    zh: {
      title: `模型 API | 图像、视频、音乐与对话模型目录 | ${appConfig.appNameInHeader}`,
      description:
        "浏览 APIDot 当前可用的图像、视频、音乐与对话模型，包括 GPT Image 2、Seedance 2、Veo 3.1、Claude Opus 4.7 和 MiniMax Music 2.6。",
    },
  },
  Image: {
    en: {
      title: `AI Image APIs | Image Generation and Editing Models | ${appConfig.appNameInHeader}`,
      description:
        "Browse AI image APIs on APIDot, including text-to-image, image editing, upscale, and reference-based image models for production use.",
    },
    zh: {
      title: `AI 图像 API | 图像生成与编辑模型目录 | ${appConfig.appNameInHeader}`,
      description:
        "浏览 APIDot 上可用于生产环境的 AI 图像 API，覆盖文生图、图像编辑、放大与参考图工作流。",
    },
  },
  Video: {
    en: {
      title: `AI Video APIs | Video Generation Models | ${appConfig.appNameInHeader}`,
      description:
        "Browse AI video APIs on APIDot, including text-to-video, image-to-video, and cinematic video generation models for production workflows.",
    },
    zh: {
      title: `AI 视频 API | 视频生成模型目录 | ${appConfig.appNameInHeader}`,
      description:
        "浏览 APIDot 上可用于生产环境的 AI 视频 API，覆盖文生视频、图生视频与高质量视频生成工作流。",
    },
  },
  Music: {
    en: {
      title: `AI Music APIs | Music and Audio Generation Models | ${appConfig.appNameInHeader}`,
      description:
        "Browse AI music APIs on APIDot, including song generation, vocals, instrumental workflows, and audio generation models for production use.",
    },
    zh: {
      title: `AI 音乐 API | 音乐与音频生成模型目录 | ${appConfig.appNameInHeader}`,
      description:
        "浏览 APIDot 上可用于生产环境的 AI 音乐 API，覆盖歌曲生成、人声、纯音乐与音频工作流。",
    },
  },
  Chat: {
    en: {
      title: `AI Chat APIs | Chat and Coding Models | ${appConfig.appNameInHeader}`,
      description:
        "Browse AI chat APIs on APIDot, including chat, coding, reasoning, and multimodal assistant models for developer workflows.",
    },
    zh: {
      title: `AI 对话 API | 对话与代码模型目录 | ${appConfig.appNameInHeader}`,
      description:
        "浏览 APIDot 上可用于生产环境的 AI 对话 API，覆盖对话、编程、推理与多模态助手模型。",
    },
  },
};

const resolveLocalizedPath = (locale: string, path: string) =>
  locale === defaultLocale ? path : `/${locale}${path}`;

export const buildCatalogPageMetadata = async (
  locale: string,
  category: PublicCatalogCategory,
): Promise<Metadata> => {
  const safeLocale = locale === "zh" ? "zh" : "en";
  const path = getCatalogRouteByCategory(category);
  const canonical =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}${path}`
        : `${appConfig.webUrl}/${supportedLocale}${path}`,
    ]),
  );
  const copy = CATALOG_PAGE_COPY[category][safeLocale];

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": `${appConfig.webUrl}${path}`,
      },
    },
    openGraph: {
      type: "website",
      locale,
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: appConfig.appNameInHeader,
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
  };
};

export const redirectLegacyCatalogQueryIfNeeded = (
  locale: string,
  categoryParam?: string | string[],
) => {
  const rawCategory = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  const mappedCategory = getCatalogCategoryFromLegacyQuery(rawCategory);

  if (!rawCategory) {
    return;
  }

  if (!mappedCategory || mappedCategory === "all") {
    permanentRedirect(resolveLocalizedPath(locale, "/models"));
  }

  permanentRedirect(resolveLocalizedPath(locale, getCatalogRouteByCategory(mappedCategory)));
};
