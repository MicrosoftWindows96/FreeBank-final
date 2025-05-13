declare module 'i18next' {
  const i18n: any;
  export default i18n;
}

declare module 'react-i18next' {
  export function useTranslation(namespace?: string | string[]): any;
  export const initReactI18next: any;
}

declare module 'i18next-browser-languagedetector' {
  const detector: any;
  export default detector;
}

declare module '*.json' {
  const value: Record<string, any>;
  export default value;
} 