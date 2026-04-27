const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || "https://apidot.ai").replace(/\/+$/, "");

export const appConfig = {
  appName: "apidot",
  appNameInHeader: "APIDot",
  appLogoUrl: "https://storage.apidot.ai/logo.png",
  loginRedirectUrl: "/",
  logoutRedirectUrl: "/",
  webUrl,
  credits: {
    video: {
      base: 20, // 基础视频生成
      img2vid: 20,
      text2vid: 20,
      kissing: 20,
      dance: 20,
      hug: 20,
      muscle: 20,
    },
    image: {
      base: 1, // 默认模型
      fluxDev: 5,
      fluxPro: 8,
      fluxProUltra: 12,
    },
    audio: {
      base: 6,
    },
  },
};
