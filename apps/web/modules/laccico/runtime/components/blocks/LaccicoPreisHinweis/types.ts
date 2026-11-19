export type LaccicoPreisHinweisProps = {
  name: string;
  type: string;
  content?: { haendlerKlasse?: number };
  meta: { uuid: string };
};

export type LaccicoKunde = { classId?: number | null };

export type LaccicoStaffel = { quantity: string; price: number };
