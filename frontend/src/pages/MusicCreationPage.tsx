import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, SVGProps } from 'react'
import { fetchGeneratedMusic, generateMusic } from '../lib/music'
import type { GeneratedMusic } from '../lib/music'
import '../styles/music-creation.css'

type IconName =
  | 'home'
  | 'library'
  | 'tts'
  | 'music'
  | 'design'
  | 'clone'
  | 'vocal'
  | 'crown'
  | 'upload'
  | 'eraser'
  | 'dice'
  | 'plus'
  | 'shuffle'
  | 'play'
  | 'prev'
  | 'next'
  | 'download'
  | 'more'
  | 'history'
  | 'wave'

interface WorkItem extends GeneratedMusic {
  title: string
  cover: string
  durationLabel: string
}

const styleTagGroups = [
  ['乡村', '驾驶场景', '合成器', '长笛', '手风琴', '内省', '钢琴', '唐风', '流行', '电子'],
  ['赛博朋克', '夜晚城市', '霓虹', '低音', '鼓机', '未来感', '冷酷', '电子舞曲', '科技感', '高速'],
  ['国风', '古筝', '琵琶', '笛子', '史诗', '江湖', '空灵女声', '山水', '节奏舒缓', '电影感'],
  ['摇滚', '电吉他', '现场感', '热血', '鼓点强烈', '青春', '呐喊人声', '失真', '公路', '燃'],
  ['爵士', '萨克斯', '钢琴三重奏', '慵懒', '咖啡馆', '即兴', '复古', '暖调', '夜色', '轻快'],
  ['R&B', '灵魂乐', '丝滑人声', '浪漫', '慢速', '律动', '贝斯', '和声', '都市', '温柔'],
]
const coverImages = [
  'https://cdn.hailuoai.com/pre/2025-06-22-16/music_cover/1750582227642792971-other_42.png',
  'https://cdn.hailuoai.com/pre/2025-06-22-16/music_cover/1750582177961486079-other_13.png',
]
const musicModelOptions = [
  {
    value: 'music-2.6',
    label: 'Music-2.6',
    isNew: true,
    description: '升级音乐模型，全新支持翻唱功能，超快生成速度，乐器表现力极强',
    image: 'https://cdn.hailuoai.com/hailuo-video-web/public_assets/5f344dc6-9691-423a-a05f-19388125d572.png',
  },
  {
    value: 'music-2.5+',
    label: 'Music-2.5+',
    isNew: true,
    description: '下一代音乐生成模型，开启全场景、风格的全能纯音乐创作。',
    image: 'https://cdn.hailuoai.com/hailuo-video-web/public_assets/13f08d9f-4db4-4879-80b6-ba269adc69a1.png',
  },
  {
    value: 'music-2.5',
    label: 'Music-2.5',
    isNew: false,
    description: '新一代音乐生成模型，对人声表现、编曲与混音、结构精度及声音设计进行了优化，能够生成更自然、更稳定更具专业质感的音乐',
    image: 'https://cdn.hailuoai.com/hailuo-video-web/public_assets/2.5.png',
  },
  {
    value: 'music-2.0',
    label: 'Music-2.0',
    isNew: false,
    description: '增强版音乐生成模型，加强音乐性和乐器表现。支持生成音乐时长：最长5分钟',
    image: 'https://cdn.hailuoai.com/hailuo-video-web/public_assets/2.0.png',
  },
] as const

type MusicModelValue = (typeof musicModelOptions)[number]['value']

