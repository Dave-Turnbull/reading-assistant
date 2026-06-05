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
  { label: 'XS', px: 11 },
  { label: 'S',  px: 14 },
  { label: 'M',  px: 17 },
  { label: 'L',  px: 20 },
  { label: 'XL', px: 24 },
]

const WORDS_PER_FOCUS = [1, 2, 3, 4, 5]

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

/**
 * Group flat word-indices into focus chunks of size `n`, never crossing a line.
 * Returns an array of chunks; each chunk = { line, wordIdxs: number[] }
 * where wordIdxs are flat indices into flatWords.
 */
function buildChunks(lines, lineStart, n) {
  const chunks = []
  lines.forEach((lineWords, li) => {
    for (let i = 0; i < lineWords.length; i += n) {
      const wordIdxs = []
      for (let j = i; j < Math.min(i + n, lineWords.length); j++) {
        wordIdxs.push(lineStart[li] + j)
      }
      chunks.push({ line: li, wordIdxs })
    }
  })
  return chunks
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

// Returns {start, end} char offsets spanning from the first to last token in a chunk
function findChunkOffset(text, wordIdxs) {
  if (!wordIdxs || wordIdxs.length === 0) return null
  const first = findTokenOffset(text, wordIdxs[0])
  const last  = findTokenOffset(text, wordIdxs[wordIdxs.length - 1])
  if (!first || !last) return null
  return { start: first.start, end: last.end }
}

// ─── App ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'reading-assistant-state'
const DEFAULT_TEXT = "Hello! Paste a paragraph in the text field, and use the buttons or arrow keys to scroll through the text.\nDon't forget to check out the customization options in the top left!"

// Load persisted state once (returns {} if none / unavailable)
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function App() {
  const saved = loadSaved()

  const [text, setText]                 = useState(saved.text ?? DEFAULT_TEXT)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hidePunct, setHidePunct]       = useState(saved.hidePunct ?? false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontId, setFontId]             = useState(saved.fontId ?? 'lexend')
  const [focusSizeIdx, setFocusSizeIdx] = useState(saved.focusSizeIdx ?? 1)
  const [bodySizeIdx, setBodySizeIdx]   = useState(saved.bodySizeIdx ?? 2)
  const [wordsPerFocus, setWordsPerFocus] = useState(saved.wordsPerFocus ?? 1)
  const [themeId, setThemeId]           = useState(saved.themeId ?? 'dark')
  const [ttsOn, setTtsOn]               = useState(saved.ttsOn ?? false)
  const [ttsVolume, setTtsVolume]       = useState(saved.ttsVolume ?? 0.5)
  const [ttsRate, setTtsRate]           = useState(saved.ttsRate ?? 1)
  const [ttsPitch, setTtsPitch]         = useState(saved.ttsPitch ?? 1)
  const [ttsVoiceURI, setTtsVoiceURI]   = useState(saved.ttsVoiceURI ?? '')
  const [voices, setVoices]             = useState([])
  const [ttsStatus, setTtsStatus]       = useState('')
  const volRef = useRef(null)

  // Persist settings + pasted text whenever any of them change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        text, hidePunct, fontId, focusSizeIdx, bodySizeIdx, wordsPerFocus, themeId,
        ttsOn, ttsVolume, ttsRate, ttsPitch, ttsVoiceURI,
      }))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [text, hidePunct, fontId, focusSizeIdx, bodySizeIdx, wordsPerFocus, themeId, ttsOn, ttsVolume, ttsRate, ttsPitch, ttsVoiceURI])

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
  const activeFont  = FONTS.find(f => f.id === fontId) || FONTS[0]
  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const focusPx     = FOCUS_SIZES[focusSizeIdx].px
  const bodyPx      = BODY_SIZES[bodySizeIdx].px
  const ink         = activeTheme.vars['--ink']

  // Group words into focus chunks (never crossing a line)
  const chunks      = buildChunks(lines, lineStart, wordsPerFocus)
  const totalChunks = chunks.length
  const safeIndex   = Math.min(currentIndex, Math.max(0, totalChunks - 1))
  const currentChunk = chunks[safeIndex] || { line: 0, wordIdxs: [] }
  const currentLine = currentChunk.line

  // Chunks belonging to the current line, in order, with their global chunk index
  const lineChunks = chunks
    .map((c, ci) => ({ ...c, chunkIdx: ci }))
    .filter(c => c.line === currentLine)

  // Text the current chunk represents (respects hide-punctuation)
  const spokenText = currentChunk.wordIdxs
    .map(wi => displayWord(flatWords[wi], hidePunct))
    .join(' ')

  // ── Load the list of available system voices ──
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const list = window.speechSynthesis.getVoices() || []
      setVoices(list)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  // ── Text to speech: speak the highlighted chunk when it changes ──
  useEffect(() => {
    if (!ttsOn) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (!spokenText.trim()) return
    const synth = window.speechSynthesis
    synth.cancel() // drop anything mid-utterance so we always speak the latest
    const utter = new SpeechSynthesisUtterance(spokenText)
    const chosen = voices.find(v => v.voiceURI === ttsVoiceURI)
    if (chosen) utter.voice = chosen
    utter.volume = ttsVolume
    utter.rate = ttsRate
    utter.pitch = ttsPitch
    utter.onerror = (e) => {
      if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
        setTtsStatus(`Speech error: ${e.error}`)
      }
    }
    synth.speak(utter)
  }, [spokenText, ttsOn, ttsVolume, ttsRate, ttsPitch, ttsVoiceURI, voices])

  // Stop speech immediately when TTS is switched off
  useEffect(() => {
    if (!ttsOn && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [ttsOn])

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

  // Vertical slide when line changes
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

  // Scroll active chunk to centre — wait for line transition to finish first
  useEffect(() => {
    if (isAnimating) return
    const scroller = scrollerRef.current
    const activeEl = activeWordRef.current
    if (!scroller || !activeEl) return
    const centre = scroller.clientWidth / 2
    const wordCentre = activeEl.offsetLeft + activeEl.offsetWidth / 2
    scroller.scrollLeft = wordCentre - centre
  }, [safeIndex, currentLine, focusSizeIdx, fontId, text, isAnimating, wordsPerFocus])

  // Toggle TTS on/off.
  const toggleTts = useCallback(() => {
    const willEnable = !ttsOn
    if (willEnable) {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setTtsStatus('Speech synthesis is not supported in this browser.')
        return
      }
      setTtsStatus('')
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
    setTtsOn(willEnable)
  }, [ttsOn])

  const go = useCallback((dir) => {
    setCurrentIndex(prev => Math.max(0, Math.min(totalChunks - 1, prev + dir)))
  }, [totalChunks])

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

  // Clamp index when text or chunking changes
  useEffect(() => {
    const p = parseLines(text)
    const nChunks = buildChunks(p.lines, p.lineStart, wordsPerFocus).length
    setCurrentIndex(prev => Math.min(prev, Math.max(0, nChunks - 1)))
  }, [text, wordsPerFocus])

  const offset  = findChunkOffset(text, currentChunk.wordIdxs)
  const isFirst = safeIndex === 0
  const isLast  = safeIndex >= totalChunks - 1

  // Build a trimmed, prioritised voice list for the dropdown. Rendering hundreds
  // of native <option>s is what lags the UI, so we surface the most relevant
  // voices (matching the UI language first) and cap the total. The selected
  // voice is always included even if it falls outside the cap.
  const VOICE_LIMIT = 40
  const voiceOptions = (() => {
    if (voices.length <= VOICE_LIMIT) return voices
    const uiLang = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2).toLowerCase()
    const matches = voices.filter(v => (v.lang || '').slice(0, 2).toLowerCase() === uiLang)
    const others  = voices.filter(v => (v.lang || '').slice(0, 2).toLowerCase() !== uiLang)
    const list = [...matches, ...others].slice(0, VOICE_LIMIT)
    // Ensure the currently-selected voice is present
    if (ttsVoiceURI && !list.some(v => v.voiceURI === ttsVoiceURI)) {
      const sel = voices.find(v => v.voiceURI === ttsVoiceURI)
      if (sel) list.unshift(sel)
    }
    return list
  })()

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

            <SectionLabel>Words per focus</SectionLabel>
            <div className="flex gap-1.5">
              {WORDS_PER_FOCUS.map((n) => (
                <SizeButton key={n} active={n === wordsPerFocus} onClick={() => setWordsPerFocus(n)}>{n}</SizeButton>
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

      {/* ── TTS toggle + volume popout ── */}
      <div className="group fixed top-[18px] left-[66px] z-[200]" ref={volRef}>
        <button
          className={`w-10 h-10 rounded-full border-[1.5px] cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-ui ${ttsOn ? 'border-accent-soft bg-accent-pale text-accent' : 'border-brd bg-surface text-ink-mid hover:border-accent-soft hover:bg-accent-pale'}`}
          onClick={toggleTts}
          aria-label={ttsOn ? 'Disable text to speech' : 'Enable text to speech'}
          aria-pressed={ttsOn}
        >
          <span className="text-xl scale-x-[-1] inline-block leading-none">
            {ttsOn ? '🕪' : '🕨'}
          </span>
        </button>

        {/* When OFF: simple hover tooltip */}
        {!ttsOn && (
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-surface border-[1.5px] border-brd text-ink-mid text-xs font-ui whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.2)] opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100">
            Enable TTS
          </div>
        )}

        {/* When ON: volume slider pops out on hover (no gap so cursor can reach it) */}
        {ttsOn && (
          <div className="absolute top-full left-0 pt-2 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto">
            <div className="bg-surface border-[1.5px] border-brd rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.28)] font-ui w-[230px]">

              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-ink-mid">Text to Speech</span>
                <span className="text-[10px] text-accent font-medium whitespace-nowrap">⚠ experimental</span>
              </div>

              {voices.length === 0 && (
                <div className="mb-2.5 px-2 py-1.5 rounded-md bg-accent-pale text-accent text-[11px] leading-snug">
                  No TTS voice found
                </div>
              )}

              {/* Volume */}
              <CommitSlider
                label="Volume" value={ttsVolume} min={0} max={1} step={0.05}
                format={v => `${Math.round(v * 100)}%`} onCommit={setTtsVolume} />

              <div className="border-t border-brd my-3" />

              {/* Voice selector */}
              <div className="mb-1 text-xs text-ink-mid">Voice</div>
              <select
                value={ttsVoiceURI}
                onChange={e => setTtsVoiceURI(e.target.value)}
                disabled={voices.length === 0}
                className="w-full px-2 py-1.5 rounded-lg border-[1.5px] border-brd bg-bg text-ink text-xs font-ui cursor-pointer disabled:opacity-50 disabled:cursor-default outline-none focus:border-accent-soft"
                aria-label="TTS voice"
              >
                <option value="">Default</option>
                {voiceOptions.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}{v.lang ? ` (${v.lang})` : ''}
                  </option>
                ))}
              </select>

              <div className="border-t border-brd my-3" />

              {/* Speed */}
              <CommitSlider
                label="Speed" value={ttsRate} min={0.5} max={2} step={0.1}
                format={v => `${v.toFixed(1)}×`} onCommit={setTtsRate} />
              <div className="h-3" />

              {/* Pitch */}
              <CommitSlider
                label="Pitch" value={ttsPitch} min={0} max={2} step={0.1}
                format={v => v.toFixed(1)} onCommit={setTtsPitch} />

              {ttsStatus && (
                <div className="mt-2 text-[10px] leading-snug text-accent">{ttsStatus}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Word strip ── */}
      {totalChunks > 0 && (
        <div className="relative w-screen left-1/2 -translate-x-1/2 mb-6 flex flex-col">
          <div className="absolute top-[3px] bottom-0 left-0 w-[22%] pointer-events-none z-[2] fade-left" />
          <div className="absolute top-[3px] bottom-0 right-0 w-[22%] pointer-events-none z-[2] fade-right" />

          <div className="w-full h-[3px] bg-brd shrink-0">
            <div className="h-full bg-accent rounded-r-sm transition-[width] duration-200 ease-out"
              style={{ width: totalChunks > 1 ? `${(safeIndex / (totalChunks - 1)) * 100}%` : '100%' }} />
          </div>

          {/* clipping window — clips the vertical slide */}
          <div className="overflow-hidden">
            <div key={animKey} ref={scrollerRef}
              className={`flex flex-row items-center gap-[1em] overflow-x-hidden px-[50vw] py-5 whitespace-nowrap scroll-smooth select-none ${slideClass}`}>
              {lineChunks.map((c) => {
                const isActive = c.chunkIdx === safeIndex
                const label = c.wordIdxs.map(wi => displayWord(flatWords[wi], hidePunct)).join(' ')
                return (
                  <span
                    key={c.chunkIdx}
                    ref={isActive ? activeWordRef : null}
                    className={`inline-block font-semibold leading-[1.15] tracking-[0.01em] cursor-pointer transition-opacity duration-150 shrink-0 ${isActive ? 'opacity-100' : 'opacity-[0.18] hover:opacity-45'}`}
                    style={{ fontSize: `${focusPx}px`, fontFamily: activeFont.family, color: ink }}
                    onClick={() => setCurrentIndex(c.chunkIdx)}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 pb-1">
            <NavButton onClick={() => go(-1)} disabled={isFirst} aria-label="Previous">
              <ChevronLeft />
            </NavButton>
            <span className="font-ui text-xs text-ink-light font-light tracking-[0.06em] min-w-[60px] text-center">{safeIndex + 1} / {totalChunks}</span>
            <NavButton onClick={() => go(1)} disabled={isLast} aria-label="Next">
              <ChevronRight />
            </NavButton>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div className="flex-1 flex flex-col gap-2.5 px-7 max-[600px]:px-3.5">
        <div className="font-ui text-xs text-ink-light font-light tracking-[0.03em] pl-0.5">
          {totalChunks === 0 ? 'Start typing to begin…' : 'Use ← → arrow keys or the buttons to navigate'}
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
  return <div className="text-sm font-medium tracking-[0.12em] uppercase text-ink-mid mb-2.5">{children}</div>
}
function Divider() {
  return <div className="border-t border-brd my-3.5" />
}
// Slider that updates its visual position live while dragging, but only
// commits the value (via onCommit) when the user releases — so TTS isn't
// retriggered on every intermediate value.
function CommitSlider({ label, value, min, max, step, format, onCommit }) {
  const [draft, setDraft] = useState(value)
  // Keep draft in sync if the external value changes (e.g. loaded from storage)
  useEffect(() => { setDraft(value) }, [value])
  const commit = () => { if (draft !== value) onCommit(draft) }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ink-mid">{label}</span>
        <span className="text-xs text-ink-light tabular-nums">{format(draft)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={draft}
        onChange={e => setDraft(parseFloat(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="w-full accent-[var(--accent)] cursor-pointer"
        aria-label={label}
      />
    </div>
  )
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
  const [rects, setRects] = useState([])      // highlight rectangles (content coords)
  const [scrollTop, setScrollTop] = useState(0)

  const syncScroll = () => {
    if (textareaRef.current) {
      const st = textareaRef.current.scrollTop
      if (mirrorRef.current) mirrorRef.current.scrollTop = st
      setScrollTop(st)
    }
  }

  useEffect(() => {
    const mirror = mirrorRef.current
    const ta = textareaRef.current
    if (!offset || !mirror || !ta) { setRects([]); return }

    // Build the mirror content with the highlighted span wrapped, so we can
    // measure it. Reset mirror scroll to 0 so all measurements are in absolute
    // content coordinates (independent of current scroll position).
    mirror.scrollTop = 0
    mirror.innerHTML = ''
    const before = document.createTextNode(text.substring(0, offset.start))
    const word = document.createElement('span')
    word.textContent = text.substring(offset.start, offset.end)
    const after = document.createTextNode(text.substring(offset.end))
    mirror.appendChild(before)
    mirror.appendChild(word)
    mirror.appendChild(after)

    const mr = mirror.getBoundingClientRect()
    // getClientRects returns one rect per visual line the span occupies,
    // so a span that wraps onto multiple lines becomes multiple rectangles.
    const clientRects = Array.from(word.getClientRects())
    const measured = clientRects.map(r => ({
      top:    r.top  - mr.top,    // absolute content coords (mirror scroll is 0)
      left:   r.left - mr.left,
      width:  r.width,
      height: r.height,
    }))

    if (measured.length === 0) { setRects([]); return }

    // Auto-scroll so the highlighted span stays visible. Use the span's overall
    // vertical bounds (first rect top → last rect bottom).
    const spanTop    = measured[0].top
    const spanBottom = measured[measured.length - 1].top + measured[measured.length - 1].height
    const margin     = measured[0].height * 1.0
    const viewTop    = ta.scrollTop
    const viewBottom = viewTop + ta.clientHeight

    let nextScroll = ta.scrollTop
    if (spanTop - margin < viewTop) {
      nextScroll = Math.max(0, spanTop - margin)
    } else if (spanBottom + margin > viewBottom) {
      nextScroll = spanBottom + margin - ta.clientHeight
    }

    if (nextScroll !== ta.scrollTop) {
      ta.scrollTop = nextScroll
      mirror.scrollTop = nextScroll
    }

    // Commit rects and the final scroll position together, so the overlay is
    // never rendered against a stale scroll value (fixes the misalignment).
    setRects(measured)
    setScrollTop(ta.scrollTop)
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
      {rects.map((r, i) => (
        <div key={i}
          className="absolute bg-highlight border-b-[2.5px] border-highlight-line rounded-[3px] pointer-events-none z-[1] transition-[top,left,width] duration-[120ms] ease-out"
          style={{ top: r.top - scrollTop, left: r.left, width: r.width, height: r.height }} />
      ))}
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
