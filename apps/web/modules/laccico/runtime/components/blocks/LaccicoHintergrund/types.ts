export type LaccicoHintergrundContent = {
  /** Bildadresse des Hintergrundbilds */
  bild?: string;
  /** Bild bleibt beim Scrollen stehen (wie Ceres „Hintergrund fixiert“) */
  fest?: boolean;
  /** Mindesthöhe in Pixel */
  hoehe?: number;
  /** Text (HTML) über dem Bild */
  html?: string;
  /** Text in einer farbigen Box (z. B. #4C595D) mit weißer Schrift */
  kastenFarbe?: string;
};

export type LaccicoHintergrundProps = {
  name: string;
  type: string;
  content: LaccicoHintergrundContent;
  meta: { uuid: string };
};
