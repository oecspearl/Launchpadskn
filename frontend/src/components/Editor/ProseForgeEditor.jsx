import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

// ============================================================
// CONSTANTS
// ============================================================
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Literata:ital,wght@0,400;0,600;0,700;1,400&display=swap';
const MAX_HISTORY = 200;
const HISTORY_DEBOUNCE_MS = 300;
const SAFE_ATTRIBUTES = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan']);

// ============================================================
// CSS STYLES (injected at runtime, all pf- prefixed)
// ============================================================
const STYLES = `
/* Shell */
.pf-shell {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
  border: 1px solid #d2d2d7;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  line-height: 1.4;
}
.pf-shell *, .pf-shell *::before, .pf-shell *::after { box-sizing: border-box; }
.pf-shell.pf-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  border-radius: 0;
  border: none;
  height: 100vh !important;
}

/* Header */
.pf-header {
  background: #f9fafb;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e5ea;
  font-size: 12px;
  color: #86868b;
  font-weight: 500;
  flex-shrink: 0;
}
.pf-header-brand { font-weight: 600; color: #6e6e73; letter-spacing: 0.02em; }
.pf-header-btn {
  background: none; border: none; color: #86868b; cursor: pointer;
  padding: 2px 6px; border-radius: 4px; display: flex; align-items: center;
  transition: all 0.12s;
}
.pf-header-btn:hover { background: #e5e5ea; color: #1d1d1f; }

/* Menubar */
.pf-menubar {
  background: #2c2c2e; display: flex; padding: 0 8px;
  border-bottom: 1px solid #48484a; position: relative; z-index: 100; flex-shrink: 0;
}
.pf-menu-wrap { position: relative; }
.pf-menu-trigger {
  background: none; border: none; color: #e5e5ea;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
  padding: 6px 12px; cursor: pointer; border-radius: 4px; transition: background 0.12s;
}
.pf-menu-trigger:hover, .pf-menu-trigger.pf-active { background: #3a3a3c; }
.pf-menu-dropdown {
  position: absolute; top: 100%; left: 0; background: #2c2c2e;
  border: 1px solid #48484a; border-radius: 8px; padding: 4px;
  min-width: 240px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 200;
  animation: pf-dropdown-in 0.12s ease-out;
}
@keyframes pf-dropdown-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.pf-menu-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; color: #e5e5ea; font-size: 13px; border: none;
  background: none; width: 100%; text-align: left; cursor: pointer;
  border-radius: 4px; transition: background 0.12s; font-family: 'DM Sans', sans-serif;
}
.pf-menu-item:hover { background: #0a84ff; color: #fff; }
.pf-menu-shortcut {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: #86868b; margin-left: 24px;
}
.pf-menu-item:hover .pf-menu-shortcut { color: rgba(255,255,255,0.7); }
.pf-menu-sep { height: 1px; background: #48484a; margin: 4px 8px; }

/* Toolbar */
.pf-toolbar {
  background: #2c2c2e; display: flex; align-items: center;
  padding: 4px 8px; gap: 2px; flex-wrap: wrap;
  border-bottom: 1px solid #48484a; flex-shrink: 0;
}
.pf-toolbar-div { width: 1px; height: 20px; background: #48484a; margin: 0 4px; flex-shrink: 0; }
.pf-tb {
  width: 32px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: #e5e5ea; cursor: pointer;
  border-radius: 4px; transition: all 0.12s; position: relative; flex-shrink: 0; padding: 0;
}
.pf-tb:hover { background: #3a3a3c; }
.pf-tb.pf-active { background: #0a84ff; color: #fff; }
.pf-tb[data-tooltip]:hover::after {
  content: attr(data-tooltip); position: absolute; bottom: -28px; left: 50%;
  transform: translateX(-50%); background: #1c1c1e; color: #e5e5ea;
  font-family: 'DM Sans', sans-serif; font-size: 11px; padding: 3px 8px;
  border-radius: 4px; white-space: nowrap; z-index: 300; pointer-events: none;
}
.pf-block-sel {
  background: #3a3a3c; color: #e5e5ea; border: 1px solid #48484a;
  border-radius: 4px; padding: 4px 8px; font-family: 'DM Sans', sans-serif;
  font-size: 13px; cursor: pointer; height: 30px; min-width: 120px;
}
.pf-block-sel:focus { outline: none; border-color: #0a84ff; }

/* Color picker */
.pf-color-wrap { position: relative; width: 32px; height: 30px; flex-shrink: 0; }
.pf-color-btn {
  width: 32px; height: 30px; display: flex; align-items: center;
  justify-content: center; flex-direction: column; background: none;
  border: none; color: #e5e5ea; cursor: pointer; border-radius: 4px;
  transition: all 0.12s; position: relative; padding: 0;
}
.pf-color-btn:hover { background: #3a3a3c; }
.pf-color-ind { width: 14px; height: 3px; border-radius: 1px; margin-top: 1px; }
.pf-color-input {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
}

/* Find & Replace */
.pf-find-bar {
  background: #2c2c2e; padding: 8px 12px; display: flex;
  align-items: center; gap: 8px; border-bottom: 1px solid #48484a;
  flex-wrap: wrap; flex-shrink: 0;
}
.pf-find-input {
  background: #3a3a3c; border: 1px solid #48484a; color: #e5e5ea;
  padding: 4px 10px; border-radius: 4px; font-family: 'DM Sans', sans-serif;
  font-size: 13px; outline: none; min-width: 160px;
}
.pf-find-input:focus { border-color: #0a84ff; }
.pf-find-count {
  color: #86868b; font-size: 12px; font-family: 'JetBrains Mono', monospace; min-width: 70px;
}
.pf-find-btn {
  background: #3a3a3c; border: 1px solid #48484a; color: #e5e5ea;
  padding: 4px 12px; border-radius: 4px; font-family: 'DM Sans', sans-serif;
  font-size: 12px; cursor: pointer; transition: all 0.12s;
}
.pf-find-btn:hover { background: #48484a; }
.pf-find-close {
  background: none; border: none; color: #86868b; cursor: pointer;
  padding: 4px; display: flex; border-radius: 4px;
}
.pf-find-close:hover { background: #3a3a3c; color: #e5e5ea; }

/* Content Area */
.pf-content-wrap { flex: 1; overflow: auto; background: #fff; position: relative; min-height: 0; }
.pf-content {
  min-height: 100%; padding: 40px 56px; outline: none;
  font-family: 'Literata', Georgia, serif; font-size: 16px;
  line-height: 1.7; color: #1d1d1f; caret-color: #0a84ff;
  word-wrap: break-word; overflow-wrap: break-word;
}
.pf-content:empty::before {
  content: attr(data-placeholder); color: #86868b; pointer-events: none;
  display: block;
}
.pf-content ::selection { background: rgba(10,132,255,0.2); }
.pf-content h1 { font-family: 'DM Sans', sans-serif; font-size: 2em; font-weight: 700; margin: 0.8em 0 0.4em; line-height: 1.2; color: #1d1d1f; }
.pf-content h2 { font-family: 'DM Sans', sans-serif; font-size: 1.5em; font-weight: 600; margin: 0.8em 0 0.4em; line-height: 1.3; color: #1d1d1f; }
.pf-content h3 { font-family: 'DM Sans', sans-serif; font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.4em; line-height: 1.4; color: #1d1d1f; }
.pf-content h4 { font-family: 'DM Sans', sans-serif; font-size: 1em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #86868b; margin: 0.8em 0 0.4em; }
.pf-content blockquote { border-left: 3px solid #0a84ff; margin: 1em 0; padding: 0.5em 0 0.5em 1.2em; font-style: italic; color: #6e6e73; }
.pf-content pre { font-family: 'JetBrains Mono', monospace; font-size: 13.5px; background: #1c1c1e; color: #e5e5ea; padding: 16px 20px; border-radius: 8px; overflow-x: auto; margin: 1em 0; line-height: 1.6; }
.pf-content code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #0a84ff; background: rgba(10,132,255,0.08); padding: 2px 6px; border-radius: 4px; }
.pf-content pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
.pf-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.pf-content th, .pf-content td { border: 1px solid #d2d2d7; padding: 8px 12px; text-align: left; }
.pf-content th { background: #f5f5f7; font-weight: 600; font-family: 'DM Sans', sans-serif; }
.pf-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
.pf-content a { color: #0a84ff; text-decoration: underline; text-underline-offset: 2px; }
.pf-content hr { border: none; border-top: 1px solid #d2d2d7; margin: 1.5em 0; }
.pf-content p { margin: 0.5em 0; }
.pf-content ul, .pf-content ol { margin: 0.5em 0; padding-left: 1.5em; }
.pf-content li { margin: 0.2em 0; }

/* Source View */
.pf-source {
  width: 100%; height: 100%; background: #1c1c1e; color: #e5e5ea;
  font-family: 'JetBrains Mono', monospace; font-size: 13.5px; line-height: 1.6;
  padding: 20px; border: none; outline: none; resize: none; box-sizing: border-box;
}
.pf-source.pf-nowrap { white-space: pre; overflow-x: auto; }

/* Status Bar */
.pf-statusbar {
  background: #1c1c1e; padding: 4px 16px; display: flex;
  align-items: center; justify-content: space-between;
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: #86868b; border-top: 1px solid #48484a; flex-shrink: 0;
}
.pf-statusbar-left, .pf-statusbar-right { display: flex; align-items: center; gap: 16px; }
.pf-status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #30d158;
  display: inline-block; margin-right: 6px;
}

/* Dialog Overlay */
.pf-dialog-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px); display: flex; align-items: center;
  justify-content: center; z-index: 500; animation: pf-fade-in 0.15s ease-out;
}
@keyframes pf-fade-in { from { opacity: 0; } to { opacity: 1; } }
.pf-dialog {
  background: #2c2c2e; border: 1px solid #48484a; border-radius: 12px;
  padding: 24px; width: 400px; max-width: 90%;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4); animation: pf-scale-in 0.15s ease-out;
}
@keyframes pf-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.pf-dialog h3 { color: #e5e5ea; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600; margin: 0 0 16px; }
.pf-dialog-field { margin-bottom: 12px; }
.pf-dialog-label { display: block; color: #86868b; font-size: 12px; font-family: 'DM Sans', sans-serif; margin-bottom: 4px; }
.pf-dialog-input {
  width: 100%; background: #3a3a3c; border: 1px solid #48484a; color: #e5e5ea;
  padding: 8px 12px; border-radius: 6px; font-family: 'DM Sans', sans-serif;
  font-size: 14px; outline: none; box-sizing: border-box;
}
.pf-dialog-input:focus { border-color: #0a84ff; }
.pf-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.pf-dialog-btn {
  padding: 6px 16px; border-radius: 6px; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.12s; border: none;
}
.pf-dialog-btn-cancel { background: #3a3a3c; color: #e5e5ea; }
.pf-dialog-btn-cancel:hover { background: #48484a; }
.pf-dialog-btn-primary { background: #0a84ff; color: #fff; }
.pf-dialog-btn-primary:hover { background: #0070e0; }

/* Read-only */
.pf-readonly .pf-content { cursor: default; }
`;

