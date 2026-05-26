export const locales = ['en', 'ha', 'yo', 'ig'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
};