function Icon({ name, className }: { name: IconName; className?: string }) {
  const props: SVGProps<SVGSVGElement> = {
    className,
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  if (name === 'home') {
    return (
      <svg {...props}>
        <path d="M3.2 8.8 10 3.1l6.8 5.7v6.1c0 1.4-.6 2-2 2H5.2c-1.4 0-2-.6-2-2V8.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7.2 13.4h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'library') {
    return (
      <svg {...props}>
        <path d="M4 16.6V7.1l4.2-2.8v12.3H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 3v14M16.2 3v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'tts') {
    return (
      <svg {...props}>
        <path d="M4 14.8V5.4L6.4 3h8.2c.8 0 1.4.6 1.4 1.4v6.4" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
        <path d="M7 7.1h5.8M9.9 7.1v4.1M12.2 15.2h5M14.7 12.8v5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'music') {
    return (
      <svg {...props}>
        <path d="M5 16.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM14.3 16.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.2 14.2V5.4l9.3-2.7v11.5M7.2 8.5l9.3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'design') {
    return (
      <svg {...props}>
        <path d="M4 11.2V8.8M7 13V7M10 15.2V4.8M13 12.4V7M16 10.8V8.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 13.5c.4-.5.6-1.5.6-1.5s.3 1 .7 1.5c.4.5 1.7.9 1.7.9s-1.3.4-1.7.9c-.4.5-.7 1.5-.7 1.5s-.2-1-.6-1.5c-.4-.5-1.7-.9-1.7-.9s1.3-.4 1.7-.9Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'clone') {
    return (
      <svg {...props}>
        <path d="M12.4 2.7v7.2M3.2 5.2 12.4 3v6.9M3.2 5.2v11.5l4.7-.7M17.2 4.2v5.6M14.6 12.5v5.2M11.5 14.2v2.2M17.4 14.2v2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'vocal') {
    return (
      <svg {...props}>
        <path d="M11.4 3.1A7.2 7.2 0 1 0 11.4 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10.1 8.7c.5.5.7 1.1.7 1.7s-.2 1.2-.7 1.7M13.1 7c.9.9 1.4 2.1 1.4 3.4s-.5 2.5-1.4 3.4M16.5 5.3c1.3 1.4 2.1 3.2 2.1 5.1s-.8 3.7-2.1 5.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'crown') {
    return (
      <svg {...props}>
        <path d="m2.5 6 3.4 2.4L10 2l4 6.4L17.5 6 16 14.6a2 2 0 0 1-2 1.7H6a2 2 0 0 1-2-1.7L2.5 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 9.2 9.4 11l-1.8.5 1.8.5.6 1.9.6-1.9 1.8-.5-1.8-.5-.6-1.8Z" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'upload') {
    return (
      <svg {...props} width="40" height="40" viewBox="0 0 40 40">
        <path d="M7 20 11 9.5A3.7 3.7 0 0 1 14.5 7h11A3.7 3.7 0 0 1 29 9.5L33 20v10.5a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V20Z" fill="currentColor" opacity="0.95" />
        <path d="M7 20h6l2.3 4.7h9.4L27 20h6" stroke="#151026" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20.5 11v8.4" stroke="#151026" strokeWidth="2" strokeLinecap="round" />
        <path d="m16.8 15.2 3.7-3.7 3.7 3.7" stroke="#151026" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'eraser') {
    return (
      <svg {...props} width="14" height="14" viewBox="0 0 14 14">
        <path d="m2 8.1 5.8-5.4a.8.8 0 0 1 1.1.1l3 3.5a.8.8 0 0 1-.1 1.1l-4 3.4H4.2L2 8.1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M6.1 4.3 9.3 8M6.8 11.3h5.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'dice') {
    return (
      <svg {...props} width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="1.5" width="11" height="11" rx="2" fill="currentColor" />
        <rect x="7.5" y="7.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="5" cy="5" r="1" fill="#fff" />
        <circle cx="9" cy="9" r="1" fill="#fff" />
      </svg>
    )
  }

  if (name === 'plus') {
    return (
      <svg {...props} width="14" height="14" viewBox="0 0 14 14">
        <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'shuffle') {
    return (
      <svg {...props} width="14" height="14" viewBox="0 0 14 14">
        <path d="M1.3 3.2h2.2A3.5 3.5 0 0 1 7 6.7a3.5 3.5 0 0 0 3.5 3.6h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="m11.3 9.1 1.2 1.2-1.2 1.2M11.3 2l1.2 1.2-1.2 1.2M1.3 10.3h2.2A3.5 3.5 0 0 0 7 6.7a3.5 3.5 0 0 1 3.5-3.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'play') {
    return (
      <svg {...props} viewBox="0 0 20 20">
        <path d="M15.5 8.4c1.1.6 1.1 1.8 0 2.4l-6.2 3.6c-1.1.6-2-.1-2-1.2V6c0-1.2.9-1.8 2-1.2l6.2 3.6Z" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'prev' || name === 'next') {
    return (
      <svg {...props} width="38" height="38" viewBox="0 0 38 38">
        <path d={name === 'prev' ? 'M15.8 21.5c-1.1-.7-1.6-1-1.8-1.5-.2-.4-.2-.8 0-1.2.2-.4.7-.8 1.8-1.5l7.5-4.8c1.2-.8 1.8-1.2 2.4-1.2.4 0 .9.3 1.1.6.3.4.3 1.1.3 2.6v9.7c0 1.5 0 2.2-.3 2.6-.3.4-.7.6-1.1.6-.5 0-1.2-.4-2.4-1.2l-7.5-4.7Z' : 'M23.3 17.4c1.1.7 1.6 1 1.8 1.5.2.4.2.8 0 1.2-.2.4-.7.8-1.8 1.5l-7.5 4.8c-1.2.8-1.8 1.2-2.4 1.2-.4 0-.9-.3-1.1-.6-.3-.4-.3-1.1-.3-2.6v-9.7c0-1.5 0-2.2.3-2.6.3-.4.7-.6 1.1-.6.5 0 1.2.4 2.4 1.2l7.5 4.7Z'} fill="currentColor" />
        <rect x={name === 'prev' ? '11.4' : '23.7'} y="10.5" width="3.1" height="17" rx="1.2" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'download') {
    return (
      <svg {...props}>
        <path d="M5.6 15.6h8.8M10 3.6V12m0 0 4-4m-4 4L6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'more') {
    return (
      <svg {...props}>
        <circle cx="10" cy="4.8" r="1.5" fill="currentColor" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="15.2" r="1.5" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg {...props} width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 4.5v5.1l3.3 1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M.9 10.9A8.4 8.4 0 1 0 1.6 5.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M.6 2.6v3.2h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="M10 19a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 5v10M7.5 6.7v6.6M12.5 6.7v6.6M5 8.4v3.2M15 8.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function inferTitle(record: GeneratedMusic): string {
  const firstLyric = record.lyrics?.split('\n').map((line) => line.trim()).find(Boolean)
  if (firstLyric) return firstLyric.slice(0, 16)
  return record.prompt.slice(0, 16) || '未命名作品'
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function toWorkItem(record: GeneratedMusic, index: number, title?: string): WorkItem {
  return {
    ...record,
    title: title?.trim() || inferTitle(record),
    cover: coverImages[index % coverImages.length],
    durationLabel: index % 2 === 0 ? '00:39' : '00:29',
  }
}

export default function MusicCreationPage() {
  const [lyrics, setLyrics] = useState('我爱你哦')
  const [stylePrompt, setStylePrompt] = useState('唐')
  const [title, setTitle] = useState('')
  const [selectedModel, setSelectedModel] = useState<MusicModelValue>('music-2.6')
  const [isModelOpen, setIsModelOpen] = useState(false)
  const [count, setCount] = useState(2)
  const [instrumental, setInstrumental] = useState(false)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [works, setWorks] = useState<WorkItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [styleTagGroupIndex, setStyleTagGroupIndex] = useState(0)
  const modelSelectRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const styleTagsScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let stopped = false
    setLoadingWorks(true)
    void fetchGeneratedMusic()
      .then((records) => {
        if (stopped) return
        const items = records.map((record, index) => toWorkItem(record, index))
        setWorks(items)
        setError('')
      })
      .catch((err: unknown) => {
        if (stopped) return
        setError(err instanceof Error ? err.message : '作品加载失败')
      })
      .finally(() => {
        if (!stopped) setLoadingWorks(false)
      })
    return () => {
      stopped = true
    }
  }, [])

  const selectedWork = useMemo(
    () => (selectedId ? works.find((work) => work.id === selectedId) ?? null : null),
    [selectedId, works],
  )
  const selectedModelOption = useMemo(
    () => musicModelOptions.find((option) => option.value === selectedModel) ?? musicModelOptions[0],
    [selectedModel],
  )
  const styleTags = styleTagGroups[styleTagGroupIndex] ?? styleTagGroups[0]

  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setPlaying(false)
  }, [selectedWork?.id])

  useEffect(() => {
    if (!isModelOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!modelSelectRef.current?.contains(event.target as Node)) setIsModelOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isModelOpen])

  const handleReferenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setReferenceFile(file)
  }

  const appendTag = (tag: string) => {
    setStylePrompt((prev) => {
      const normalized = prev.trim()
      if (!normalized) return tag
      if (normalized.includes(tag)) return normalized
      return `${normalized}，${tag}`
    })
  }

  const clearLyrics = () => setLyrics('')
  const clearStyle = () => setStylePrompt('')
  const switchStyleTags = () => setStyleTagGroupIndex((index) => (index + 1) % styleTagGroups.length)
  const scrollStyleTagsRight = () => {
    styleTagsScrollRef.current?.scrollBy({
      left: 180,
      behavior: 'smooth',
    })
  }
  const scrollStyleTagsLeft = () => {
    styleTagsScrollRef.current?.scrollBy({
      left: -180,
      behavior: 'smooth',
    })
  }

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault()
    if (generating) return

    const prompt = stylePrompt.trim() || '中文流行音乐，旋律动听，制作精良'
    const normalizedLyrics = lyrics.trim()
    const normalizedTitle = title.trim() || normalizedLyrics.split('\n').find(Boolean)?.slice(0, 16) || prompt.slice(0, 16)

    if (!instrumental && !normalizedLyrics) {
      setError('请输入歌词，或开启纯音乐')
      return
    }

    setGenerating(true)
    setError('')
    void generateMusic({
      model: selectedModel,
      prompt,
      lyrics: instrumental ? undefined : normalizedLyrics,
      is_instrumental: instrumental,
    })
      .then((record) => {
        const item = toWorkItem(record, works.length, normalizedTitle)
        setWorks((prev) => [item, ...prev])
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '生成失败')
      })
      .finally(() => {
        setGenerating(false)
      })
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !selectedWork) return

    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '播放失败')
      })
      return
    }

    audio.pause()
    setPlaying(false)
  }

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value)
    setCurrentTime(nextTime)
    if (audioRef.current) audioRef.current.currentTime = nextTime
  }

  return (
    <section className="mc-shell">
      <div className="mc-content-wrap" id="scroll_wrap">
        <main className="mc-main">
          <section className="mc-workspace" role="main">
            <article className="mc-editor-panel">
              <header className="mc-editor-header">
                <div className="mc-title-row">
                  <button className="mc-back-btn" type="button" onClick={() => window.location.assign('?mode=home')} aria-label="返回主页">
                    <span>‹</span>
                  </button>
                  <h1>音乐创作</h1>
                </div>
                <div className="mc-model-row">
                  <div className="mc-model-select-wrap" ref={modelSelectRef}>
                    <button
                      className={`mc-model-select${isModelOpen ? ' mc-model-select-open' : ''}`}
                      type="button"
                      onClick={() => setIsModelOpen((value) => !value)}
                      aria-haspopup="listbox"
                      aria-expanded={isModelOpen}
                    >
                      <span className="mc-model-prefix">模型</span>
                      <span>{selectedModelOption.label}</span>
                      {selectedModelOption.isNew && <strong>New</strong>}
                      <span className="mc-model-arrow">▾</span>
                    </button>
                    {isModelOpen && (
                      <div className="mc-model-dropdown" role="listbox">
                        {musicModelOptions.map((option) => {
                          const isSelected = option.value === selectedModel
                          return (
                            <button
                              className={`mc-model-option${isSelected ? ' mc-model-option-selected' : ''}`}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              key={option.value}
                              onClick={() => {
                                setSelectedModel(option.value)
                                setIsModelOpen(false)
                              }}
                            >
                              <span className="mc-model-option-cover">
                                <img src={option.image} alt={`model-${option.value}`} />
                              </span>
                              <span className="mc-model-option-content">
                                <span className="mc-model-option-title">
                                  <span>{option.label}</span>
                                  {option.isNew && <b>New</b>}
                                </span>
                                <span className="mc-model-option-desc">{option.description}</span>
                              </span>
                              {isSelected && (
                                <span className="mc-model-option-check" aria-hidden>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.96387 5.99777L4.82101 8.85491L10.5353 3.14062" stroke="currentColor" strokeWidth="1.90476" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button className="mc-history-btn" type="button" aria-label="历史记录">
                    <Icon name="history" />
                  </button>
                </div>
              </header>

              <form className="mc-input-area" onSubmit={handleGenerate}>
                <div className="mc-form-scroll">
                  <section className="mc-upload-card">
                    <input id="music-reference-file" type="file" accept=".mp3,.wav" onChange={handleReferenceChange} />
                    <label htmlFor="music-reference-file">
                      <span className="mc-upload-icon"><Icon name="upload" /></span>
                      <span className="mc-upload-copy">
                        <b>参考音乐（可选）</b>
                        <small>{referenceFile ? referenceFile.name : '点击或拖拽上传，生成专属翻唱（上传即同意服务条款）'}</small>
                      </span>
                    </label>
                  </section>

                  <section className="mc-text-card mc-flex-card">
                    <div className="mc-card-title-row">
                      <span>歌词</span>
                      <label className="mc-switch-label">
                        <input type="checkbox" checked={instrumental} onChange={(event) => setInstrumental(event.target.checked)} />
                        <span className="mc-switch" />
                        <b>纯音乐</b>
                      </label>
                    </div>
                    <textarea
                      value={lyrics}
                      onChange={(event) => setLyrics(event.target.value.slice(0, 3500))}
                      placeholder="请输入歌词"
                      disabled={instrumental}
                      className="mc-large-input"
                    />
                    <div className="mc-counter-row">
                      <span>{lyrics.length} / 3,500 字符</span>
                      <button type="button" onClick={clearLyrics} aria-label="清空歌词">
                        <Icon name="eraser" />
                      </button>
                    </div>
                  </section>

                  <div className="mc-resize-line"><span /></div>

                  <section className="mc-text-card mc-flex-card">
                    <div className="mc-card-title-row">
                      <span>风格</span>
                      <button type="button" aria-label="随机风格" className="mc-dice-btn" onClick={switchStyleTags}>
                        <Icon name="dice" />
                      </button>
                    </div>
                    <textarea
                      id="music-styles-input"
                      value={stylePrompt}
                      onChange={(event) => setStylePrompt(event.target.value.slice(0, 2000))}
                      placeholder="描述音乐风格与制作要求。例如曲风、情绪、速度、乐器或人声类型"
                      className="mc-large-input"
                    />
                    <div className="mc-counter-row">
                      <span>{stylePrompt.length} / 2,000 字符</span>
                      <button type="button" onClick={clearStyle} aria-label="清空风格">
                        <Icon name="eraser" />
                      </button>
                    </div>
                    <div className="mc-tag-row">
                      <button type="button" className="mc-shuffle-tag" onClick={switchStyleTags} aria-label="切换风格标签"><Icon name="shuffle" /></button>
                      <button type="button" className="mc-tags-prev" onClick={scrollStyleTagsLeft} aria-label="向左查看更多风格标签">‹</button>
                      <div className="mc-tags-scroll" ref={styleTagsScrollRef}>
                        {styleTags.map((tag) => (
                          <button type="button" className="mc-style-tag" onClick={() => appendTag(tag)} key={tag}>
                            <Icon name="plus" />
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                      <button type="button" className="mc-tags-next" onClick={scrollStyleTagsRight} aria-label="向右查看更多风格标签">›</button>
                    </div>
                  </section>

                  <div className="mc-resize-line"><span /></div>

                  <section className="mc-title-card">
                    <input
                      id="music-title-input"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="歌曲名称（选填）"
                      autoComplete="off"
                    />
                  </section>
                </div>

                <div className="mc-submit-wrap">
                  {error && <div className="mc-error" role="status">{error}</div>}
                  <div className="mc-submit-row">
                    <div className="mc-count-pill">
                      <span>数量:&nbsp;</span>
                      <button type="button" onClick={() => setCount((value) => Math.max(1, value - 1))}>−</button>
                      <strong>{count}</strong>
                      <button type="button" onClick={() => setCount((value) => Math.min(4, value + 1))}>＋</button>
                    </div>
                    <button type="submit" className="mc-generate-btn" disabled={generating}>
                      <Icon name="wave" />
                      <span>0</span>
                      <i />
                      <span>{generating ? '生成中...' : '限时免费'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </article>

            <aside className="mc-library-panel">
              <div className="mc-library-card">
                <header className="mc-tabs">
                  <button type="button" className="active">作品</button>
                  <span />
                </header>
                <div className="mc-work-list">
                  {loadingWorks && <div className="mc-empty">加载作品中...</div>}
                  {!loadingWorks && works.length === 0 && <div className="mc-empty">暂无作品，先生成一首音乐吧</div>}
                  {!loadingWorks && works.map((work) => {
                    const selected = selectedWork?.id === work.id
                    return (
                      <button className={`mc-work-item${selected ? ' selected' : ''}`} type="button" key={work.id} onClick={() => setSelectedId(work.id)}>
                        {selected && <span className="mc-work-dot" />}
                        <span className="mc-cover-wrap">
                          <img src={work.cover} alt="voice icon" />
                          <span className="mc-cover-play"><Icon name="play" /></span>
                          <small>{work.durationLabel}</small>
                        </span>
                        <span className="mc-work-meta">
                          <b>{work.title}</b>
                          <small>{work.prompt}</small>
                        </span>
                        <span className="mc-work-actions">
                          <Icon name="shuffle" />
                          <Icon name="download" />
                          <Icon name="more" />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          </section>

          <footer className="mc-ai-note">内容由AI生成，重要信息请务必核查</footer>

          {selectedWork && (
            <section className="mc-player">
              <div className="mc-now-playing">
                <div className="mc-player-cover">
                  <img src={selectedWork.cover} alt="cover" />
                </div>
                <div>
                  <p>{selectedWork.title}</p>
                  <span>{selectedWork.prompt}</span>
                </div>
              </div>

              <div className="mc-player-center">
                <div className="mc-player-controls">
                  <button type="button"><Icon name="prev" /></button>
                  <button type="button" className="mc-play-main" onClick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
                    {playing ? <span className="mc-pause-icon" /> : <Icon name="play" />}
                  </button>
                  <button type="button"><Icon name="next" /></button>
                </div>
                <div className="mc-progress-row">
                  <span>{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeek}
                    disabled={!duration}
                  />
                  <span>{formatTime(duration) || selectedWork.durationLabel}</span>
                </div>
              </div>

              <div className="mc-player-actions">
                <Icon name="download" />
                <Icon name="shuffle" />
              </div>

              <audio
                ref={audioRef}
                src={selectedWork.music_url}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onEnded={() => setPlaying(false)}
              />
            </section>
          )}
        </main>
      </div>
    </section>
  )
}
