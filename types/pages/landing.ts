import { LucideProps, icons as LucideIcons } from 'lucide-react';

export type LandingJsonValue =
  | string
  | number
  | boolean
  | null
  | LandingJsonValue[]
  | { [key: string]: LandingJsonValue };

export interface ModelCatalogPreview {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  label?: string;
}

export type LandingCatalogCategoryKey = "image" | "video" | "music" | "chat";

export interface LandingPage {
  feature_code?: string;
  credits_amount?: number;
  catalogPreview?: ModelCatalogPreview;
  meta: {
    title: string;
    description: string;
  };
  model?: {
    model_id?: string;
    description?: string;
    tags?: string[];
    note?: string;
  };
  hero?: {
    title: string;
    description: string;
    thumbnail?: string;
    buttons: {
      title: string;
      url: string;
      icon?: keyof typeof LucideIcons;
    }[];
    showcase?: {
      title: string;
      description: string;
      videoUrl: string;
      imageUrl: string;
      thumbnailUrl: string;
    }[];
    src?: string; // HeroVideo 视频源
    images?: string[]; // HeroImage 图片源
  };
  filters?: {
    all?: string;
    video?: string;
    image?: string;
    music?: string;
    chat?: string;
    searchPlaceholder?: string;
  };
  table?: {
    modelModality?: string;
    creditsPerGen?: string;
    ourPrice?: string;
    falPrice?: string;
    discount?: string;
    multipleTiers?: string;
    perVideo?: string;
    perGeneration?: string;
    perSecond?: string;
    perImage?: string;
    noResults?: string;
  };
  features?: {
    title: string;
    subtitle: string;
    features: {
      title: string;
      description: string;
    }[];
  };
  featureTable?: {
    title: string;
    subtitle?: string;
    authorityLink?: string;
    authorityText?: string;
    features: {
      key: string;
      value: string;
      isHighlighted?: boolean;
    }[];
  };
  customerReviews?: {
    title: string;
    subtitle: string;
    reviews: {
      content: string;
      userName: string;
      userHandle: string;
    }[];
  };
  featurescard?: {
    title: string;
    subtitle: string;
    items: {
      id: string;
      title: string;
      description: string;
      tags?: string[];
      image?: {
        src: string;
        alt: string;
      };
      video?: {
        src: string;
        thumbnail: string;
      };
      icon: string;
      color?: string;
      callToAction?: {
        text: string;
        href: string;
      };
    }[];
  };
  tools?: {
    id: string;
    name: string;
    thumbnail: string;
  }[];
  toolCategories?: {
    id: string;
    name: string;
    tools: {
      id: string;
      name: string;
      thumbnail: string;
    }[];
  }[];
  showCaseVideo?: {
    videoUrl: string;
    prompt: string;
  }[];
  imageVideoShowcase?: {
    title?: string;
    description?: string;
    items: {
      sourceImage1: string;
      sourceImage2: string;
      targetVideo: string;
      title?: string;
      description?: string;
    }[];
  }[];
  sections?: {
    title: string;
    subtitle: string;
    tag: string;
    thumbnail?: string;
    media: {
      type: 'image' | 'video';
      src: string;
      alt?: string;
      poster?: string;
    };
    reverse?: boolean;
    titleCenter?: boolean;
    descriptions: {
      text: string;
      title?: string;
      iconName?: keyof typeof LucideIcons;
      icon?: React.ReactNode;
    }[];
    callToAction?: {
      text: string;
      href: string;
    };
  }[];
  sectionsTitle?: string;
  benefits?: {
    title: string;
    subtitle: string;
    features: {
      [key: string]: {
        title: string;
        description: string;
      };
    };
  };
  whyChooseUs?: {
    title: string;
    subtitle?: string;
    items: {
      icon: keyof typeof LucideIcons;
      title: string;
      description: string;
    }[];
  };
  testimonials?: {
    title: string;
    subtitle?: string;
    items: {
      name: string;
      role?: string;
      company?: string;
      content: string;
      rating: number;
      avatar?: string;
    }[];
  };
  faq?: {
    title: string;
    subtitle: string;
    contactText: string;
    contactLinkText: string;
    items: {
      [key: string]: {
        question: string;
        answer: string;
      };
    };
  };
  howItWork?: {
    title: string;
    subtitle?: string;
    steps: {
      [key: string]: {
        title: string;
        description: string;
      };
    };
  };
  recommendFeatures?: {
    title: string;
    subtitle: string;
    items: {
      title: string;
      description: string;
      icon: string;
      link: string;
      color?: string;
    }[];
  };
  cta?: {
    title: string;
    description?: string;
    buttons: {
      title: string;
      url: string;
      icon: string;
    }[];
  };
  welcome?: {
    title: string;
    description?: string;
    buttons: {
      title: string;
      url: string;
      icon: string;
    }[];
  };
  blogPosts?: {
    title: string;
    subtitle: string;
    items: {
      id: number;
      title: string;
      description: string | null;
      date_published: string;
      tags: string[] | null;
      slug: string;
    }[];
  };

