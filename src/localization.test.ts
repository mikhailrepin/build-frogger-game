import { describe, expect, it } from 'vitest';
import { getNumberLocale, UI_COPY } from './localization';

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') {
    return [prefix];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => (
    collectLeafPaths(child, prefix ? `${prefix}.${key}` : key)
  ));
}

describe('UI localization', () => {
  it('keeps English and Russian copy structurally aligned', () => {
    expect(collectLeafPaths(UI_COPY.ru)).toEqual(collectLeafPaths(UI_COPY.en));
  });

  it('provides non-empty labels for every supported language', () => {
    for (const locale of ['en', 'ru'] as const) {
      const labels = collectLeafPaths(UI_COPY[locale]);
      expect(labels.length).toBeGreaterThan(0);
      expect(JSON.stringify(UI_COPY[locale])).not.toContain('""');
    }
  });

  it('maps locales to matching number formats', () => {
    expect(getNumberLocale('en')).toBe('en-US');
    expect(getNumberLocale('ru')).toBe('ru-RU');
  });
});
