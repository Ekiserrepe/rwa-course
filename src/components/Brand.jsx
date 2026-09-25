import React from 'react'

/**
 * Brand.jsx: shared vocabulary for the Xahau design system.
 *
 * Everything visual that more than one screen needs lives here: the wordmark
 * lockup, the icon set, the module colour themes and the small editorial
 * primitives (act labels, chips) that give xahau.network its rhythm.
 */

/* ── Module themes ──────────────────────────────────────────────────────────
   Four pastel tiles drawn from the brand palette (green, teal, sand, sage),
   cycled across modules. Deliberately restrained: the colour identifies the
   module, it never shouts over the content.
──────────────────────────────────────────────────────────────────────────── */

export const MODULE_THEMES = [
  { name: 'green', tint: '#e6f2ea', line: '#c8e0cf', ink: '#00622a' },
  { name: 'teal',  tint: '#e0f2f6', line: '#b8dde6', ink: '#005f75' },
  { name: 'sand',  tint: '#fdf1e3', line: '#f0dcc1', ink: '#8a5a12' },
  { name: 'sage',  tint: '#eef4f0', line: '#d0e2d5', ink: '#3a6b53' },
]

export const moduleTheme = (idx) => MODULE_THEMES[idx % MODULE_THEMES.length]

/* Dark mode needs its own tints: the pastels turn to muddy fog on ink. */
export const DARK_MODULE_THEMES = [
  { name: 'green', tint: 'rgba(93,228,140,0.12)',  line: 'rgba(93,228,140,0.26)',  ink: '#7ceba4' },
  { name: 'teal',  tint: 'rgba(0,196,232,0.12)',   line: 'rgba(0,196,232,0.26)',   ink: '#6fdcf2' },
  { name: 'sand',  tint: 'rgba(250,215,174,0.12)', line: 'rgba(250,215,174,0.26)', ink: '#f3cf9f' },
  { name: 'sage',  tint: 'rgba(163,206,181,0.12)', line: 'rgba(163,206,181,0.26)', ink: '#a9d6bd' },
]

export const themeFor = (idx, theme) =>
  (theme === 'dark' ? DARK_MODULE_THEMES : MODULE_THEMES)[idx % MODULE_THEMES.length]

/* ── Wordmark ───────────────────────────────────────────────────────────── */