  freeToolGrid?: {
    title: string;
    subtitle: string;
    url: string;
    items: {
      title: string;
      description: string;
      icon: keyof typeof LucideIcons;
      href: string;
    }[];
  };
  toolGrid?: {
    title: string;
    subtitle: string;
    url: string;
    urlText: string;
    items: {
      title: string;
      description: string;
      icon: keyof typeof LucideIcons;
      href: string;
    }[];
  };
  tweetShowcase?: {
    title: string;
    description: string;
  };
  release?: {
    title: string;
    description: string;
    items: {
      title: string;
      description: string;
      date: string;
      url: string;
    }[];
  };

  /**
  * 通用AI工具示例展示配置
  * 支持多种展示模式，适用于各种AI工具的功能演示
  */
  examples?: {
    title: string;
    subtitle?: string;
    items: {
      /**
       * 通用展示模式类型 - 描述UI布局而非具体功能
       * - 1: 前后对比模式，适用于编辑类功能（图片编辑、修复等）
       * - 2: 提示词到结果模式，适用于生成类功能（文生图、文生视频等）  
       * - 3: 多输入合成模式，适用于融合类功能（图片合成、风格转换等）
       * - 4: 文本到音频模式，适用于音频生成功能（文生音乐、文生语音等）
       * - 5: 音频到音频模式，适用于音频处理功能（降噪、增强、转换等）
       */
      type: 1 | 2 | 3 | 4 | 5;
      title: string;
      prompt: string;
      /**
       * 输入图片数组
       * - before-after模式: 包含1张原始图片
       * - multi-input模式: 包含多张输入图片  
       * - prompt-result模式: 不需要此字段
       */
      beforeImages?: string[];
      /**
       * 最终结果图片URL，除音频模式外都需要
       */
      afterImage: string;
      /**
       * 音频文件URL，仅音频模式（type: 4）需要
       */
      audioUrl?: string;
      /**
       * 原始音频文件URL，仅音频到音频模式（type: 5）需要
       */
      beforeAudio?: string;
      /**
       * 处理后音频文件URL，仅音频到音频模式（type: 5）需要
       */
      afterAudio?: string;
    }[];
  };

  youtubeReviews?: {
    title: string;
    subtitle: string;
    videos: {
      videoId: string;
      title: string;
      description: string;
      thumbnail?: string;
    }[];
  };

  modelLandingContent?: {
    hero?: {
      title: string;
      description: string;
      cta?: {
        text: string;
        href: string;
      };
    };
    subModels?: {
      title: string;
      items: {
        icon?: keyof typeof LucideIcons;
        title: string;
        description: string;
        cta?: {
          text: string;
          href: string;
        };
      }[];
    };
    features?: {
      title: string;
      items: {
        icon?: keyof typeof LucideIcons;
        title: string;
        description: string;
      }[];
    };
    featureHighlightsWithMedia?: {
      title: string;
      subtitle?: string;
      items: {
        title: string;
        description: string;
        bullets?: string[];
        media?: {
          type: "image" | "video";
          src: string;
          alt?: string;
          poster?: string;
        };
        reverse?: boolean;
        cta?: {
          text: string;
          href: string;
        };
      }[];
    };
    useCase?: {
      title: string;
      items: {
        icon?: keyof typeof LucideIcons;
        title: string;
        description: string;
      }[];
    };
    comparisonTable?: {
      title: string;
      description?: string;
      featureColumnTitle?: string;
      columns: string[];
      highlightColumn?: number;
      rows: {
        feature: string;
        values: string[];
      }[];
      footnote?: string;
    };
    howToUse?: {
      title: string;
      description: string;
    };
    pricing?: {
      title: string;
      description: string;
    };
    faq?: {
      title: string;
      items: {
        question: string;
        answer: string;
      }[];
    };
    whyChooseUs?: {
      title: string;
      items: {
        icon?: keyof typeof LucideIcons;
        title: string;
        description: string;
      }[];
    };
  };

