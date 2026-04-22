export interface Language {
  code: string;
  name: string;
}

export const supportedLanguages: Language[] = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
];
