/**
 * Seitentitel und Meta-Beschreibung für Startseite und Systemseiten (Rechtstexte, Kontakt), je Sprache.
 * Grund (Livegang-Prüfung 21.11.2026): Die PWA nahm dort den Shop-Standard „LACCICO | LACCICO“ und die
 * Beschreibung „Demo shop for PlentyONE Shop“. Texte wie im Ceres-Shop (Kategoriedaten Kat. 63 und Infoseiten),
 * offensichtliche Fehler dort bereinigt (EN-Seiten mit französischer Beschreibung, FR-Impressum mit alter Adresse).
 * Der Titel bekommt „| LACCICO“ automatisch angehängt (usePageTitle).
 * Kategorien und Artikel bleiben unberührt (eigene Daten aus Plenty).
 */
import type { LaccicoSeitenMeta as SeitenMeta, LaccicoSprache as Sprache } from './types';

const META: Record<string, Record<Sprache, SeitenMeta>> = {
  '/': {
    de: {
      titel: 'Gewachste Schnürsenkel kaufen | Rund & flach',
      beschreibung:
        'LACCICO: Premium-Schnürsenkel aus gewachster Baumwolle. Sorgfältig gefertigt, reißfest und elegant. Entdecken Sie Rund- und Flachsenkel für jeden Schuh.',
    },
    en: {
      titel: 'Buy waxed shoelaces | Round & flat',
      beschreibung:
        'LACCICO: premium shoelaces made of waxed cotton. Carefully made, tear-resistant and elegant. Discover round and flat laces for every shoe.',
    },
    fr: {
      titel: 'Acheter des lacets cirés | Ronds & plats',
      beschreibung:
        'LACCICO : lacets premium en coton ciré. Fabriqués avec soin, résistants à la déchirure et élégants. Découvrez des lacets ronds et plats pour chaque chaussure.',
    },
  },
  '/legal-disclosure': {
    de: {
      titel: 'Impressum',
      beschreibung:
        'Impressum von LACCICO. Rechtliche Informationen und Kontaktangaben zum Anbieter von hochwertigen gewachsten Schnürsenkeln.',
    },
    en: {
      titel: 'Imprint | Legal Information',
      beschreibung:
        'Legal notice for LACCICO. Legal information and contact details of the supplier of high-quality waxed shoelaces.',
    },
    fr: {
      titel: 'Mentions légales',
      beschreibung:
        'Mentions légales de LACCICO. Informations juridiques et coordonnées du fournisseur de lacets cirés de qualité.',
    },
  },
  '/terms-and-conditions': {
    de: {
      titel: 'AGB',
      beschreibung:
        'Allgemeine Geschäftsbedingungen (AGB) von LACCICO. Die rechtliche Basis für den Kauf unserer gewachsten Premium-Schnürsenkel.',
    },
    en: {
      titel: 'Terms and Conditions',
      beschreibung:
        'Terms and conditions of LACCICO. The legal basis for buying our premium waxed shoelaces.',
    },
    fr: {
      titel: 'Conditions générales de vente',
      beschreibung: 'Conditions générales de vente (CGV) de LACCICO. Base juridique de l’achat de nos lacets cirés premium.',
    },
  },
  '/privacy-policy': {
    de: {
      titel: 'Datenschutzerklärung',
      beschreibung:
        'Datenschutzerklärung von LACCICO. Wie wir Ihre Daten beim Kauf von gewachsten Schnürsenkeln schützen. Sicherer Umgang mit Ihren Informationen.',
    },
    en: {
      titel: 'Data protection | Security of your data',
      beschreibung:
        'Privacy policy of LACCICO. How we protect your data when you buy waxed shoelaces. Safe handling of your information.',
    },
    fr: {
      titel: 'Déclaration de confidentialité',
      beschreibung:
        'La protection de vos données est importante pour nous. Découvrez exactement quelles données nous traitons et stockons.',
    },
  },
  '/cancellation-rights': {
    de: {
      titel: '30 Tage Widerrufsrecht',
      beschreibung:
        'Informationen zum Widerrufsrecht bei LACCICO. So einfach geben Sie gewachste Schnürsenkel zurück, wenn diese nicht passen sollten.',
    },
    en: {
      titel: 'Cancellation | Your return options',
      beschreibung:
        'Information on the right of withdrawal at LACCICO. How to return waxed shoelaces easily if they do not fit.',
    },
    fr: {
      titel: 'Droit de rétractation de 30 jours',
      beschreibung: 'LACCICO : vous bénéficiez d’un droit de rétractation de 30 jours pour vos achats de lacets.',
    },
  },
  '/cancellation-form': {
    de: {
      titel: 'Widerrufsformular',
      beschreibung:
        'Das offizielle LACCICO Widerrufsformular. Nutzen Sie diese Vorlage für eine schnelle und unkomplizierte Rückgabe Ihrer Schnürsenkel-Bestellung.',
    },
    en: {
      titel: 'Cancellation form | Easy returns',
      beschreibung: 'The official LACCICO cancellation form for a quick and easy return of your shoelace order.',
    },
    fr: {
      titel: 'Formulaire de rétractation',
      beschreibung: 'Formulaire de rétractation si vous souhaitez révoquer le contrat.',
    },
  },
  '/contact': {
    de: {
      titel: 'Kontakt | Wir beraten Sie gerne',
      beschreibung:
        'Kontaktieren Sie LACCICO. Wir helfen Ihnen gerne bei Fragen zu unseren gewachsten Schnürsenkeln, Größen und Farben weiter. Jetzt Nachricht senden!',
    },
    en: {
      titel: "Contact | We're happy to advise you",
      beschreibung:
        "Contact LACCICO. We're happy to help with any questions you may have about our waxed shoelaces, sizes, and colors. Send us a message now!",
    },
    fr: {
      titel: 'Contactez-nous | Nous sommes heureux de vous conseiller',
      beschreibung:
        'Contactez LACCICO. Nous serons ravis de répondre à toutes vos questions concernant nos lacets cirés, les tailles et les couleurs. Envoyez-nous un message dès maintenant !',
    },
  },
};

/** Ersatz, wenn eine Seite gar keine eigene Beschreibung hat (statt „Demo shop for PlentyONE Shop“). */
const ERSATZ: Record<Sprache, string> = {
  de: META['/']!.de.beschreibung,
  en: META['/']!.en.beschreibung,
  fr: META['/']!.fr.beschreibung,
};

const sprache = (): Sprache => {
  const wert = String((useNuxtApp().$i18n as { locale: { value: string } }).locale.value || 'de').slice(0, 2);
  return wert === 'en' || wert === 'fr' ? wert : 'de';
};

/** Pfad ohne Sprachkürzel und ohne Schrägstrich am Ende: /en/contact → /contact, /fr → / */
const grundpfad = (pfad: string): string => {
  const ohneSprache = pfad.replace(/^\/(en|fr)(?=\/|$)/, '') || '/';
  return ohneSprache.length > 1 ? ohneSprache.replace(/\/$/, '') : ohneSprache;
};

export const laccicoSeitenMeta = (pfad: string): SeitenMeta | undefined => META[grundpfad(pfad)]?.[sprache()];

export const laccicoErsatzBeschreibung = (): string => ERSATZ[sprache()];