export function XahauLockup({ label, compact = false, href = '/' }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 shrink-0 no-underline"
      style={{ color: 'var(--color-text-heading)' }}
      aria-label={`Xahau ${label}`}
    >
      <img
        src={`${import.meta.env.BASE_URL}xahau-logo.svg`}
        alt="Xahau"
        width={compact ? 108 : 126}
        height={compact ? 20 : 23}
        className="x-logo"
        style={{ display: 'block', maxWidth: '100%' }}
      />
      {/* The sub-brand is dropped on phones: the wordmark alone still reads. */}
      <span
        aria-hidden="true"
        className="hidden sm:block"
        style={{
          width: 1,
          height: compact ? 18 : 22,
          background: 'var(--color-border)',
        }}
      />
      <span
        className="hidden sm:block font-semibold tracking-tight"
        style={{
          fontSize: compact ? 14 : 16,
          color: 'var(--color-text-secondary)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
    </a>
  )
}


/* ── Module icon set ────────────────────────────────────────────────────────
   Line icons drawn on one grid (24px box, 1.6 stroke, round caps, no fill),
   so twelve modules read as one family. Emoji never could: every vendor draws
   them differently and they carry their own colour, which fights the tints.

   Keyed by module id. A module without an entry falls back to its `icon`
   emoji from the data file, so adding a module never renders nothing.
─────────────────────────────────────────────────────────────────────────── */

const ICON_PATHS = {
  // m0, Setup: a terminal
  m0: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M2.5 8.5h19" />
      <path d="M7 12.5 9.5 15 7 17.5" />
      <path d="M12.75 17.5h4.25" />
    </>
  ),
  // m1, RWA fundamentals: a building
  m1: (
    <>
      <path d="M4 20.5V8.5l8-5 8 5v12" />
      <path d="M2.5 20.5h19" />
      <path d="M9.5 20.5v-5h5v5" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  // m2, Issuing a token: a stack of coins
  m2: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.75" />
      <path d="M5 6v4c0 1.5 3.1 2.75 7 2.75S19 11.5 19 10V6" />
      <path d="M5 10v4c0 1.5 3.1 2.75 7 2.75S19 15.5 19 14v-4" />
      <path d="M5 14v4c0 1.5 3.1 2.75 7 2.75S19 19.5 19 18v-4" />
    </>
  ),
  // m3, Compliance controls: a padlock
  m3: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.25" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  // m4, Markets: an order book chart
  m4: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M7 17V9" />
      <path d="M5.5 10.5h3v5h-3z" />
      <path d="M12 15V4.5" />
      <path d="M10.5 6.5h3v6h-3z" />
      <path d="M17 18v-8" />
      <path d="M15.5 12h3v4h-3z" />
    </>
  ),
  // m5, Asset servicing: a calendar with a payment
  m5: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.25" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M9.5 14.75h5" />
      <path d="M12 12.25v5" />
    </>
  ),
  // m6, Unique assets: a deed with a seal
  m6: (
    <>
      <path d="M6 2.75h8.5L19 7.25v14H6z" />
      <path d="M14.5 2.75v4.5H19" />
      <path d="M9 11.5h7" />
      <path d="M9 14.5h4" />
      <circle cx="15" cy="17.5" r="1.75" />
    </>
  ),
  // m7, Oracles and NAV: a pulse line
  m7: (
    <>
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </>
  ),
  // m8, Keys and governance: a key
  m8: (
    <>
      <circle cx="8" cy="15.5" r="4.25" />
      <path d="m11 12.5 8.5-8.5" />
      <path d="m16.5 7 2.5 2.5" />
      <path d="m14 9.5 2 2" />
    </>
  ),
  // m9, Hooks: a literal fish hook (eye, shank, barb)
  m9: (
    <>
      <circle cx="14.25" cy="3.75" r="1.75" />
      <path d="M14.25 5.5V13a4.5 4.5 0 0 1-9 0v-2" />
      <path d="m5.25 11 2 2.25" />
    </>
  ),
  // m10, Capstone: a flag
  m10: (
    <>
      <path d="M5.5 21V3.5" />
      <path d="M5.5 4h12.5l-2.5 4 2.5 4H5.5" />
    </>
  ),
  // m11, Production: a shield with a check
  m11: (
    <>
      <path d="M12 2.75 19.5 5.5v6.25c0 4.5-3.2 8.1-7.5 9.5-4.3-1.4-7.5-5-7.5-9.5V5.5L12 2.75Z" />
      <path d="m8.75 12 2.25 2.25 4.25-4.5" />
    </>
  ),
}

/**
 * ModuleIcon: resolves a module to its line icon, falling back to whatever
 * `icon` the data file declares (an emoji, today) when the id is unknown.
 */
export function ModuleIcon({ module: mod, size = 22, className = '' }) {
  const paths = ICON_PATHS[mod?.id]

  if (!paths) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.95, lineHeight: 1 }}>
        {mod?.icon}
      </span>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}

/* ── Editorial primitives ───────────────────────────────────────────────── */

export function ActLabel({ children, color = 'var(--color-accent)', className = '' }) {
  return (
    <p className={`x-act-label ${className}`}>
      <span className="x-pip" style={{ background: color }} />
      {children}
    </p>
  )
}

export function Chip({ children }) {
  return <span className="x-chip">{children}</span>
}

/**
 * Spinner: shown while a module's content is being fetched. Modules load on
 * demand now, so this is the only thing standing between a click and a lesson.
 */
export function Spinner({ size = 22, label }) {
  return (
    <span className="inline-flex items-center gap-3" role="status" aria-live="polite">
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
        style={{ animation: 'x-spin 0.7s linear infinite' }}
      >
        <circle cx="12" cy="12" r="9" stroke="var(--color-border)" strokeWidth="2.5" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
      )}
    </span>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

export function GitHubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export function SunIcon({ size = 16 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export function MoonIcon({ size = 16 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ChevronDownIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
