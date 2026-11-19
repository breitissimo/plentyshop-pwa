export type CustomerReviewProps = {
  name: string;
  type: string;
  configuration?: object;
  content: CustomerReviewContent;
  index?: number;
  meta: {
    uuid: string;
  };
};

export type CustomerReviewContent = {
  text: {
    title: string;
    /** LACCICO: Hinweis (HTML) unten im aufgeklappten Bereich, z. B. zur Echtheit der Bewertungen */
    hinweis?: string;
  };
  layout: {
    collapsible: boolean;
    initiallyCollapsed: boolean;
    fullWidth?: boolean;
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
  };
};
