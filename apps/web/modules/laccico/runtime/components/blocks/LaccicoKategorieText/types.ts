export type LaccicoKategorieTextTeil = 'titel' | 'text';

export type LaccicoKategorieTextProps = {
  content?: { teil?: LaccicoKategorieTextTeil };
  [key: string]: unknown;
};