// ============================================================
// SVG ICONS (16x16 display, 24x24 viewBox, stroke-based)
// ============================================================
const S = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" {...props} />
);

const IC = {
  bold: <S strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></S>,
  italic: <S><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></S>,
  underline: <S><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></S>,
  strike: <S><path d="M16 4c-.5-1.5-2.5-3-5-3-3 0-5 2-5 4 0 1.5.5 2.5 2 3.5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M8 20c.5 1.5 2.5 3 5 3 3 0 5-2 5-4 0-1.5-.5-2.5-2-3.5"/></S>,
  code: <S><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></S>,
  alignL: <S><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></S>,
  alignC: <S><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></S>,
  alignR: <S><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></S>,
  alignJ: <S><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></S>,
  listUl: <S><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></S>,
  listOl: <S><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M3 10h3"/><path d="M3 18h3"/></S>,
  indentR: <S><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></S>,
  indentL: <S><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></S>,
  link: <S><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></S>,
  image: <S><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></S>,
  table: <S><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></S>,
  hr: <S><line x1="3" y1="12" x2="21" y2="12"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="21" cy="12" r="1" fill="currentColor"/></S>,
  quote: <S><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></S>,
  undo: <S><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></S>,
  redo: <S><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></S>,
  clearFmt: <S><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></S>,
  expand: <S><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></S>,
  collapse: <S><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></S>,
  close: <S><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></S>,
  textCol: <S><path d="M12 3L7 17"/><path d="M12 3l5 14"/><path d="M8 13h8"/></S>,
  hilite: <S><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></S>,
};

