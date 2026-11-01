// The V4 theme mechanism: class `dark` on <html>, following
// prefers-color-scheme until the visitor overrides it (AGENTS.md, "Design
// system (V4)"). This file is only the machinery; the override's interface is
// its own ticket ("Dark/Light mode") and nothing here draws a control.
//
// The app and the design preview both start it. In the app the class changes
// nothing visible yet: V3's stylesheets still paint every surface and are dark
// whatever class <html> carries. Each Phase 4 ticket that moves a surface onto
// the tokens in src/index.css makes the theme reach that surface.
import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
// 'system' is the absence of a choice, not a third theme: it is what every
// visitor starts with and what clearing the override returns to.
export type ThemeChoice = Theme | 'system';

// Shared with the pre-paint script every page gets from vite.config.js
// (THEME_PREPAINT). Change one and the other has to change with it, or the
// page paints one theme and then swaps.
export const STORAGE_KEY = 'mcu.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStored(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch (e) {
    // Private windows and blocked site data throw on read. The mechanism
    // works without storage; it just forgets the choice when the tab closes.
  }
  return 'system';
}

// The choice lives here rather than in storage, so a window that refuses to
// store one still honours it for as long as it is open.
let choice: ThemeChoice = readStored();

const listeners = new Set<() => void>();
const announce = () => { listeners.forEach(fn => fn()); };

function query(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
}

export function systemTheme(): Theme {
  return query()?.matches ? 'dark' : 'light';
}

export function getChoice(): ThemeChoice {
  return choice;
}

export function getTheme(): Theme {
  return choice === 'system' ? systemTheme() : choice;
}

export function applyTheme(theme: Theme = getTheme()): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setChoice(next: ThemeChoice): void {
  choice = next;
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {
    // See readStored: the switch still applies to this window.
  }
  applyTheme();
  announce();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

let started = false;

// Apply the theme and start following what it depends on. Called once, by the
// page's entry, before the first render.
export function startTheme(): void {
  if (started) return;
  started = true;
  applyTheme();
  query()?.addEventListener('change', () => {
    // An override outlives the system changing its mind.
    if (choice !== 'system') return;
    applyTheme();
    announce();
  });
  // Another tab of the same site switching themes. A storage event with a
  // null key is a whole-store clear, which counts too.
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    choice = readStored();
    applyTheme();
    announce();
  });
}

// React's view of it: re-renders on a switch, and while the choice is
// 'system', on the system switching.
export function useTheme(): [ThemeChoice, Theme, (next: ThemeChoice) => void] {
  const current = useSyncExternalStore(subscribe, getChoice);
  const theme = useSyncExternalStore(subscribe, getTheme);
  return [current, theme, setChoice];
}

// Published like the rest of the app's shared surface, so the eventual
// Dark/Light control and the QA checks drive the real mechanism rather than
// toggling the class behind its back.
window.MCU_THEME = { getChoice, getTheme, setChoice, systemTheme, applyTheme, startTheme, STORAGE_KEY };
