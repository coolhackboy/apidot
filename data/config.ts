export const appConfig = {
  appName: "apidot",
  appNameInHeader: "APIDot",
  appLogoUrl: "/brand/apidot-mark.svg",
  loginRedirectUrl: "/",
  logoutRedirectUrl: "/",
  webUrl: "https://apidot.example.com",
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