// ============================================================
// HELPERS
// ============================================================
function sanitizePastedHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, meta, link').forEach(el => el.remove());
  doc.body.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (!SAFE_ATTRIBUTES.has(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
function ProseForgeEditor({
  value = '',
  onChange,
  readOnly = false,
  placeholder = 'Start writing something brilliant...',
  height = 400,
  showFullscreenButton = true,
}) {
  // Refs
  const shellRef = useRef(null);
  const editorRef = useRef(null);
  const savedSelRef = useRef(null);
  const historyRef = useRef({ stack: [value || ''], index: 0 });
  const debounceRef = useRef(null);
  const lastValueRef = useRef(null);
  const styleRef = useRef(null);

  // State
  const [openMenu, setOpenMenu] = useState(null);
  const [showFind, setShowFind] = useState(false);
  const [isSource, setIsSource] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [findText, setFindText] = useState('');
  const [replText, setReplText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strike: false, block: 'p' });
  const [textColor, setTextColor] = useState('#1d1d1f');
  const [hlColor, setHlColor] = useState('#ffff00');
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  // ── Inject CSS & fonts on mount ──
  useEffect(() => {
    if (!document.querySelector(`link[data-proseforge-font]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.setAttribute('data-proseforge-font', '');
      document.head.appendChild(link);
    }
    const style = document.createElement('style');
    style.textContent = STYLES;
    style.setAttribute('data-proseforge-style', '');
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { if (styleRef.current) styleRef.current.remove(); };
  }, []);

  // ── Sync value prop to editor ──
  useEffect(() => {
    if (editorRef.current && !isSource) {
      if (value !== lastValueRef.current) {
        editorRef.current.innerHTML = value || '';
        lastValueRef.current = value || '';
        updateStats();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isSource]);

  // ── Track selection & format state ──
  useEffect(() => {
    const handler = () => {
      if (!editorRef.current || isSource || readOnly) return;
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) return;
      savedSelRef.current = range.cloneRange();
      try {
        setFmt({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strike: document.queryCommandState('strikethrough'),
          block: (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, ''),
        });
      } catch { /* ignore */ }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [isSource, readOnly]);

  // ── Close menus on outside click ──
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e) => {
      if (!e.target.closest('.pf-menubar')) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // ── Update find match count ──
  useEffect(() => {
    if (!findText || !editorRef.current) { setMatchCount(0); return; }
    const text = editorRef.current.textContent || '';
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(escaped, 'gi'));
    setMatchCount(matches ? matches.length : 0);
  }, [findText]);

  // ── Helpers ──
  const updateStats = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setStats({ words, chars: text.length });
  }, []);

  const getHtml = useCallback(() => editorRef.current ? editorRef.current.innerHTML : '', []);

  const notifyChange = useCallback((html) => {
    lastValueRef.current = html;
    if (onChange) onChange(html);
    updateStats();
  }, [onChange, updateStats]);

  const restoreSelection = useCallback(() => {
    if (savedSelRef.current) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelRef.current);
      } catch { /* ignore */ }
    }
  }, []);

  const focusEditor = useCallback(() => {
    if (editorRef.current) editorRef.current.focus();
  }, []);

  // ── History ──
  const pushHistory = useCallback(() => {
    const html = getHtml();
    const h = historyRef.current;
    if (h.stack[h.index] === html) return;
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(html);
    if (h.stack.length > MAX_HISTORY) h.stack.shift();
    h.index = h.stack.length - 1;
  }, [getHtml]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index > 0) {
      h.index--;
      const html = h.stack[h.index];
      if (editorRef.current) { editorRef.current.innerHTML = html; notifyChange(html); }
    }
  }, [notifyChange]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index < h.stack.length - 1) {
      h.index++;
      const html = h.stack[h.index];
      if (editorRef.current) { editorRef.current.innerHTML = html; notifyChange(html); }
    }
  }, [notifyChange]);

  // ── Execute command ──
  const exec = useCallback((command, val = null) => {
    focusEditor();
    restoreSelection();
    document.execCommand(command, false, val);
    const html = getHtml();
    notifyChange(html);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(pushHistory, HISTORY_DEBOUNCE_MS);
  }, [focusEditor, restoreSelection, getHtml, notifyChange, pushHistory]);

  // ── Input handler ──
  const handleInput = useCallback(() => {
    const html = getHtml();
    notifyChange(html);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(pushHistory, HISTORY_DEBOUNCE_MS);
  }, [getHtml, notifyChange, pushHistory]);

  // ── Paste handler ──
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const cd = e.clipboardData;
    const html = cd.getData('text/html');
    const text = cd.getData('text/plain');
    if (html) {
      document.execCommand('insertHTML', false, sanitizePastedHtml(html));
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
    const newHtml = getHtml();
    notifyChange(newHtml);
    pushHistory();
  }, [getHtml, notifyChange, pushHistory]);

  // ── Toggle inline code ──
  const toggleInlineCode = useCallback(() => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    focusEditor();
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    let codeEl = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'CODE') { codeEl = node; break; }
      node = node.parentNode;
    }
    if (codeEl) {
      const parent = codeEl.parentNode;
      while (codeEl.firstChild) parent.insertBefore(codeEl.firstChild, codeEl);
      parent.removeChild(codeEl);
    } else if (!range.collapsed) {
      try {
        const code = document.createElement('code');
        range.surroundContents(code);
      } catch { /* cross-boundary selection */ }
    }
    notifyChange(getHtml());
    pushHistory();
  }, [focusEditor, getHtml, notifyChange, pushHistory]);

  // ── Document actions ──
  const newDocument = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      notifyChange('');
      pushHistory();
    }
  }, [notifyChange, pushHistory]);

  const exportHTML = useCallback(() => {
    const blob = new Blob([getHtml()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'document.html'; a.click();
    URL.revokeObjectURL(url);
  }, [getHtml]);

  const exportText = useCallback(() => {
    const blob = new Blob([editorRef.current?.textContent || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'document.txt'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Source view ──
  const toggleSource = useCallback(() => {
    if (isSource) {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceCode;
        notifyChange(sourceCode);
        pushHistory();
      }
    } else {
      setSourceCode(getHtml());
    }
    setIsSource(prev => !prev);
  }, [isSource, sourceCode, getHtml, notifyChange, pushHistory]);

  // ── Fullscreen ──
  const toggleFull = useCallback(() => setIsFull(prev => !prev), []);

  // ── Find & Replace ──
  const doReplace = useCallback(() => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newHtml = html.replace(new RegExp(escaped, 'i'), replText);
    editorRef.current.innerHTML = newHtml;
    notifyChange(newHtml);
    pushHistory();
    const text = editorRef.current.textContent || '';
    const m = text.match(new RegExp(escaped, 'gi'));
    setMatchCount(m ? m.length : 0);
  }, [findText, replText, notifyChange, pushHistory]);

  const doReplaceAll = useCallback(() => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newHtml = html.replace(new RegExp(escaped, 'gi'), replText);
    editorRef.current.innerHTML = newHtml;
    notifyChange(newHtml);
    pushHistory();
    setMatchCount(0);
  }, [findText, replText, notifyChange, pushHistory]);

  // ── Dialog handlers ──
  const openDialog = useCallback((type) => {
    if (editorRef.current) {
      const sel = window.getSelection();
      if (sel.rangeCount) savedSelRef.current = sel.getRangeAt(0).cloneRange();
    }
    setDialog({ type, data: type === 'table' ? { rows: 3, cols: 3 } : {} });
    setOpenMenu(null);
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const setDlgData = useCallback((key, val) => {
    setDialog(prev => prev ? { ...prev, data: { ...prev.data, [key]: val } } : null);
  }, []);

  const submitDialog = useCallback(() => {
    if (!dialog) return;
    focusEditor();
    restoreSelection();
    const { type, data } = dialog;
    if (type === 'link') {
      const { url, text, title } = data;
      if (!url) return;
      const t = title ? ` title="${title}"` : '';
      document.execCommand('insertHTML', false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer"${t}>${text || url}</a>`);
    } else if (type === 'image') {
      const { url, alt, title } = data;
      if (!url) return;
      const a = alt ? ` alt="${alt}"` : '';
      const t = title ? ` title="${title}"` : '';
      document.execCommand('insertHTML', false, `<img src="${url}"${a}${t} />`);
    } else if (type === 'table') {
      const r = Math.min(Math.max(parseInt(data.rows) || 1, 1), 20);
      const c = Math.min(Math.max(parseInt(data.cols) || 1, 1), 10);
      let h = '<table><thead><tr>';
      for (let i = 0; i < c; i++) h += '<th>Header</th>';
      h += '</tr></thead><tbody>';
      for (let i = 0; i < r - 1; i++) {
        h += '<tr>';
        for (let j = 0; j < c; j++) h += '<td>Cell</td>';
        h += '</tr>';
      }
      h += '</tbody></table><p><br></p>';
      document.execCommand('insertHTML', false, h);
    }
    notifyChange(getHtml());
    pushHistory();
    closeDialog();
  }, [dialog, focusEditor, restoreSelection, getHtml, notifyChange, pushHistory, closeDialog]);

  // ── Insert helpers ──
  const insertHR = useCallback(() => {
    focusEditor(); restoreSelection();
    document.execCommand('insertHTML', false, '<hr><p><br></p>');
    notifyChange(getHtml()); pushHistory();
  }, [focusEditor, restoreSelection, getHtml, notifyChange, pushHistory]);

  const insertBlockquote = useCallback(() => exec('formatBlock', 'blockquote'), [exec]);

  const insertCodeBlock = useCallback(() => {
    focusEditor(); restoreSelection();
    document.execCommand('insertHTML', false, '<pre><code>code here</code></pre><p><br></p>');
    notifyChange(getHtml()); pushHistory();
  }, [focusEditor, restoreSelection, getHtml, notifyChange, pushHistory]);

  // ── Block format & colors ──
  const handleBlock = useCallback((f) => exec('formatBlock', f), [exec]);

  const handleTextColor = useCallback((c) => { setTextColor(c); exec('foreColor', c); }, [exec]);
  const handleHlColor = useCallback((c) => { setHlColor(c); exec('hiliteColor', c); }, [exec]);

  const clearFmt = useCallback(() => exec('removeFormat'), [exec]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback((e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'b') { e.preventDefault(); exec('bold'); }
    else if (mod && e.key === 'i') { e.preventDefault(); exec('italic'); }
    else if (mod && e.key === 'u') { e.preventDefault(); exec('underline'); }
    else if (mod && e.key === 'e') { e.preventDefault(); toggleInlineCode(); }
    else if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (mod && e.key === 'f') { e.preventDefault(); setShowFind(prev => !prev); }
    else if (mod && e.key === 'n') { e.preventDefault(); newDocument(); }
    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); exec('indent'); }
    else if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); exec('outdent'); }
    else if (e.key === 'F11') { e.preventDefault(); toggleFull(); }
    else if (e.key === 'Escape') { if (dialog) closeDialog(); if (showFind) setShowFind(false); }
  }, [exec, undo, redo, toggleInlineCode, newDocument, toggleFull, dialog, closeDialog, showFind]);

  // Prevent focus loss on toolbar buttons
  const noFocus = useCallback((e) => e.preventDefault(), []);

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════

  // Read-only mode
  if (readOnly) {
    return (
      <div className="pf-shell pf-readonly" ref={shellRef}>
        <div className="pf-header"><span className="pf-header-brand">ProseForge</span></div>
        <div className="pf-content-wrap" style={{ height }}>
          <div className="pf-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || '') }} />
        </div>
      </div>
    );
  }

  // Menu definitions
  const menus = [
    { key: 'file', label: 'File', items: [
      { label: 'New Document', sc: 'Ctrl+N', fn: newDocument },
      '-',
      { label: 'Export as HTML', fn: exportHTML },
      { label: 'Export as Text', fn: exportText },
    ]},
    { key: 'edit', label: 'Edit', items: [
      { label: 'Undo', sc: 'Ctrl+Z', fn: undo },
      { label: 'Redo', sc: 'Ctrl+Shift+Z', fn: redo },
      '-',
      { label: 'Find & Replace', sc: 'Ctrl+F', fn: () => setShowFind(p => !p) },
    ]},
    { key: 'insert', label: 'Insert', items: [
      { label: 'Link', fn: () => openDialog('link') },
      { label: 'Image', fn: () => openDialog('image') },
      '-',
      { label: 'Table', fn: () => openDialog('table') },
      { label: 'Horizontal Rule', fn: insertHR },
      '-',
      { label: 'Code Block', fn: insertCodeBlock },
      { label: 'Blockquote', fn: insertBlockquote },
    ]},
    { key: 'format', label: 'Format', items: [
      { label: 'Bold', sc: 'Ctrl+B', fn: () => exec('bold') },
      { label: 'Italic', sc: 'Ctrl+I', fn: () => exec('italic') },
      { label: 'Underline', sc: 'Ctrl+U', fn: () => exec('underline') },
      { label: 'Strikethrough', fn: () => exec('strikethrough') },
      { label: 'Code', sc: 'Ctrl+E', fn: toggleInlineCode },
      '-',
      { label: 'Clear Formatting', fn: clearFmt },
    ]},
    { key: 'view', label: 'View', items: [
      { label: 'Fullscreen', sc: 'F11', fn: toggleFull },
      { label: isSource ? 'Rich Text' : 'Source Code', fn: toggleSource },
      '-',
      { label: `Word Wrap: ${wordWrap ? 'On' : 'Off'}`, fn: () => setWordWrap(p => !p) },
    ]},
  ];

  return (
    <div className={`pf-shell${isFull ? ' pf-fullscreen' : ''}`} ref={shellRef}
      style={!isFull ? { height: height + 120 } : undefined}>

      {/* ── Header ── */}
      <div className="pf-header">
        <span className="pf-header-brand">ProseForge</span>
        {showFullscreenButton && (
          <button className="pf-header-btn" onClick={toggleFull} onMouseDown={noFocus}>
            {isFull ? IC.collapse : IC.expand}
          </button>
        )}
      </div>

      {/* ── Menubar ── */}
      <div className="pf-menubar">
        {menus.map(m => (
          <div key={m.key} className="pf-menu-wrap">
            <button
              className={`pf-menu-trigger${openMenu === m.key ? ' pf-active' : ''}`}
              onClick={() => setOpenMenu(openMenu === m.key ? null : m.key)}
              onMouseEnter={() => openMenu && setOpenMenu(m.key)}
              onMouseDown={noFocus}
            >
              {m.label}
            </button>
            {openMenu === m.key && (
              <div className="pf-menu-dropdown">
                {m.items.map((item, i) =>
                  item === '-' ? <div key={i} className="pf-menu-sep" /> : (
                    <button key={i} className="pf-menu-item" onMouseDown={noFocus}
                      onClick={() => { item.fn(); setOpenMenu(null); }}>
                      <span>{item.label}</span>
                      {item.sc && <span className="pf-menu-shortcut">{item.sc}</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="pf-toolbar">
        {/* Block format */}
        <select className="pf-block-sel" value={fmt.block}
          onFocus={() => { const s = window.getSelection(); if (s.rangeCount && editorRef.current?.contains(s.getRangeAt(0).commonAncestorContainer)) savedSelRef.current = s.getRangeAt(0).cloneRange(); }}
          onChange={(e) => handleBlock(e.target.value)}>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <div className="pf-toolbar-div" />

        {/* Inline formatting */}
        <button className={`pf-tb${fmt.bold ? ' pf-active' : ''}`} data-tooltip="Bold (Ctrl+B)" onMouseDown={noFocus} onClick={() => exec('bold')}>{IC.bold}</button>
        <button className={`pf-tb${fmt.italic ? ' pf-active' : ''}`} data-tooltip="Italic (Ctrl+I)" onMouseDown={noFocus} onClick={() => exec('italic')}>{IC.italic}</button>
        <button className={`pf-tb${fmt.underline ? ' pf-active' : ''}`} data-tooltip="Underline (Ctrl+U)" onMouseDown={noFocus} onClick={() => exec('underline')}>{IC.underline}</button>
        <button className={`pf-tb${fmt.strike ? ' pf-active' : ''}`} data-tooltip="Strikethrough" onMouseDown={noFocus} onClick={() => exec('strikethrough')}>{IC.strike}</button>
        <button className="pf-tb" data-tooltip="Code (Ctrl+E)" onMouseDown={noFocus} onClick={toggleInlineCode}>{IC.code}</button>

        <div className="pf-toolbar-div" />

        {/* Colors */}
        <div className="pf-color-wrap">
          <button className="pf-color-btn" data-tooltip="Text Color">
            {IC.textCol}
            <span className="pf-color-ind" style={{ background: textColor }} />
          </button>
          <input type="color" className="pf-color-input" value={textColor}
            onMouseDown={() => { const s = window.getSelection(); if (s.rangeCount && editorRef.current?.contains(s.getRangeAt(0).commonAncestorContainer)) savedSelRef.current = s.getRangeAt(0).cloneRange(); }}
            onChange={(e) => handleTextColor(e.target.value)} />
        </div>
        <div className="pf-color-wrap">
          <button className="pf-color-btn" data-tooltip="Highlight">
            {IC.hilite}
            <span className="pf-color-ind" style={{ background: hlColor }} />
          </button>
          <input type="color" className="pf-color-input" value={hlColor}
            onMouseDown={() => { const s = window.getSelection(); if (s.rangeCount && editorRef.current?.contains(s.getRangeAt(0).commonAncestorContainer)) savedSelRef.current = s.getRangeAt(0).cloneRange(); }}
            onChange={(e) => handleHlColor(e.target.value)} />
        </div>

        <div className="pf-toolbar-div" />

        {/* Alignment */}
        <button className="pf-tb" data-tooltip="Align Left" onMouseDown={noFocus} onClick={() => exec('justifyLeft')}>{IC.alignL}</button>
        <button className="pf-tb" data-tooltip="Align Center" onMouseDown={noFocus} onClick={() => exec('justifyCenter')}>{IC.alignC}</button>
        <button className="pf-tb" data-tooltip="Align Right" onMouseDown={noFocus} onClick={() => exec('justifyRight')}>{IC.alignR}</button>
        <button className="pf-tb" data-tooltip="Justify" onMouseDown={noFocus} onClick={() => exec('justifyFull')}>{IC.alignJ}</button>

        <div className="pf-toolbar-div" />

        {/* Lists */}
        <button className="pf-tb" data-tooltip="Bullet List" onMouseDown={noFocus} onClick={() => exec('insertUnorderedList')}>{IC.listUl}</button>
        <button className="pf-tb" data-tooltip="Numbered List" onMouseDown={noFocus} onClick={() => exec('insertOrderedList')}>{IC.listOl}</button>
        <button className="pf-tb" data-tooltip="Increase Indent" onMouseDown={noFocus} onClick={() => exec('indent')}>{IC.indentR}</button>
        <button className="pf-tb" data-tooltip="Decrease Indent" onMouseDown={noFocus} onClick={() => exec('outdent')}>{IC.indentL}</button>

        <div className="pf-toolbar-div" />

        {/* Insert */}
        <button className="pf-tb" data-tooltip="Insert Link" onMouseDown={noFocus} onClick={() => openDialog('link')}>{IC.link}</button>
        <button className="pf-tb" data-tooltip="Insert Image" onMouseDown={noFocus} onClick={() => openDialog('image')}>{IC.image}</button>
        <button className="pf-tb" data-tooltip="Insert Table" onMouseDown={noFocus} onClick={() => openDialog('table')}>{IC.table}</button>
        <button className="pf-tb" data-tooltip="Horizontal Rule" onMouseDown={noFocus} onClick={insertHR}>{IC.hr}</button>
        <button className="pf-tb" data-tooltip="Blockquote" onMouseDown={noFocus} onClick={insertBlockquote}>{IC.quote}</button>

        <div className="pf-toolbar-div" />

        {/* Utility */}
        <button className="pf-tb" data-tooltip="Undo (Ctrl+Z)" onMouseDown={noFocus} onClick={undo}>{IC.undo}</button>
        <button className="pf-tb" data-tooltip="Redo (Ctrl+Shift+Z)" onMouseDown={noFocus} onClick={redo}>{IC.redo}</button>
        <button className="pf-tb" data-tooltip="Clear Formatting" onMouseDown={noFocus} onClick={clearFmt}>{IC.clearFmt}</button>
        {showFullscreenButton && (
          <button className="pf-tb" data-tooltip={isFull ? 'Exit Fullscreen' : 'Fullscreen (F11)'} onMouseDown={noFocus} onClick={toggleFull}>
            {isFull ? IC.collapse : IC.expand}
          </button>
        )}
      </div>

      {/* ── Find & Replace ── */}
      {showFind && (
        <div className="pf-find-bar">
          <input className="pf-find-input" placeholder="Find..." value={findText}
            onChange={(e) => setFindText(e.target.value)} autoFocus />
          <span className="pf-find-count">{matchCount} results</span>
          <input className="pf-find-input" placeholder="Replace..." value={replText}
            onChange={(e) => setReplText(e.target.value)} />
          <button className="pf-find-btn" onClick={doReplace}>Replace</button>
          <button className="pf-find-btn" onClick={doReplaceAll}>Replace All</button>
          <button className="pf-find-close" onMouseDown={noFocus}
            onClick={() => { setShowFind(false); setFindText(''); setReplText(''); }}>
            {IC.close}
          </button>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="pf-content-wrap" style={isFull ? { flex: 1 } : { height }}>
        {isSource ? (
          <textarea
            className={`pf-source${!wordWrap ? ' pf-nowrap' : ''}`}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div
            ref={editorRef}
            className="pf-content"
            contentEditable
            data-placeholder={placeholder}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
            style={isFull ? { maxWidth: 800, margin: '0 auto' } : undefined}
          />
        )}
      </div>

      {/* ── Status Bar ── */}
      <div className="pf-statusbar">
        <div className="pf-statusbar-left">
          <span><span className="pf-status-dot" />{isSource ? 'Source' : 'Rich Text'}</span>
          <span>{stats.words} words</span>
          <span>{stats.chars} characters</span>
        </div>
        <div className="pf-statusbar-right">
          {isSource && <span>HTML</span>}
          {isSource && <span>Wrap: {wordWrap ? 'On' : 'Off'}</span>}
          <span>ProseForge</span>
        </div>
      </div>

      {/* ── Dialogs ── */}
      {dialog && (
        <div className="pf-dialog-overlay" onClick={closeDialog}>
          <div className="pf-dialog" onClick={(e) => e.stopPropagation()}>
            {dialog.type === 'link' && (<>
              <h3>Insert Link</h3>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">URL *</label>
                <input className="pf-dialog-input" placeholder="https://..." autoFocus
                  value={dialog.data.url || ''} onChange={(e) => setDlgData('url', e.target.value)} />
              </div>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Text (optional)</label>
                <input className="pf-dialog-input" placeholder="Link text"
                  value={dialog.data.text || ''} onChange={(e) => setDlgData('text', e.target.value)} />
              </div>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Title (optional)</label>
                <input className="pf-dialog-input" placeholder="Tooltip text"
                  value={dialog.data.title || ''} onChange={(e) => setDlgData('title', e.target.value)} />
              </div>
            </>)}
            {dialog.type === 'image' && (<>
              <h3>Insert Image</h3>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Image URL *</label>
                <input className="pf-dialog-input" placeholder="https://..." autoFocus
                  value={dialog.data.url || ''} onChange={(e) => setDlgData('url', e.target.value)} />
              </div>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Alt Text</label>
                <input className="pf-dialog-input" placeholder="Image description"
                  value={dialog.data.alt || ''} onChange={(e) => setDlgData('alt', e.target.value)} />
              </div>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Title (optional)</label>
                <input className="pf-dialog-input" placeholder="Tooltip text"
                  value={dialog.data.title || ''} onChange={(e) => setDlgData('title', e.target.value)} />
              </div>
            </>)}
            {dialog.type === 'table' && (<>
              <h3>Insert Table</h3>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Rows (1-20)</label>
                <input className="pf-dialog-input" type="number" min="1" max="20" autoFocus
                  value={dialog.data.rows || 3} onChange={(e) => setDlgData('rows', e.target.value)} />
              </div>
              <div className="pf-dialog-field">
                <label className="pf-dialog-label">Columns (1-10)</label>
                <input className="pf-dialog-input" type="number" min="1" max="10"
                  value={dialog.data.cols || 3} onChange={(e) => setDlgData('cols', e.target.value)} />
              </div>
            </>)}
            <div className="pf-dialog-actions">
              <button className="pf-dialog-btn pf-dialog-btn-cancel" onClick={closeDialog}>Cancel</button>
              <button className="pf-dialog-btn pf-dialog-btn-primary" onClick={submitDialog}>
                {dialog.type === 'table' ? 'Insert Table' : dialog.type === 'image' ? 'Insert Image' : 'Insert Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProseForgeEditor;
