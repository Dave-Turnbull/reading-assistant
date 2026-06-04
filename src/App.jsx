import React, { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ─── Fonts ───────────────────────────────────────────────────────
const FONTS = [
  { id: 'lexend',       label: 'Lexend',               family: "'Lexend', sans-serif",                tag: 'dyslexia' },
  { id: 'atkinson',    label: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible', sans-serif", tag: 'dyslexia' },
  { id: 'opendyslexic', label: 'OpenDyslexic',         family: "'OpenDyslexic', sans-serif",          tag: 'dyslexia' },
  { id: 'dm-sans',     label: 'DM Sans',               family: "'DM Sans', sans-serif",               tag: 'sans' },
  { id: 'lora',        label: 'Lora',                  family: "'Lora', Georgia, serif",              tag: 'serif' },
  { id: 'merriweather', label: 'Merriweather',         family: "'Merriweather', Georgia, serif",      tag: 'serif' },
]

// ─── Focus word sizes (1.5× progression: ~72, 108, 162, 243) ─────
const FOCUS_SIZES = [
  { label: 'S',  px: 48  },
  { label: 'M',  px: 72  },
  { label: 'L',  px: 108 },
  { label: 'XL', px: 162 },
]

// ─── Body text sizes ──────────────────────────────────────────────
const BODY_SIZES = [
  { label: 'S',  px: 14 },
  { label: 'M',  px: 17 },
  { label: 'L',  px: 20 },
  { label: 'XL', px: 24 },
]

// ─── Colour themes ────────────────────────────────────────────────
const THEMES = [
  {
    id: 'dark', label: 'Dark', swatch: '#1e1e24',
    vars: {
      '--bg':             '#141418',
      '--surface':        '#1e1e24',
      '--surface2':       '#28282f',
      '--border':         '#38383f',
      '--ink':            '#e8e4de',
      '--ink-mid':        '#a09890',
      '--ink-light':      '#555050',
      '--accent':         '#d4924a',
      '--accent-soft':    '#e8a85a',
      '--accent-pale':    '#3a2a14',
      '--highlight':      'rgba(212,146,74,0.22)',
      '--highlight-line': 'rgba(212,146,74,0.7)',
      '--textarea-bg':    '#1a1a20',
    },
  },
  {
    id: 'oled', label: 'OLED', swatch: '#000000',
    vars: {
      '--bg':             '#000000',
      '--surface':        '#0a0a0a',
      '--surface2':       '#111111',
      '--border':         '#222222',
      '--ink':            '#f0ece6',
      '--ink-mid':        '#888880',
      '--ink-light':      '#404040',
      '--accent':         '#d4924a',
      '--accent-soft':    '#e8a85a',
      '--accent-pale':    '#1e1408',
      '--highlight':      'rgba(212,146,74,0.2)',
      '--highlight-line': 'rgba(212,146,74,0.65)',
      '--textarea-bg':    '#000000',
    },
  },
  {
    id: 'light', label: 'Light', swatch: '#f0f0f0',
    vars: {
      '--bg':             '#f0f0f0',
      '--surface':        '#e3e3e3',
      '--surface2':       '#d8d8d8',
      '--border':         '#c0c0c0',
      '--ink':            '#0a0a0a',
      '--ink-mid':        '#2a2a2a',
      '--ink-light':      '#7a7a7a',
      '--accent':         '#a05c10',
      '--accent-soft':    '#c07830',
      '--accent-pale':    '#eedcb8',
      '--highlight':      'rgba(160,92,16,0.15)',
      '--highlight-line': 'rgba(160,92,16,0.6)',
      '--textarea-bg':    'rgba(0,0,0,0.07)',
    },
  },
  {
    id: 'warm', label: 'Warm', swatch: '#efe8dd',
    vars: {
      '--bg':             '#f7f3ed',
      '--surface':        '#efe8dd',
      '--surface2':       '#e5ddd2',
      '--border':         '#d9cec2',
      '--ink':            '#2c2416',
      '--ink-mid':        '#5a4f42',
      '--ink-light':      '#9e8e7e',
      '--accent':         '#c8823a',
      '--accent-soft':    '#e8a85a',
      '--accent-pale':    '#f5ddb8',
      '--highlight':      'rgba(200,130,58,0.28)',
      '--highlight-line': 'rgba(200,130,58,0.75)',
      '--textarea-bg':    '#ffffff',
    },
  },
  {
    id: 'sky', label: 'Sky', swatch: '#71d9e3',
    vars: {
      '--bg':             '#71d9e3',
      '--surface':        '#5dcad4',
      '--surface2':       '#4dbbc6',
      '--border':         'rgba(0,0,0,0.18)',
      '--ink':            '#0a0a0a',
      '--ink-mid':        '#1a1a1a',
      '--ink-light':      '#3a5a60',
      '--accent':         '#005a70',
      '--accent-soft':    '#007a90',
      '--accent-pale':    'rgba(0,0,0,0.07)',
      '--highlight':      'rgba(0,90,112,0.18)',
      '--highlight-line': 'rgba(0,90,112,0.55)',
      '--textarea-bg':    'rgba(0,0,0,0.07)',
    },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────
function tokenize(text) {
  if (!text.trim()) return []
  return text.split(/(\s+)/).filter(c => c.length > 0 && !/^\s+$/.test(c))
}

function displayWord(word, hidePunct) {
  return hidePunct ? word.replace(/[^a-zA-Z0-9]/g, '') : word
}

function findTokenOffset(text, tokenIndex) {
  const tokens = []
  let i = 0
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++
    if (i >= text.length) break
    const start = i
    while (i < text.length && !/\s/.test(text[i])) i++
    tokens.push({ start, end: i })
  }
  return (tokenIndex >= 0 && tokenIndex < tokens.length) ? tokens[tokenIndex] : null
}

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  const [text, setText]                 = useState("Hello! Paste a paragraph in the text field, and use the buttons or arrow keys to scroll through the text. Don't forget to check out the customization options in the top left!")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hidePunct, setHidePunct]       = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontId, setFontId]             = useState('lexend')
  const [focusSizeIdx, setFocusSizeIdx] = useState(1)   // M
  const [bodySizeIdx, setBodySizeIdx]   = useState(1)   // M
  const [themeId, setThemeId]           = useState('dark')

  const textareaRef  = useRef(null)
  const settingsRef  = useRef(null)

  const words       = tokenize(text)
  const safeIndex   = Math.min(currentIndex, Math.max(0, words.length - 1))
  const activeFont  = FONTS.find(f => f.id === fontId) || FONTS[0]
  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const focusPx     = FOCUS_SIZES[focusSizeIdx].px
  const bodyPx      = BODY_SIZES[bodySizeIdx].px

  // ── Apply theme vars to <html> so html/body background matches ──
  useEffect(() => {
    const root = document.documentElement
    Object.entries(activeTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.style.setProperty('--font-active', activeFont.family)
    root.style.setProperty('--focus-size', `${focusPx}px`)
    root.style.setProperty('--body-size', `${bodyPx}px`)
    // Force bg and ink directly onto body to override any cascade issues
    const ink = activeTheme.vars['--ink']
    const bg  = activeTheme.vars['--bg']
    document.body.style.color = ink
    document.body.style.backgroundColor = bg
  }, [activeTheme, activeFont, focusPx, bodyPx])

  const go = useCallback((dir) => {
    setCurrentIndex(prev => Math.max(0, Math.min(words.length - 1, prev + dir)))
  }, [words.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.target === textareaRef.current) return
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); go(-1) }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  { e.preventDefault(); go(1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go])

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, Math.max(0, tokenize(text).length - 1)))
  }, [text])

  const offset        = findTokenOffset(text, safeIndex)
  const displayedWord = displayWord(words[safeIndex] || '', hidePunct)
  const isFirst       = safeIndex === 0
  const isLast        = safeIndex >= words.length - 1

  return (
    <div className="app">

      {/* ── Settings ── */}
      <div className="settings-anchor" ref={settingsRef}>
        <button
          className={`settings-btn ${settingsOpen ? 'open' : ''}`}
          onClick={() => setSettingsOpen(v => !v)}
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>

        {settingsOpen && (
          <div className="settings-popout">

            <div className="settings-section-label">Display</div>
            <label className="toggle-row">
              <span>Hide punctuation</span>
              <Toggle on={hidePunct} onToggle={() => setHidePunct(v => !v)} />
            </label>

            <div className="settings-divider" />

            <div className="settings-section-label">Focus word size</div>
            <div className="size-btns">
              {FOCUS_SIZES.map((s, i) => (
                <button key={s.label}
                  className={`size-btn ${i === focusSizeIdx ? 'active' : ''}`}
                  onClick={() => setFocusSizeIdx(i)}>{s.label}</button>
              ))}
            </div>

            <div className="settings-divider" />

            <div className="settings-section-label">Body text size</div>
            <div className="size-btns">
              {BODY_SIZES.map((s, i) => (
                <button key={s.label}
                  className={`size-btn ${i === bodySizeIdx ? 'active' : ''}`}
                  onClick={() => setBodySizeIdx(i)}>{s.label}</button>
              ))}
            </div>

            <div className="settings-divider" />

            <div className="settings-section-label">Theme</div>
            <div className="theme-swatches">
              {THEMES.map(t => (
                <button key={t.id}
                  className={`theme-swatch ${t.id === themeId ? 'active' : ''}`}
                  style={{ background: t.swatch }}
                  onClick={() => setThemeId(t.id)}
                  title={t.label}
                  aria-pressed={t.id === themeId}
                >
                  {t.id === themeId && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="theme-label-row">
              {THEMES.map(t => (
                <span key={t.id} className={`theme-label ${t.id === themeId ? 'active' : ''}`}>{t.label}</span>
              ))}
            </div>

            <div className="settings-divider" />

            <div className="settings-section-label">Font</div>
            <div className="font-list">
              {FONTS.map(f => (
                <button key={f.id}
                  className={`font-btn ${f.id === fontId ? 'active' : ''}`}
                  onClick={() => setFontId(f.id)}
                  style={{ fontFamily: f.family }}
                  aria-pressed={f.id === fontId}
                >
                  <span className="font-btn-name">{f.label}</span>
                  {f.tag === 'dyslexia' && <span className="font-tag">✦ dyslexia</span>}
                </button>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ── Focus bar ── */}
      {words.length > 0 && (
        <div className="focus-bar">
          <button className="nav-btn nav-btn--side" onClick={() => go(-1)} disabled={isFirst} aria-label="Previous word">
            <ChevronLeft />
          </button>

          <div className="focus-word-wrap">
            <div className="focus-progress">
              <div className="focus-progress-fill"
                style={{ width: words.length > 1 ? `${(safeIndex / (words.length - 1)) * 100}%` : '100%' }} />
            </div>

            <div
              className="focus-word"
              key={`${safeIndex}-${focusSizeIdx}-${fontId}`}
              style={{ fontSize: `${focusPx}px`, color: activeTheme.vars['--ink'] }}
            >
              {displayedWord || '—'}
            </div>

            <div className="focus-counter">{safeIndex + 1} / {words.length}</div>

            {/* Mobile buttons */}
            <div className="nav-row--mobile">
              <button className="nav-btn nav-btn--mobile" onClick={() => go(-1)} disabled={isFirst} aria-label="Previous word">
                <ChevronLeft />
              </button>
              <button className="nav-btn nav-btn--mobile" onClick={() => go(1)} disabled={isLast} aria-label="Next word">
                <ChevronRight />
              </button>
            </div>
          </div>

          <button className="nav-btn nav-btn--side" onClick={() => go(1)} disabled={isLast} aria-label="Next word">
            <ChevronRight />
          </button>
        </div>
      )}

      {/* ── Editor ── */}
      <div className="editor-wrap">
        <div className="editor-hint">
          {words.length === 0 ? 'Start typing to begin…' : 'Use ← → arrow keys or the buttons to navigate'}
        </div>
        <div className="textarea-container">
          <HighlightedTextarea text={text} offset={offset} onChange={setText} textareaRef={textareaRef} inkColor={activeTheme.vars['--ink']} />
        </div>
      </div>
    </div>
  )
}

// ─── Toggle component ─────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`}
      onClick={onToggle} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle()}>
      <div className="toggle-thumb" />
    </div>
  )
}

// ─── Highlighted textarea ─────────────────────────────────────────
function HighlightedTextarea({ text, offset, onChange, textareaRef, inkColor }) {
  const mirrorRef = useRef(null)
  const [highlightPos, setHighlightPos] = useState(null)

  const syncScroll = () => {
    if (textareaRef.current && mirrorRef.current)
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop
  }

  useEffect(() => {
    if (!offset || !mirrorRef.current) { setHighlightPos(null); return }
    const mirror = mirrorRef.current
    mirror.innerHTML = ''
    const before = document.createElement('span')
    before.textContent = text.substring(0, offset.start)
    const word = document.createElement('span')
    word.textContent = text.substring(offset.start, offset.end)
    const after = document.createElement('span')
    after.textContent = text.substring(offset.end)
    mirror.appendChild(before)
    mirror.appendChild(word)
    mirror.appendChild(after)
    const wr = word.getBoundingClientRect()
    const mr = mirror.getBoundingClientRect()
    setHighlightPos({ top: wr.top - mr.top, left: wr.left - mr.left, width: wr.width, height: wr.height })
  }, [text, offset])

  return (
    <div className="textarea-inner">
      <div ref={mirrorRef} className="textarea-mirror" aria-hidden="true" />
      {highlightPos && (
        <div className="word-highlight" style={{
          top: highlightPos.top, left: highlightPos.left,
          width: highlightPos.width, height: highlightPos.height,
        }} />
      )}
      <textarea
        ref={textareaRef}
        className="textarea"
        value={text}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={true}
        placeholder="Start typing your text here…"
        style={{ color: inkColor }}
      />
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────
function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3v1M10 16v1M3 10h1M16 10h1M5.05 5.05l.7.7M14.25 14.25l.7.7M14.95 5.05l-.7.7M5.75 14.25l-.7.7" />
    </svg>
  )
}
function ChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5l-5 5 5 5" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5l5 5-5 5" />
    </svg>
  )
}
