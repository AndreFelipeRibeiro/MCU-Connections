// Entry for the V4 design-system preview page (design.html).
//
// This page is deliberately separate from the app: index.html never loads it,
// and it never loads the app. It exists so the new design system can be looked
// at and reacted to before the Phase 2 module conversion makes it possible to
// apply the components to the app itself (docs/V4-PLAN.md §9).
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import Preview from './Preview.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Preview />
  </React.StrictMode>
);
