/**
 * locales.js: the languages this course is published in.
 *
 * The course ships in English only. The whole i18n pipeline from the Learn
 * Xahau course is kept intact, so adding a translation means: add an entry
 * here, add its labels to i18n.js, and add the same key next to every `en`
 * in the module files. The language picker appears by itself once there are
 * two entries.
 *
 * `code` is the key used in the course data; `tag` is the BCP-47 tag that
 * goes on <html lang>.
 */

export const LOCALES = [
  { code: 'en', tag: 'en', label: 'English', short: 'EN', dir: 'ltr' },
]

export const DEFAULT_LOCALE = 'en'

export const localeOf = (code) =>
  LOCALES.find((l) => l.code === code) ?? LOCALES[0]
