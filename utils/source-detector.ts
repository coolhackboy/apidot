/**
 * 用户来源类型定义
 * 用于追踪用户从哪个渠道进入应用
 */
export type UserSource = string;

/**
 * 来源检测配置
 */
export interface SourceDetectorConfig {
  // 是否启用UTM参数检测
  enableUtm: boolean;
  // 是否启用referrer检测
  enableReferrer: boolean;
  // 自定义域名映射
  customDomainMapping?: Record<string, UserSource>;
}

/**
 * 来源检测结果
 */
export interface SourceDetectionResult {
  source: string;
  rawReferrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  detectionMethod: 'utm' | 'referrer' | 'query_param' | 'default';
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SourceDetectorConfig = {
  enableUtm: true,
  enableReferrer: true,
};

/**
 * 检测用户来源的主函数
 */
export function getUserSource(config: Partial<SourceDetectorConfig> = {}): SourceDetectionResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 1. 优先检查 UTM 参数
  if (finalConfig.enableUtm) {
    const utmResult = detectUtmSource();
    if (utmResult) {
      return utmResult;
    }
  }
  
  // 2. 检查 URL 查询参数
  const queryResult = detectQueryParamSource();
  if (queryResult) {
    return queryResult;
  }
  
  // 3. 检查 referrer
  if (finalConfig.enableReferrer) {
    const referrerResult = detectReferrerSource(finalConfig.customDomainMapping);
    if (referrerResult) {
      return referrerResult;
    }
  }
  
  // 4. 默认为直接访问
  return {
    source: 'direct_visit',
    detectionMethod: 'default'
  };
}

/**
 * 检测 UTM 参数
 */
function detectUtmSource(): SourceDetectionResult | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  if (utmSource) {
    return {
      source: utmSource,
      utmSource,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      detectionMethod: 'utm'
    };
  }
  
  return null;
}

/**
 * 检测查询参数
 */
function detectQueryParamSource(): SourceDetectionResult | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('source') || urlParams.get('ref');
  
  if (source) {
    return {
      source: source,
      detectionMethod: 'query_param'
    };
  }
  
  return null;
}

/**
 * 检测 referrer
 */
function detectReferrerSource(customMapping?: Record<string, UserSource>): SourceDetectionResult | null {
  if (typeof document === 'undefined' || !document.referrer) return null;
  
  const referrer = document.referrer;
  const referrerUrl = new URL(referrer);
  const hostname = referrerUrl.hostname;
  
  // 检查自定义域名映射
  if (customMapping) {
    for (const [domain, source] of Object.entries(customMapping)) {
      if (hostname.includes(domain.toLowerCase())) {
        return {
          source,
          rawReferrer: referrer,
          detectionMethod: 'referrer'
        };
      }
    }
  }
  
  // 检查是否是同域名（排除子域名）
  if (typeof window !== 'undefined') {
    const currentHostname = window.location.hostname;
    if (hostname === currentHostname) {
      return null; // 同域名不算外部来源
    }
  }
  
  // 直接返回域名作为来源
  return {
    source: hostname,
    rawReferrer: referrer,
    detectionMethod: 'referrer'
  };
}

/**
 * 获取简化的来源字符串（用于API传递）
 */
export function getSourceString(result?: SourceDetectionResult): string {
  if (!result) {
    const detection = getUserSource();
    return detection.source;
  }
  return result.source;
}

/**
 * 获取内链注册来源页面路径
 * 优先使用同域名的 referrer，其次回退到当前页面路径
 */
export function getInternalSourcePath(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.hostname === window.location.hostname) {
        return `${refUrl.pathname}${refUrl.search}`;
      }
    }

    return `${window.location.pathname}${window.location.search}`;
  } catch (error) {
    console.error('Error detecting internal source:', error);
    return undefined;
  }
}

/**
 * UTM 参数数据
 */
export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  registration_page?: string;
}

/**
 * 获取完整的 UTM 参数数据
 * 用于在注册时传递给后端保存
 */
export function getUtmData(): UtmData {
  if (typeof window === 'undefined') {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);

  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    registration_page: window.location.pathname,
  };
}