  homePage?: {
    chip: string;
    titleLines: string[];
    description: string;
    primaryCta: string;
    secondaryCta: string;
    subnote: string;
    trustedByLabel: string;
    trustedCompanies: string[];
    featuredEyebrow: string;
    featuredTitle: string;
    featuredAction: string;
    integrateEyebrow: string;
    integrateTitle: string;
    integrateDescription: string;
    integratePoints: {
      title: string;
      description: string;
    }[];
    browseEyebrow: string;
    browseTitle: string;
    modalities: {
      categoryKey: LandingCatalogCategoryKey;
      title: string;
      description: string;
      examples: string;
      icon: keyof typeof LucideIcons;
    }[];
    useCasesEyebrow: string;
    useCasesTitle: string;
    useCases: {
      eyebrow: string;
      title: string;
      description: string;
    }[];
    ctaTitle: string;
    ctaDescription: string;
    ctaPrimary: string;
    ctaSecondary: string;
    exampleDocId: string;
    exampleVariantId?: string;
    stats: {
      value: string;
      label: string;
      note: string;
    }[];
  };

  docsPage?: {
    title: string;
    searchPlaceholder: string;
    tryPlayground: string;
    openSpec: string;
    gettingStartedLabel: string;
    modelsVideoLabel: string;
    exampleRequest: string;
    requestBody: string;
    response: string;
    errors: string;
    aboutApi: string;
    bestPractices: string;
    faq: string;
    field: string;
    type: string;
    required: string;
    description: string;
    articleCta: string;
    responseLabel: string;
    relatedDocs: string;
    previousDoc: string;
    nextDoc: string;
    browseModelsLabel: string;
    browseModelsDescription: string;
    pricingLabel: string;
    pricingDescription: string;
    navGroups: {
      label: string;
      items: {
        id: string;
        label: string;
        method?: string;
      }[];
    }[];
    articles: Record<
      string,
      {
        title: string;
        lede: string;
        seoTitle?: string;
        seoDescription?: string;
        sections: {
          title: string;
          body: string;
          code?: string;
        }[];
      }
    >;
    endpoints: Record<
      string,
      {
        label: string;
        method: string;
        path: string;
        endpoint?: string;
        summary: string;
        seoTitle?: string;
        seoDescription?: string;
        about: string;
        bestPractices: string[];
        faq: {
          question: string;
          answer: string;
        }[];
        request: {
          name: string;
          type: string;
          required?: boolean;
          defaultValue?: string;
          description: string;
        }[];
        response: {
          name: string;
          type: string;
          defaultValue?: string;
          description: string;
        }[];
        errors: {
          code: string;
          name: string;
          description: string;
        }[];
        sample: {
          curl: string;
          python: string;
          javascript: string;
          php: string;
          go: string;
          java: string;
          ruby: string;
        };
        exampleVariants?: {
          id: string;
          label: string;
          payloadTemplate?: {
            [key: string]: LandingJsonValue;
          };
          sample?: {
            curl: string;
            python: string;
            javascript: string;
            php: string;
            go: string;
            java: string;
            ruby: string;
          };
        }[];
        payloadTemplate?: {
          [key: string]: LandingJsonValue;
        };
        responseExamples?: {
          code: string;
          label?: string;
          body: string;
        }[];
        sampleResponse: string;
      }
    >;
  };

  seoContent?: {
    overview: {
      eyebrow: string;
      title: string;
      paragraphs: string[];
    };
    capabilities: {
      eyebrow: string;
      title: string;
      items: {
        title: string;
        description: string;
      }[];
    };
    useCases: {
      eyebrow: string;
      title: string;
      description: string;
      items: string[];
    };
    quickstart: {
      eyebrow: string;
      title: string;
      steps: {
        eyebrow: string;
        title: string;
        description: string;
        actionText?: string;
        actionHref?: string;
      }[];
    };
    faq: {
      eyebrow: string;
      title: string;
      items: {
        question: string;
        answer: string;
      }[];
    };
  };

} 
