import React, { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ─── Fonts ───────────────────────────────────────────────────────
const FONTS = [
  { id: 'lexend',        label: 'Lexend',               family: "'Lexend', sans-serif",                tag: 'dyslexia' },
  { id: 'atkinson',      label: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible', sans-serif", tag: 'dyslexia' },
  { id: 'opendyslexic',  label: 'OpenDyslexic',          family: "'OpenDyslexic', sans-serif",          tag: 'dyslexia' },
  { id: 'dm-sans',       label: 'DM Sans',               family: "'DM Sans', sans-serif",               tag: 'sans' },
  { id: 'lora',          label: 'Lora',                  family: "'Lora', Georgia, serif",              tag: 'serif' },
  { id: 'merriweather',  label: 'Merriweather',          family: "'Merriweather', Georgia, serif",      tag: 'serif' },
]

const FOCUS_SIZES = [
  { label: 'S',  px: 48  },
  { label: 'M',  px: 72  },
  { label: 'L',  px: 108 },
  { label: 'XL', px: 162 },
]

const BODY_SIZES = [
  { label: 'S',  px: 14 },
  { label: 'M',  px: 17 },
  { label: 'L',  px: 20 },
  { label: 'XL', px: 24 },
]

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

/**
 * Parse text into line-aware structure.
 * Returns:
 *   flatWords:  string[]        — every word in order
 *   lineOf:     number[]        — which line index each flat word belongs to
 *   lineStart:  number[]        — flat index of first word on each line
 *   lines:      string[][]      — words grouped by line (empty lines are [])
 */
function parseLines(text) {
  const rawLines = text.split('\n')
  const flatWords = []
  const lineOf    = []
  const lineStart = []
  const lines     = []

  rawLines.forEach((rawLine, li) => {
    const words = rawLine.split(/\s+/).filter(w => w.length > 0)
    lineStart.push(flatWords.length)
    lines.push(words)
    words.forEach(w => {
      lineOf.push(li)
      flatWords.push(w)
    })
  })

  return { flatWords, lineOf, lineStart, lines }
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
  const [text, setText]                 = useState("Hello! Paste a paragraph in the text field, and use the buttons or arrow keys to scroll through the text.\nDon't forget to check out the customization options in the top left!")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hidePunct, setHidePunct]       = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontId, setFontId]             = useState('lexend')
  const [focusSizeIdx, setFocusSizeIdx] = useState(1)
  const [bodySizeIdx, setBodySizeIdx]   = useState(1)
  const [themeId, setThemeId]           = useState('dark')

  // Animation key increments to retrigger CSS animation on line change
  const [animKey, setAnimKey]     = useState(0)
  const [slideDir, setSlideDir]   = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevLineRef    = useRef(0)
  const animTimerRef   = useRef(null)

  const textareaRef   = useRef(null)
  const settingsRef   = useRef(null)
  const scrollerRef   = useRef(null)
  const activeWordRef = useRef(null)

  const parsed      = parseLines(text)
  const { flatWords, lineOf, lineStart, lines } = parsed
  const totalWords  = flatWords.length
  const safeIndex   = Math.min(currentIndex, Math.max(0, totalWords - 1))
  const activeFont  = FONTS.find(f => f.id === fontId) || FONTS[0]
  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const focusPx     = FOCUS_SIZES[focusSizeIdx].px
  const bodyPx      = BODY_SIZES[bodySizeIdx].px
  const currentLine = totalWords > 0 ? lineOf[safeIndex] : 0
  const ink         = activeTheme.vars['--ink']

  // Apply theme vars to <html>
  useEffect(() => {
    const root = document.documentElement
    Object.entries(activeTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.style.setProperty('--font-active', activeFont.family)
    root.style.setProperty('--focus-size', `${focusPx}px`)
    root.style.setProperty('--body-size', `${bodyPx}px`)
    document.body.style.color = ink
    document.body.style.backgroundColor = activeTheme.vars['--bg']
  }, [activeTheme, activeFont, focusPx, bodyPx, ink])

  // Vertical slide when line changes - content updates immediately, animation plays over it
  useEffect(() => {
    if (currentLine === prevLineRef.current) return
    const dir = currentLine > prevLineRef.current ? 'up' : 'down'
    prevLineRef.current = currentLine
    setSlideDir(dir)
    setAnimKey(k => k + 1)
    setIsAnimating(true)
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    animTimerRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, 290)
    return () => clearTimeout(animTimerRef.current)
  }, [currentLine])

  // Scroll active word to centre — wait for line transition to finish first
  useEffect(() => {
    if (isAnimating) return
    const scroller = scrollerRef.current
    const activeEl = activeWordRef.current
    if (!scroller || !activeEl) return
    const centre = scroller.clientWidth / 2
    const wordCentre = activeEl.offsetLeft + activeEl.offsetWidth / 2
    scroller.scrollLeft = wordCentre - centre
  }, [safeIndex, currentLine, focusSizeIdx, fontId, text, isAnimating])

  const go = useCallback((dir) => {
    setCurrentIndex(prev => Math.max(0, Math.min(totalWords - 1, prev + dir)))
  }, [totalWords])

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
    const newTotal = parseLines(text).flatWords.length
    setCurrentIndex(prev => Math.min(prev, Math.max(0, newTotal - 1)))
  }, [text])

  const offset  = findTokenOffset(text, safeIndex)
  const isFirst = safeIndex === 0
  const isLast  = safeIndex >= totalWords - 1

  // Always render currentLine's words immediately
  const renderedLineWords = (lines[currentLine] || []).map((w, wi) => ({
    word: w,
    flatIdx: lineStart[currentLine] + wi,
  }))

  const activeWordInLine = safeIndex - lineStart[currentLine]

  const slideClass = slideDir === 'up'   ? 'animate-slideInUp'
                   : slideDir === 'down' ? 'animate-slideInDown'
                   : ''

  return (
    <div className="max-w-[740px] mx-auto pt-12 pb-[60px] min-h-screen flex flex-col max-[600px]:pt-5 max-[600px]:pb-10">

      {/* ── Settings ── */}
      <div className="fixed top-[18px] left-[18px] z-[200]" ref={settingsRef}>
        <button
          className="group w-10 h-10 rounded-full border-[1.5px] border-brd bg-surface text-ink-mid cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-ui hover:border-accent-soft hover:bg-accent-pale"
          onClick={() => setSettingsOpen(v => !v)}
          aria-label="Settings"
        >
          <span className={`transition-transform duration-300 text-2xl group-hover:rotate-45 group-hover:text-accent ${settingsOpen ? 'rotate-45 text-accent' : ''}`}>
            ⚙
          </span>
        </button>

        {settingsOpen && (
          <div className="absolute top-[calc(100%+10px)] left-0 bg-surface border-[1.5px] border-brd rounded-xl p-[16px_18px_18px] w-[260px] shadow-[0_8px_32px_rgba(0,0,0,0.28)] animate-popIn font-ui max-h-[calc(100vh-80px)] overflow-y-auto tiny-scroll max-[600px]:w-[calc(100vw-36px)] max-[600px]:max-w-[320px]">

            <SectionLabel>Display</SectionLabel>
            <label className="flex items-center justify-between gap-3 cursor-pointer text-sm text-ink-mid">
              <span>Hide punctuation</span>
              <Toggle on={hidePunct} onToggle={() => setHidePunct(v => !v)} />
            </label>

            <Divider />

            <SectionLabel>Focus word size</SectionLabel>
            <div className="flex gap-1.5">
              {FOCUS_SIZES.map((s, i) => (
                <SizeButton key={s.label} active={i === focusSizeIdx} onClick={() => setFocusSizeIdx(i)}>{s.label}</SizeButton>
              ))}
            </div>

            <Divider />

            <SectionLabel>Body text size</SectionLabel>
            <div className="flex gap-1.5">
              {BODY_SIZES.map((s, i) => (
                <SizeButton key={s.label} active={i === bodySizeIdx} onClick={() => setBodySizeIdx(i)}>{s.label}</SizeButton>
              ))}
            </div>

            <Divider />

            <SectionLabel>Theme</SectionLabel>
            <div className="flex gap-2 mb-1.5">
              {THEMES.map(t => (
                <button key={t.id}
                  className={`w-9 h-9 rounded-full cursor-pointer relative transition-all duration-150 flex items-center justify-center shrink-0 hover:scale-110 ${t.id === themeId ? 'border-[2.5px] border-accent scale-105' : 'border-2 border-brd'}`}
                  style={{ background: t.swatch }}
                  onClick={() => setThemeId(t.id)}
                  title={t.label}
                  aria-pressed={t.id === themeId}
                >
                  {t.id === themeId && <span className="text-[13px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {THEMES.map(t => (
                <span key={t.id} className={`flex-1 text-[9px] text-center tracking-[0.04em] truncate ${t.id === themeId ? 'text-accent font-semibold' : 'text-ink-light'}`}>{t.label}</span>
              ))}
            </div>

            <Divider />

            <SectionLabel>Font</SectionLabel>
            <div className="flex flex-col gap-1">
              {FONTS.map(f => (
                <button key={f.id}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 text-left gap-2 border-[1.5px] ${f.id === fontId ? 'bg-accent-pale border-accent-soft' : 'border-transparent hover:bg-surface2 hover:border-brd'}`}
                  onClick={() => setFontId(f.id)}
                  style={{ fontFamily: f.family }}
                  aria-pressed={f.id === fontId}
                >
                  <span className="text-sm text-ink leading-tight">{f.label}</span>
                  {f.tag === 'dyslexia' && <span className="font-ui text-[9px] font-medium tracking-[0.06em] text-accent bg-accent-pale rounded px-[5px] py-0.5 whitespace-nowrap shrink-0">✦ dyslexia</span>}
                </button>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ── Word strip ── */}
      {totalWords > 0 && (
        <div className="relative w-screen left-1/2 -translate-x-1/2 mb-6 flex flex-col">
          <div className="absolute top-[3px] bottom-0 left-0 w-[22%] pointer-events-none z-[2] fade-left" />
          <div className="absolute top-[3px] bottom-0 right-0 w-[22%] pointer-events-none z-[2] fade-right" />

          <div className="w-full h-[3px] bg-brd shrink-0">
            <div className="h-full bg-accent rounded-r-sm transition-[width] duration-200 ease-out"
              style={{ width: totalWords > 1 ? `${(safeIndex / (totalWords - 1)) * 100}%` : '100%' }} />
          </div>

          {/* clipping window — clips the vertical slide */}
          <div className="overflow-hidden">
            <div key={animKey} ref={scrollerRef}
              className={`flex flex-row items-center gap-[1em] overflow-x-hidden px-[50vw] py-5 whitespace-nowrap scroll-smooth select-none ${slideClass}`}>
              {renderedLineWords.map(({ word, flatIdx }, wi) => {
                const isActive = wi === activeWordInLine
                return (
                  <span
                    key={wi}
                    ref={isActive ? activeWordRef : null}
                    className={`inline-block font-semibold leading-[1.15] tracking-[0.01em] cursor-pointer transition-opacity duration-150 shrink-0 ${isActive ? 'opacity-100' : 'opacity-[0.18] hover:opacity-45'}`}
                    style={{ fontSize: `${focusPx}px`, fontFamily: activeFont.family, color: ink }}
                    onClick={() => setCurrentIndex(flatIdx)}
                  >
                    {displayWord(word, hidePunct)}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 pb-1">
            <NavButton onClick={() => go(-1)} disabled={isFirst} aria-label="Previous word">
              <ChevronLeft />
            </NavButton>
            <span className="font-ui text-xs text-ink-light font-light tracking-[0.06em] min-w-[60px] text-center">{safeIndex + 1} / {totalWords}</span>
            <NavButton onClick={() => go(1)} disabled={isLast} aria-label="Next word">
              <ChevronRight />
            </NavButton>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div className="flex-1 flex flex-col gap-2.5 px-7 max-[600px]:px-3.5">
        <div className="font-ui text-xs text-ink-light font-light tracking-[0.03em] pl-0.5">
          {totalWords === 0 ? 'Start typing to begin…' : 'Use ← → arrow keys or the buttons to navigate'}
        </div>
        <div className="border-[1.5px] border-brd rounded-xl bg-textarea-bg overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 focus-within:border-accent-soft focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06),0_0_0_3px_var(--highlight)]">
          <HighlightedTextarea text={text} offset={offset} onChange={setText} textareaRef={textareaRef} inkColor={ink} />
        </div>
      </div>
    </div>
  )
}

// ─── Small UI helpers ────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-ink-light mb-2.5">{children}</div>
}
function Divider() {
  return <div className="border-t border-brd my-3.5" />
}
function SizeButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1.5 rounded-lg border-[1.5px] font-ui text-xs font-medium cursor-pointer transition-all duration-150 text-center ${active ? 'bg-accent border-accent text-white font-semibold' : 'border-brd bg-bg text-ink-mid hover:border-accent-soft hover:bg-accent-pale hover:text-accent'}`}>
      {children}
    </button>
  )
}
function NavButton({ onClick, disabled, children, ...rest }) {
  return (
    <button onClick={onClick} disabled={disabled} {...rest}
      className="w-[52px] h-[52px] rounded-full border-[1.5px] border-brd bg-surface text-ink-mid cursor-pointer flex items-center justify-center shrink-0 transition-all duration-150 enabled:hover:bg-accent-pale enabled:hover:border-accent-soft enabled:hover:text-accent enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-25 disabled:cursor-default [&_svg]:w-[22px] [&_svg]:h-[22px] max-[600px]:w-16 max-[600px]:h-16 max-[600px]:[&_svg]:w-[26px] max-[600px]:[&_svg]:h-[26px]">
      {children}
    </button>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle()}
      className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 cursor-pointer shrink-0 ${on ? 'bg-accent' : 'bg-brd'}`}>
      <div className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-transform duration-200 ${on ? 'translate-x-[18px]' : ''}`} />
    </div>
  )
}

// ─── Highlighted textarea ─────────────────────────────────────────
function HighlightedTextarea({ text, offset, onChange, textareaRef, inkColor }) {
  const mirrorRef = useRef(null)
  const [highlightPos, setHighlightPos] = useState(null)
  const [scrollTop, setScrollTop] = useState(0)

  const syncScroll = () => {
    if (textareaRef.current) {
      const st = textareaRef.current.scrollTop
      if (mirrorRef.current) mirrorRef.current.scrollTop = st
      setScrollTop(st)
    }
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
    const top = wr.top - mr.top
    setHighlightPos({ top, left: wr.left - mr.left, width: wr.width, height: wr.height })

    // Keep the highlighted word visible inside the textarea
    const ta = textareaRef.current
    if (ta) {
      const margin = wr.height * 1.5 // keep a little breathing room above/below
      const viewTop = ta.scrollTop
      const viewBottom = viewTop + ta.clientHeight
      if (top - margin < viewTop) {
        ta.scrollTop = Math.max(0, top - margin)
      } else if (top + wr.height + margin > viewBottom) {
        ta.scrollTop = top + wr.height + margin - ta.clientHeight
      }
      // keep the mirror overlay in sync after programmatic scroll
      if (mirrorRef.current) mirrorRef.current.scrollTop = ta.scrollTop
      setScrollTop(ta.scrollTop)
    }
  }, [text, offset])

  // Shared typography for mirror + textarea — must match exactly for measurement
  const sharedStyle = {
    fontFamily: 'var(--font-active)',
    fontSize: 'var(--body-size)',
    lineHeight: 1.85,
    letterSpacing: '0.01em',
  }
  const sharedCls = 'p-[20px_22px] w-full whitespace-pre-wrap break-words max-[600px]:p-[14px]'

  return (
    <div className="relative min-h-[220px]">
      <div ref={mirrorRef} aria-hidden="true" style={sharedStyle}
        className={`${sharedCls} absolute top-0 left-0 h-full pointer-events-none invisible text-transparent overflow-hidden border-none resize-none bg-transparent`} />
      {highlightPos && (
        <div className="absolute bg-highlight border-b-[2.5px] border-highlight-line rounded-[3px] pointer-events-none z-[1] transition-[top,left,width] duration-[120ms] ease-out" style={{
          top: highlightPos.top - scrollTop, left: highlightPos.left,
          width: highlightPos.width, height: highlightPos.height,
        }} />
      )}
      <textarea
        ref={textareaRef}
        className={`${sharedCls} thin-scroll relative block bg-transparent border-none outline-none resize-y min-h-[220px] text-ink z-[2]`}
        style={{ ...sharedStyle, color: inkColor, caretColor: 'var(--accent)' }}
        value={text}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={true}
        placeholder="Start typing your text here…"
      />
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────
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
