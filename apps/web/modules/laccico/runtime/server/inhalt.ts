import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3';
import { useStorage } from 'nitropack/runtime';

const ERLAUBT = /^[a-z]{2}$/;
const SEITE = /^(category|immutable|product)_[a-z0-9-]+$/;

/**
 * Liefert die Blöcke einer Seite aus dem Fork (runtime/inhalte/<sprache>/<seite>.json) oder null.
 */
export default defineEventHandler(async (event) => {
  const sprache = getRouterParam(event, 'sprache') ?? '';
  const seite = getRouterParam(event, 'seite') ?? '';

  setResponseHeader(event, 'Cache-Control', 'public, max-age=300');

  if (!ERLAUBT.test(sprache) || !SEITE.test(seite)) {
    return null;
  }

  const inhalt = await useStorage('assets:laccico').getItem(`${sprache}:${seite}.json`);

  return inhalt ?? null;
});
