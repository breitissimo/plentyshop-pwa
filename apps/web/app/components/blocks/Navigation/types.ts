import type { MegaMenuProps } from '~/components/MegaMenu/types';

export type SpacingSettings = {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
};

export type TextSettings = {
  textAlignment?: 'left' | 'center' | 'right';
};

export type ColorSettings = {
  backgroundColor?: string;
  textColor?: string;
  hoverBackgroundColor?: string;
};

/** LACCICO: Logo links in der Menüzeile (wie Ceres). */
export type NavigationLogoSettings = {
  show?: boolean;
};

export type NavigationContent = {
  layout: SpacingSettings;
  text: TextSettings;
  color: ColorSettings;
  logo?: NavigationLogoSettings;
  /** LACCICO: Megamenü zeigt Bildkacheln (Kategoriebild aus Plenty). */
  megaBilder?: boolean;
};

export type NavigationProps = {
  name: string;
  type: string;
  content: NavigationContent;
  configuration?: object;
  index?: number;
  meta: {
    uuid: string;
  };
};

export type NavigationFormProps = {
  uuid?: string;
};

export type NavigationBlockProps = Partial<MegaMenuProps> & Partial<NavigationProps>;
