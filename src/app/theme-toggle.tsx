// The theme control (Notion V4 Tasks, "Phase 4 — Toolbar and app bar"):
// Light, Dark or Auto, which follows the system. Andre chose a toolbar control
// for the first re-skin pass (2026-11-01); a Settings panel may take it over
// later (the Dark/Light ticket). It is only the face of src/theme.ts.
//
// It sits in the desktop toolbar and in the phone's account sheet: the phone's
// app bar has no room left, and a button there cut the app's name short.
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeChoice } from '../theme';

const CHOICES: ThemeChoice[] = ['light', 'dark', 'system'];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const LABEL_KEY = { light: 'theme.light', dark: 'theme.dark', system: 'theme.system' } as const;

export function ThemeToggle() {
  const [choice, , setChoice] = useTheme();
  const { tr } = window.useI18n();
  return (
    <div className="segmented theme-toggle" role="group" aria-label={tr('theme.label')}>
      {CHOICES.map((c) => {
        const Icon = ICONS[c];
        return (
          <button key={c} type="button" className={choice === c ? 'on' : ''} aria-pressed={choice === c}
            onClick={() => setChoice(c)} aria-label={tr(LABEL_KEY[c])} title={tr(LABEL_KEY[c])}>
            <Icon aria-hidden="true"/>
          </button>
        );
      })}
    </div>
  );
}

window.ThemeToggle = ThemeToggle;
