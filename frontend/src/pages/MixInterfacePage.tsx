import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, MouseEvent as ReactMouseEvent, SVGProps } from 'react'
import { useLeaderboards } from '../hooks/useLeaderboards'
import { useSongs } from '../hooks/useSongs'
import { fetchGeneratedMusic, generateMusic, preprocessMusicCover } from '../lib/music'
import type { GeneratedMusic } from '../lib/music'
import { calcScore, insertSong, voteSong } from '../lib/songs'
import type { Song } from '../types/song'
import headerLeftPanelRaw from '../svg/mix-interface/header/left/panels/HeaderPanel.svg?raw'
import headerLeftIconRaw from '../svg/mix-interface/header/left/icons/MusicNoteLogo.svg?raw'
import headerRightPanelRaw from '../svg/mix-interface/header/right/panels/HeaderPanel.svg?raw'
import headerRightIcon from '../svg/mix-interface/header/right/icons/BlendBubbles.svg'
import topCapsule from '../svg/mix-interface/selector/capsules/TopBlackCapsule.svg'
import selectorPanel from '../svg/mix-interface/selector/panels/RecordsPanel.svg'
import selectorChevron from '../svg/mix-interface/selector/icons/ChevronRight.svg'
import pinkRecord from '../svg/mix-interface/selector/records/PinkNeedleRecord.svg'
import purpleRecord from '../svg/mix-interface/selector/records/PurpleVinylRecord.svg'
import robotRecord from '../svg/mix-interface/selector/records/RobotRecord.svg'
import cyanRecord from '../svg/mix-interface/selector/records/CyanMusicNoteRecord.svg'
import pinkLabel from '../svg/mix-interface/selector/capsules/labels/PinkNeedleLabel.svg'
import purpleLabel from '../svg/mix-interface/selector/capsules/labels/PurpleVinylLabel.svg'
import robotLabel from '../svg/mix-interface/selector/capsules/labels/RobotLabel.svg'
import cyanLabel from '../svg/mix-interface/selector/capsules/labels/CyanMusicNoteLabel.svg'
import bottomCapsule from '../svg/mix-interface/selector/capsules/BottomBlackCapsule.svg'
import formPanel from '../svg/mix-interface/form/panels/FormPanel.svg'
import styleCard1 from '../svg/mix-interface/form/cards/Card1.svg'
import styleCard2 from '../svg/mix-interface/form/cards/Card2.svg'
import styleCard3 from '../svg/mix-interface/form/cards/Card3.svg'
import styleCard4 from '../svg/mix-interface/form/cards/Card4.svg'
import secondaryCapsule from '../svg/mix-interface/form/capsules/SecondaryBlackCapsule.svg'
import primaryCapsule from '../svg/mix-interface/form/capsules/PrimaryGradientCapsule.svg'
import rankingPanel from '../svg/mix-interface/ranking/panels/RankingPanel.svg'
import aiRankingIcon from '../svg/ranking-panel-right/icons/AiMusicBallOpaque.svg'
import footerPanel from '../svg/mix-interface/footer/panels/FooterBar.svg'
import pushCapsule from '../svg/mix-interface/footer/capsules/ActionBlackCapsule.svg'
import footerIcon from '../svg/mix-interface/footer/icons/BlendBubbles.svg'
import aiMusicBallRaw from '../svg/center-records/AiMusicBallEnterDiamond.svg?raw'
import backArrow from '../svg/返回键.svg'
import '../styles/mix-interface.css'

type WorkItem = GeneratedMusic & {
  title: string
  durationLabel: string
  songId?: string
  missingMusic?: boolean
  isMusicLoading?: boolean
  isPending?: boolean
}

type ClassicEra = Exclude<Song['era'], 'ai'>
type MixIconName = 'play' | 'pause' | 'prev' | 'next' | 'wave'
type GenerationStepId = 'start' | 'preprocess' | 'generate' | 'complete'
type GenerationStep = {
  id: GenerationStepId
  title: string
  description: string
}

const DESIGN_WIDTH = 1366
const DESIGN_HEIGHT = 1014
const SONG_TITLE_MAX_CHARS = 5
const RANKING_SONG_TITLE_MAX_CHARS = 7
const MIX_INACTIVITY_TIMEOUT_MS = 60 * 1000
const GENERATION_STEP_DELAY_MS = 420
const GENERATION_COMPLETE_HIDE_MS = 1600
const MESSAGE_AUTO_HIDE_MS = 3000
const STATUS_FADE_OUT_MS = 280
const generationSteps: GenerationStep[] = [
  {
    id: 'start',
    title: '开始生成',
    description: '正在整理热门歌曲与风格参数',
  },
  {
    id: 'preprocess',
    title: '歌曲正在预处理',
    description: '正在提取参考歌曲特征与歌词结构',
  },
  {
    id: 'generate',
    title: 'AI正在生成中',
    description: '正在合成全新的AI混曲音频',
  },
  {
    id: 'complete',
    title: '生成完成',
    description: '混曲已保存，可以立即试听或推榜',
  },
]
const headerLeftIcon = headerLeftIconRaw.replace('viewBox="100 98 50 43"', 'viewBox="96 96 56 52"')
const headerLeftPanel = headerLeftPanelRaw
  .split('M56 108C56 93.6406 67.6406 82 82 82H490C504.359 82 516 93.6406 516 108V122V135C516 149.912 503.912 162 489 162H83.0001C68.0884 162 56 149.912 56 135V108Z')
  .join('M96 82H476C498.091 82 516 99.9086 516 122C516 144.091 498.091 162 476 162H96C73.9086 162 56 144.091 56 122C56 99.9086 73.9086 82 96 82Z')
  .replace('M82 82.5H490C504.083 82.5 515.5 93.9167 515.5 108V135C515.5 149.636 503.636 161.5 489 161.5H83C68.3645 161.5 56.5 149.636 56.5 135V108C56.5 93.9167 67.9168 82.5 82 82.5Z', 'M96 82.5H476C497.815 82.5 515.5 100.185 515.5 122C515.5 143.815 497.815 161.5 476 161.5H96C74.1848 161.5 56.5 143.815 56.5 122C56.5 100.185 74.1848 82.5 96 82.5Z')
const headerRightPanel = headerRightPanelRaw
  .split('M898 112C898 97.6406 909.641 86 924 86H1273C1287.36 86 1299 97.6406 1299 112V126V139C1299 153.912 1286.91 166 1272 166H925C910.088 166 898 153.912 898 139V112Z')
  .join('M938 86H1259C1281.09 86 1299 103.909 1299 126C1299 148.091 1281.09 166 1259 166H938C915.909 166 898 148.091 898 126C898 103.909 915.909 86 938 86Z')
  .replace('M924 86.5H1273C1287.08 86.5 1298.5 97.9167 1298.5 112V139C1298.5 153.636 1286.64 165.5 1272 165.5H925C910.364 165.5 898.5 153.636 898.5 139V112C898.5 97.9167 909.917 86.5 924 86.5Z', 'M938 86.5H1259C1280.82 86.5 1298.5 104.185 1298.5 126C1298.5 147.815 1280.82 165.5 1259 165.5H938C916.185 165.5 898.5 147.815 898.5 126C898.5 104.185 916.185 86.5 938 86.5Z')
const generationOrbSvg = aiMusicBallRaw.replace('viewBox="0 0 738 608"', 'viewBox="138 195 214 214"')

const coverImages = [
  'https://cdn.hailuoai.com/pre/2025-06-22-16/music_cover/1750582227642792971-other_42.png',
  'https://cdn.hailuoai.com/pre/2025-06-22-16/music_cover/1750582177961486079-other_13.png',
]

const referenceEraOptions: Record<ClassicEra, { icon: string; label: string }> = {
  vinyl: { icon: pinkRecord, label: pinkLabel },
  cd: { icon: purpleRecord, label: purpleLabel },
  tape: { icon: robotRecord, label: robotLabel },
  digital: { icon: cyanRecord, label: cyanLabel },
}

const styleOptions = [
  {
    id: 'nostalgic-lyric',
    title: '怀旧抒情',
    icon: pinkRecord,
    label: pinkLabel,
    card: styleCard1,
    prompt: '怀旧抒情，旋律温暖细腻，情绪真挚，带有年代感与回忆氛围',
  },
  {
    id: 'square-dance',
    title: '广场舞曲',
    icon: purpleRecord,
    label: purpleLabel,
    card: styleCard2,
    prompt: '广场舞曲，节奏明快，律动鲜明，旋律上口，适合群体舞动',
  },
  {
    id: 'passionate-rock',
    title: '激情摇滚',
    icon: robotRecord,
    label: robotLabel,
    card: styleCard3,
    prompt: '激情摇滚，吉他强烈，鼓点有冲击力，情绪高燃，现场感充足',
  },
  {
    id: 'chinese-style',
    title: '中国风',
    icon: cyanRecord,
    label: cyanLabel,
    card: styleCard4,
    prompt: '中国风，融合传统民乐色彩与现代编曲，旋律典雅有东方韵味',
  },
]

function Icon({ name, className }: { name: MixIconName; className?: string }) {
  const props: SVGProps<SVGSVGElement> = {
    className,
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  if (name === 'play') {
    return (
      <svg {...props} viewBox="964.5 291.474 16.5 19.052">
        <path d="M979.86 299.02C981.39 299.9 981.39 302.1 979.86 302.98L967.93 309.87C966.4 310.75 964.5 309.65 964.5 307.89V294.11C964.5 292.35 966.4 291.25 967.93 292.13L979.86 299.02Z" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'pause') {
    return (
      <svg {...props}>
        <path d="M6.5 4.5h2.2v11H6.5v-11ZM11.3 4.5h2.2v11h-2.2v-11Z" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'prev' || name === 'next') {
    return (
      <svg {...props} viewBox="0 0 38 38">
        <path d={name === 'prev' ? 'M15.8 21.5c-1.1-.7-1.6-1-1.8-1.5-.2-.4-.2-.8 0-1.2.2-.4.7-.8 1.8-1.5l7.5-4.8c1.2-.8 1.8-1.2 2.4-1.2.4 0 .9.3 1.1.6.3.4.3 1.1.3 2.6v9.7c0 1.5 0 2.2-.3 2.6-.3.4-.7.6-1.1.6-.5 0-1.2-.4-2.4-1.2l-7.5-4.7Z' : 'M23.3 17.4c1.1.7 1.6 1 1.8 1.5.2.4.2.8 0 1.2-.2.4-.7.8-1.8 1.5l-7.5 4.8c-1.2.8-1.8 1.2-2.4 1.2-.4 0-.9-.3-1.1-.6-.3-.4-.3-1.1-.3-2.6v-9.7c0-1.5 0-2.2.3-2.6.3-.4.7-.6 1.1-.6.5 0 1.2.4 2.4 1.2l7.5 4.7Z'} fill="currentColor" />
        <rect x={name === 'prev' ? '11.4' : '23.7'} y="10.5" width="3.1" height="17" rx="1.2" fill="currentColor" />
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
  return record.prompt.slice(0, 16) || '未命名混曲'
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getDisplaySongTitle(title: string): string {
  const chars = Array.from(title)
  if (chars.length <= SONG_TITLE_MAX_CHARS) return title
  return `${chars.slice(0, SONG_TITLE_MAX_CHARS).join('')}…`
}

function isSongTitleTruncated(title: string): boolean {
  return Array.from(title).length > SONG_TITLE_MAX_CHARS
}

function getDisplayRankingSongTitle(title: string): string {
  const chars = Array.from(title)
  if (chars.length <= RANKING_SONG_TITLE_MAX_CHARS) return title
  return `${chars.slice(0, RANKING_SONG_TITLE_MAX_CHARS).join('')}…`
}

function isRankingSongTitleTruncated(title: string): boolean {
  return Array.from(title).length > RANKING_SONG_TITLE_MAX_CHARS
}

function toWorkItem(record: GeneratedMusic, index: number, title?: string): WorkItem {
  return {
    ...record,
    title: title?.trim() || inferTitle(record),
    durationLabel: index % 2 === 0 ? '00:39' : '00:29',
  }
}

function toRankWorkItem(song: Song, record: GeneratedMusic, index: number): WorkItem {
  return {
    ...record,
    title: song.title,
    prompt: song.artist,
    durationLabel: index % 2 === 0 ? '00:39' : '00:29',
    songId: song.id,
  }
}

function toMissingMusicRankWorkItem(song: Song, index: number): WorkItem {
  const now = new Date().toISOString()
  return {
    id: `missing-${song.id}`,
    model: 'music-2.6',
    prompt: song.artist,
    lyrics: null,
    source_audio_url: '',
    music_url: '',
    minio_bucket: '',
    minio_object_name: '',
    content_type: null,
    file_size_bytes: null,
    status: 'missing',
    expires_at: now,
    created_at: song.created_at,
    title: song.title,
    durationLabel: index % 2 === 0 ? '00:39' : '00:29',
    songId: song.id,
    missingMusic: true,
  }
}

function toLoadingMusicRankWorkItem(song: Song): WorkItem {
  const now = new Date().toISOString()
  return {
    id: `loading-${song.id}`,
    model: 'music-2.6',
    prompt: '音频信息加载中...',
    lyrics: null,
    source_audio_url: '',
    music_url: '',
    minio_bucket: '',
    minio_object_name: '',
    content_type: null,
    file_size_bytes: null,
    status: 'loading',
    expires_at: now,
    created_at: song.created_at,
    title: song.title,
    durationLabel: '加载中',
    songId: song.id,
    isMusicLoading: true,
  }
}

function createPendingWorkItem(id: string, prompt: string, title: string): WorkItem {
  const now = new Date().toISOString()
  return {
    id,
    model: 'music-2.6',
    prompt,
    lyrics: null,
    source_audio_url: '',
    music_url: '',
    minio_bucket: '',
    minio_object_name: '',
    content_type: null,
    file_size_bytes: null,
    status: 'generating',
    expires_at: now,
    created_at: now,
    title,
    durationLabel: '生成中',
    isPending: true,
  }
}

function songLabel(song: Song): string {
  return `${song.title} · ${song.artist}`
}

function getReferenceEraOption(song: Song): { icon: string; label: string } {
  if (song.era === 'ai') return referenceEraOptions.digital
  return referenceEraOptions[song.era]
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isInterruptedAudioPlayError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError')
    || message.includes('The play() request was interrupted')
    || message.includes('interrupted by a new load request')
}

function getVoteErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>
    const parts = [record.message, record.detail].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )

    const message = typeof record.message === 'string' ? record.message.trim() : ''
    if (message.includes('投票次数已达上限')) return '当前 IP 投票次数已达上限（每个 IP 最多 3 票）'
    if (parts.length > 0) return parts.join('；')
  }

  if (err instanceof Error && err.message.trim()) return err.message
  if (typeof err === 'string' && err.trim()) return err
  return '推榜失败，请稍后重试'
}

export default function MixInterfacePage() {
  const [scale, setScale] = useState(() => {
    if (typeof window === 'undefined') return 1
    return Math.min(1, window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
  })
  const { songs, loading: loadingSongs, error: songsError, upsertSong } = useSongs()
  const { classic } = useLeaderboards(songs)
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(styleOptions[0].id)
  const [customStyleOpen, setCustomStyleOpen] = useState(false)
  const [customStyle, setCustomStyle] = useState('')
  const [works, setWorks] = useState<WorkItem[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [voting, setVoting] = useState(false)
  const [votedWorkId, setVotedWorkId] = useState<string | null>(null)
  const [hasUnpushedGeneratedWork, setHasUnpushedGeneratedWork] = useState(false)
  const [uploadedWorkIds, setUploadedWorkIds] = useState<Set<string>>(() => new Set())
  const [uploadedSongIdsByWorkId, setUploadedSongIdsByWorkId] = useState<Map<string, string>>(() => new Map())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [statusFading, setStatusFading] = useState(false)
  const [aiPlaying, setAiPlaying] = useState(false)
  const [aiCurrentTime, setAiCurrentTime] = useState(0)
  const [aiDuration, setAiDuration] = useState(0)
  const [footerPlaying, setFooterPlaying] = useState(false)
  const [footerCurrentTime, setFooterCurrentTime] = useState(0)
  const [footerDuration, setFooterDuration] = useState(0)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [generationStepId, setGenerationStepId] = useState<GenerationStepId | null>(null)
  const [songTitleTooltip, setSongTitleTooltip] = useState<{ text: string; left: number; top: number } | null>(null)
  const [footerPlayTooltip, setFooterPlayTooltip] = useState<{ text: string; left: number; top: number } | null>(null)
  const modalOpen = generationStepId !== null || playerOpen || confirmCloseOpen
  const inactivityPaused = generating || modalOpen || hasUnpushedGeneratedWork || aiPlaying || footerPlaying
  const referenceScrollRef = useRef<HTMLDivElement | null>(null)
  const customInputRef = useRef<HTMLInputElement | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)
  const footerAudioRef = useRef<HTMLAudioElement | null>(null)
  const autoPlayWorkIdRef = useRef<string | null>(null)
  const autoPlayReferenceIdRef = useRef<string | null>(null)
  const inactivityTimerRef = useRef<number | null>(null)
  const generationCloseTimerRef = useRef<number | null>(null)

  const closePlayer = useCallback(() => {
    autoPlayWorkIdRef.current = null
    aiAudioRef.current?.pause()
    setAiPlaying(false)
    setPlayerOpen(false)
    setConfirmCloseOpen(false)
  }, [])

  useEffect(() => {
    let rafId = 0
    const updateScale = () => {
      rafId = 0
      const nextScale = Math.min(1, window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
      setScale((prev) => (Math.abs(prev - nextScale) < 0.0005 ? prev : nextScale))
    }
    const handleResize = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(updateScale)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (!message && !error) {
      setStatusFading(false)
      return undefined
    }

    setStatusFading(false)
    let clearTimerId: number | null = null
    const hideTimerId = window.setTimeout(() => {
      setStatusFading(true)
      clearTimerId = window.setTimeout(() => {
        setMessage('')
        setError('')
        setStatusFading(false)
      }, STATUS_FADE_OUT_MS)
    }, MESSAGE_AUTO_HIDE_MS)
    return () => {
      window.clearTimeout(hideTimerId)
      if (clearTimerId !== null) window.clearTimeout(clearTimerId)
    }
  }, [error, message])

  useEffect(() => {
    const returnToStandby = () => {
      if (inactivityPaused) return
      const standbyUrl = new URL(window.location.href)
      standbyUrl.searchParams.set('mode', 'standby')
      window.history.replaceState(null, '', `${standbyUrl.pathname}${standbyUrl.search}${standbyUrl.hash}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current !== null) window.clearTimeout(inactivityTimerRef.current)
      if (inactivityPaused) {
        inactivityTimerRef.current = null
        return
      }
      inactivityTimerRef.current = window.setTimeout(returnToStandby, MIX_INACTIVITY_TIMEOUT_MS)
    }
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'touchmove', 'scroll'] as const
    const listenerOptions = { passive: true, capture: true }

    resetInactivityTimer()
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, listenerOptions))

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer, listenerOptions))
      if (inactivityTimerRef.current !== null) window.clearTimeout(inactivityTimerRef.current)
    }
  }, [inactivityPaused])

  const referenceSongs = classic
  const selectedReference = useMemo(
    () => (selectedReferenceId ? referenceSongs.find((song) => song.id === selectedReferenceId) ?? null : null),
    [selectedReferenceId, referenceSongs],
  )
  const selectedReferenceIcon = useMemo(() => {
    if (!selectedReference) return footerIcon
    return getReferenceEraOption(selectedReference).icon
  }, [selectedReference])
  const selectedStyle = useMemo(
    () => styleOptions.find((style) => style.id === selectedStyleId) ?? styleOptions[0],
    [selectedStyleId],
  )
  const generatedMusicById = useMemo(() => {
    const map = new Map<string, GeneratedMusic>()
    works.forEach((work) => {
      if (!work.isPending && !work.isMusicLoading) map.set(work.id, work)
    })
    return map
  }, [works])
  const selectedReferenceMusic = useMemo(
    () => (selectedReference?.music_id ? generatedMusicById.get(selectedReference.music_id) ?? null : null),
    [generatedMusicById, selectedReference],
  )
  const playableReferenceSongs = useMemo(
    () => referenceSongs.filter((song) => {
      if (!song.music_id) return false
      const record = generatedMusicById.get(song.music_id)
      return Boolean(record?.music_url)
    }),
    [generatedMusicById, referenceSongs],
  )
  const aiSongs = useMemo(
    () => [...songs.filter((song) => song.era === 'ai')].sort((a, b) => calcScore(b) - calcScore(a)),
    [songs],
  )
  const aiRankWorks = useMemo(
    () => aiSongs
      .map((song, index) => {
        if (!song.music_id) return toMissingMusicRankWorkItem(song, index)
        const record = generatedMusicById.get(song.music_id)
        if (!record && loadingWorks) return toLoadingMusicRankWorkItem(song)
        if (!record) return toMissingMusicRankWorkItem(song, index)
        return toRankWorkItem(song, record, index)
      }),
    [aiSongs, generatedMusicById, loadingWorks],
  )
  const playableRankWorks = useMemo(
    () => aiRankWorks.filter((work) => !work.isPending && !work.isMusicLoading && !work.missingMusic && Boolean(work.music_url)),
    [aiRankWorks],
  )
  const selectedWork = useMemo(
    () => (selectedWorkId ? works.find((work) => work.id === selectedWorkId) ?? aiRankWorks.find((work) => work.songId === selectedWorkId || work.id === selectedWorkId) ?? null : null),
    [aiRankWorks, selectedWorkId, works],
  )
  const aiProgressPercent = aiDuration ? Math.min(100, Math.max(0, (aiCurrentTime / aiDuration) * 100)) : 0
  const footerAudioUrl = selectedReferenceMusic?.music_url ?? ''
  const footerAudioReady = Boolean(footerAudioUrl)
  const footerDisplayCurrentTime = footerAudioReady ? footerCurrentTime : 0
  const footerDisplayDuration = footerAudioReady ? footerDuration : 0
  const footerProgressPercent = footerDisplayDuration ? Math.min(100, Math.max(0, (footerDisplayCurrentTime / footerDisplayDuration) * 100)) : 0
  const selectedWorkUploadedSongId = selectedWork?.songId ?? (selectedWork ? uploadedSongIdsByWorkId.get(selectedWork.id) : undefined)
  const selectedWorkUploaded = selectedWork ? Boolean(selectedWorkUploadedSongId) || uploadedWorkIds.has(selectedWork.id) : false
  const selectedWorkVoted = selectedWork ? votedWorkId === selectedWork.id : false
  const canSelectAdjacentWork = selectedWork ? playableRankWorks.some((work) => work.id === selectedWork.id) : false
  const canSelectAdjacentReference = selectedReference ? playableReferenceSongs.some((song) => song.id === selectedReference.id) : false
  const shouldConfirmPlayerClose = Boolean(selectedWork && hasUnpushedGeneratedWork && !selectedWorkUploaded)
  const footerAudioUnavailableReason = useMemo(() => {
    if (!selectedReference) return '请先选择一首热门代际歌曲'
    if (!selectedReference.music_id) return `《${selectedReference.title}》没有关联音频，无法播放`
    if (loadingWorks) return '热门代际歌曲音频信息还在加载中，请稍后再试'
    if (!selectedReferenceMusic) return `《${selectedReference.title}》关联音频不存在或已过期，无法播放`
    if (!selectedReferenceMusic.music_url) return `《${selectedReference.title}》音频暂时无法访问，无法播放`
    return ''
  }, [loadingWorks, selectedReference, selectedReferenceMusic])
  useEffect(() => {
    if (!footerAudioUnavailableReason) setFooterPlayTooltip(null)
  }, [footerAudioUnavailableReason])
  const selectedReferenceAudioUnavailableReason = useMemo(() => {
    if (!selectedReference) return '请先选择一首社区热门歌曲'
    if (!selectedReference.music_id) return `《${selectedReference.title}》没有关联音频，无法作为AI混曲参考`
    if (loadingWorks) return '参考音频信息还在加载中，请稍后再试'
    if (!selectedReferenceMusic) return `《${selectedReference.title}》关联音频不存在或已过期，无法作为AI混曲参考`
    if (!selectedReferenceMusic.music_url) return `《${selectedReference.title}》关联音频暂时无法访问，无法作为AI混曲参考`
    return ''
  }, [loadingWorks, selectedReference, selectedReferenceMusic])

  const requestClosePlayer = useCallback(() => {
    if (shouldConfirmPlayerClose) {
      setConfirmCloseOpen(true)
      return
    }
    closePlayer()
  }, [closePlayer, shouldConfirmPlayerClose])

  const confirmClosePlayer = useCallback(() => {
    setHasUnpushedGeneratedWork(false)
    closePlayer()
  }, [closePlayer])

  useEffect(() => {
    if (!selectedReferenceId && referenceSongs.length > 0) setSelectedReferenceId(referenceSongs[0].id)
  }, [referenceSongs, selectedReferenceId])

  useEffect(() => {
    if (!selectedReferenceId) return
    const frameId = window.requestAnimationFrame(() => {
      const container = referenceScrollRef.current
      const target = Array.from(container?.querySelectorAll<HTMLElement>('.mix-reference-card') ?? [])
        .find((element) => element.dataset.referenceId === selectedReferenceId)
      if (!container || !target) return
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const left = container.scrollLeft
        + targetRect.left
        - containerRect.left
        - (containerRect.width - targetRect.width) / 2
      container.scrollTo({
        left,
        behavior: 'smooth',
      })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [selectedReferenceId])

  useEffect(() => {
    if (!selectedWorkId && aiRankWorks.length > 0) setSelectedWorkId(aiRankWorks[0].songId ?? aiRankWorks[0].id)
  }, [aiRankWorks, selectedWorkId])

  useEffect(() => {
    if (!playerOpen) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClosePlayer()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playerOpen, requestClosePlayer])

  useEffect(() => {
    let stopped = false
    void fetchGeneratedMusic()
      .then((records) => {
        if (stopped) return
        const items = records.map((record, index) => toWorkItem(record, index))
        setWorks(items)
      })
      .catch((err: unknown) => {
        if (!stopped) setError(err instanceof Error ? err.message : 'AI混曲榜单加载失败')
      })
      .finally(() => {
        if (!stopped) setLoadingWorks(false)
      })
    return () => {
      stopped = true
    }
  }, [])

  useEffect(() => () => {
    if (generationCloseTimerRef.current !== null) window.clearTimeout(generationCloseTimerRef.current)
  }, [])

  useEffect(() => {
    const audio = aiAudioRef.current
    const shouldAutoPlay = selectedWorkId !== null
      && autoPlayWorkIdRef.current === selectedWorkId
      && !selectedWork?.isPending
      && Boolean(selectedWork?.music_url)

    setAiCurrentTime(0)
    setAiDuration(0)
    setAiPlaying(false)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      if (shouldAutoPlay) {
        footerAudioRef.current?.pause()
        setFooterPlaying(false)
        void audio.play().then(() => {
          if (autoPlayWorkIdRef.current === selectedWorkId) autoPlayWorkIdRef.current = null
          setAiPlaying(true)
          setError('')
        }).catch((err: unknown) => {
          if (autoPlayWorkIdRef.current === selectedWorkId) autoPlayWorkIdRef.current = null
          if (isInterruptedAudioPlayError(err)) return
          setError(err instanceof Error ? err.message : '播放失败')
        })
      }
    } else if (autoPlayWorkIdRef.current === selectedWorkId) {
      autoPlayWorkIdRef.current = null
    }
  }, [selectedWorkId, selectedWork?.isPending, selectedWork?.music_url])

  useEffect(() => {
    const audio = footerAudioRef.current
    const shouldAutoPlay = selectedReferenceId !== null
      && autoPlayReferenceIdRef.current === selectedReferenceId
      && footerAudioReady

    setFooterCurrentTime(0)
    setFooterDuration(0)
    setFooterPlaying(false)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      if (!footerAudioReady) {
        audio.removeAttribute('src')
        audio.load()
        if (
          autoPlayReferenceIdRef.current === selectedReferenceId
          && (!loadingWorks || !selectedReference?.music_id || selectedReferenceMusic)
        ) autoPlayReferenceIdRef.current = null
        return
      }
      if (shouldAutoPlay) {
        aiAudioRef.current?.pause()
        setAiPlaying(false)
        void audio.play().then(() => {
          if (autoPlayReferenceIdRef.current === selectedReferenceId) autoPlayReferenceIdRef.current = null
          setFooterPlaying(true)
          setError('')
        }).catch((err: unknown) => {
          if (autoPlayReferenceIdRef.current === selectedReferenceId) autoPlayReferenceIdRef.current = null
          if (isInterruptedAudioPlayError(err)) return
          setError(err instanceof Error ? err.message : '播放失败')
        })
      }
    } else if (autoPlayReferenceIdRef.current === selectedReferenceId) {
      autoPlayReferenceIdRef.current = null
    }
  }, [footerAudioReady, footerAudioUrl, loadingWorks, selectedReference, selectedReferenceId, selectedReferenceMusic])

  const scrollReferences = (direction: -1 | 1) => {
    referenceScrollRef.current?.scrollBy({
      left: direction * 235,
      behavior: 'smooth',
    })
  }

  const handleCustomStyleClick = () => {
    setCustomStyleOpen(true)
    setSelectedStyleId(null)
    window.requestAnimationFrame(() => customInputRef.current?.focus())
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyleId(styleId)
    setCustomStyleOpen(false)
  }

  const handleGenerate = () => {
    if (generating) return
    if (selectedReferenceAudioUnavailableReason) {
      setError(selectedReferenceAudioUnavailableReason)
      return
    }
    if (!selectedReference?.music_id || !selectedReferenceMusic?.music_url) return
    const stylePrompt = (customStyleOpen && customStyle.trim() ? customStyle.trim() : selectedStyle.prompt).slice(0, 360)
    const prompt = `参考《${selectedReference.title}》生成${stylePrompt}风格AI混曲，适合现场播放和榜单展示。`.slice(0, 300)
    const title = `${selectedReference.title} AI混曲`
    const pendingId = `pending-${Date.now()}`
    const referenceMusic = selectedReferenceMusic
    const workIndex = works.length

    setGenerating(true)
    setError('')
    setMessage('AI混曲生成中...')
    setGenerationStepId('start')
    if (generationCloseTimerRef.current !== null) {
      window.clearTimeout(generationCloseTimerRef.current)
      generationCloseTimerRef.current = null
    }
    setWorks((prev) => [createPendingWorkItem(pendingId, prompt, title), ...prev])

    void (async () => {
      await waitFor(GENERATION_STEP_DELAY_MS)
      setGenerationStepId('preprocess')
      const preprocessResult = await preprocessMusicCover({
        audio_url: referenceMusic.music_url,
      })
      const formattedLyrics = preprocessResult.formatted_lyrics?.trim().slice(0, 1000)
      if (!formattedLyrics || formattedLyrics.length < 10) throw new Error('翻唱前处理未返回歌词，无法生成翻唱音乐')
      setGenerationStepId('generate')
      return generateMusic({
        model: 'music-cover',
        prompt,
        lyrics: formattedLyrics,
        cover_feature_id: preprocessResult.cover_feature_id,
      })
    })()
      .then((record) => {
        const item = toWorkItem(record, workIndex, title)
        setWorks((prev) => prev.map((work) => (work.id === pendingId ? item : work)))
        setHasUnpushedGeneratedWork(true)
        setMessage('AI混曲已生成')
        setGenerationStepId('complete')
        generationCloseTimerRef.current = window.setTimeout(() => {
          setGenerationStepId(null)
          autoPlayWorkIdRef.current = item.id
          setSelectedWorkId(item.id)
          setPlayerOpen(true)
          setMessage('')
          generationCloseTimerRef.current = null
        }, GENERATION_COMPLETE_HIDE_MS)
      })
      .catch((err: unknown) => {
        setWorks((prev) => prev.filter((work) => work.id !== pendingId))
        setGenerationStepId(null)
        setError(err instanceof Error ? err.message : '生成失败')
        setMessage('')
      })
      .finally(() => {
        setGenerating(false)
      })
  }

  const handleWorkSelect = (work: WorkItem) => {
    if (work.isPending) return
    const nextWorkId = work.songId ?? work.id
    if (work.isMusicLoading) {
      autoPlayWorkIdRef.current = null
      setSelectedWorkId(nextWorkId)
      setAiPlaying(false)
      setPlayerOpen(false)
      setMessage('音频信息还在加载中，请稍后再试')
      return
    }
    if (work.missingMusic || !work.music_url) {
      autoPlayWorkIdRef.current = null
      setSelectedWorkId(nextWorkId)
      setAiPlaying(false)
      setPlayerOpen(false)
      setError('这首AI混曲缺少关联音乐，无法播放')
      return
    }
    autoPlayWorkIdRef.current = nextWorkId
    setSelectedWorkId(nextWorkId)
    setPlayerOpen(true)
    setMessage('')
    if (nextWorkId === selectedWorkId) {
      const audio = aiAudioRef.current
      if (!audio) return
      footerAudioRef.current?.pause()
      setFooterPlaying(false)
      void audio.play().then(() => {
        if (autoPlayWorkIdRef.current === nextWorkId) autoPlayWorkIdRef.current = null
        setAiPlaying(true)
        setError('')
      }).catch((err: unknown) => {
        if (autoPlayWorkIdRef.current === nextWorkId) autoPlayWorkIdRef.current = null
        if (isInterruptedAudioPlayError(err)) return
        setError(err instanceof Error ? err.message : '播放失败')
      })
    }
  }

  const toggleAiPlay = () => {
    const audio = aiAudioRef.current
    if (!audio || !selectedWork || selectedWork.isPending || !selectedWork.music_url) return

    if (audio.paused) {
      footerAudioRef.current?.pause()
      setFooterPlaying(false)
      void audio.play().then(() => setAiPlaying(true)).catch((err: unknown) => {
        if (isInterruptedAudioPlayError(err)) return
        setError(err instanceof Error ? err.message : '播放失败')
      })
      return
    }

    audio.pause()
    setAiPlaying(false)
  }

  const handleAiSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value)
    setAiCurrentTime(nextTime)
    if (aiAudioRef.current) aiAudioRef.current.currentTime = nextTime
  }

  const toggleFooterPlay = () => {
    const audio = footerAudioRef.current
    if (!audio || !footerAudioReady) {
      if (footerAudioUnavailableReason) setError(footerAudioUnavailableReason)
      return
    }

    if (audio.paused) {
      aiAudioRef.current?.pause()
      setAiPlaying(false)
      void audio.play().then(() => {
        setFooterPlaying(true)
        setError('')
      }).catch((err: unknown) => {
        if (isInterruptedAudioPlayError(err)) return
        setError(err instanceof Error ? err.message : '播放失败')
      })
      return
    }

    audio.pause()
    setFooterPlaying(false)
  }

  const showFooterPlayTooltip = (event: ReactMouseEvent<HTMLElement>) => {
    if (!footerAudioUnavailableReason) return
    const rect = event.currentTarget.getBoundingClientRect()
    const canvas = event.currentTarget.closest('.mix-canvas')
    if (!(canvas instanceof HTMLElement)) return
    const canvasRect = canvas.getBoundingClientRect()
    const currentScale = scale || 1
    setFooterPlayTooltip({
      text: footerAudioUnavailableReason,
      left: (rect.left + rect.width / 2 - canvasRect.left) / currentScale,
      top: (rect.top - canvasRect.top) / currentScale,
    })
  }

  const handleFooterSeek = (event: ChangeEvent<HTMLInputElement>) => {
    if (!footerAudioReady) return
    const nextTime = Number(event.target.value)
    setFooterCurrentTime(nextTime)
    if (footerAudioRef.current) footerAudioRef.current.currentTime = nextTime
  }

  const selectAdjacentReference = (direction: -1 | 1) => {
    if (playableReferenceSongs.length === 0) return
    const currentIndex = selectedReference ? playableReferenceSongs.findIndex((song) => song.id === selectedReference.id) : -1
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + playableReferenceSongs.length) % playableReferenceSongs.length
    const next = playableReferenceSongs[nextIndex]
    if (!next) return
    autoPlayReferenceIdRef.current = next.id
    setSelectedReferenceId(next.id)
    if (next.id === selectedReferenceId) {
      const audio = footerAudioRef.current
      if (!audio) return
      aiAudioRef.current?.pause()
      setAiPlaying(false)
      void audio.play().then(() => {
        if (autoPlayReferenceIdRef.current === next.id) autoPlayReferenceIdRef.current = null
        setFooterPlaying(true)
        setError('')
      }).catch((err: unknown) => {
        if (autoPlayReferenceIdRef.current === next.id) autoPlayReferenceIdRef.current = null
        if (isInterruptedAudioPlayError(err)) return
        setError(err instanceof Error ? err.message : '播放失败')
      })
    }
  }

  const selectAdjacentWork = (direction: -1 | 1) => {
    if (!selectedWork || playableRankWorks.length === 0) return
    const currentIndex = playableRankWorks.findIndex((work) => work.id === selectedWork.id)
    if (currentIndex < 0) return
    const next = playableRankWorks[(currentIndex + direction + playableRankWorks.length) % playableRankWorks.length]
    if (next) handleWorkSelect(next)
  }

  const handleUploadToRanking = () => {
    if (!selectedWork || selectedWork.isPending || selectedWorkUploaded || uploading) return
    setUploading(true)
    setError('')
    void insertSong({
      title: selectedWork.title,
      music_id: selectedWork.id,
      artist: 'AI混曲',
      era: 'ai',
    })
      .then((song) => {
        upsertSong(song)
        setUploadedWorkIds((prev) => new Set(prev).add(selectedWork.id))
        setUploadedSongIdsByWorkId((prev) => new Map(prev).set(selectedWork.id, song.id))
        setHasUnpushedGeneratedWork(false)
        setSelectedWorkId(song.id)
        setMessage('已上传到AI混曲榜单')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '上传失败')
      })
      .finally(() => setUploading(false))
  }

  const handleVoteUploadedWork = () => {
    if (!selectedWork || !selectedWorkUploadedSongId || voting) return
    const workId = selectedWork.id
    setVoting(true)
    setError('')
    void voteSong(selectedWorkUploadedSongId)
      .then((updatedSong) => {
        upsertSong(updatedSong)
        setVotedWorkId(workId)
        setMessage('已推榜 +1')
        window.setTimeout(() => setVotedWorkId((id) => (id === workId ? null : id)), 1400)
      })
      .catch((err: unknown) => {
        const message = getVoteErrorMessage(err)
        setError(message.includes('投票次数已达上限') ? message : `《${selectedWork.title}》推榜失败：${message}`)
      })
      .finally(() => setVoting(false))
  }

  const renderSongTitle = (title: string) => {
    const truncated = isSongTitleTruncated(title)
    return (
      <strong
        className={`mix-song-title${truncated ? ' is-truncated' : ''}`}
        onMouseEnter={truncated ? (event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const canvas = event.currentTarget.closest('.mix-canvas')
          if (!(canvas instanceof HTMLElement)) return
          const canvasRect = canvas.getBoundingClientRect()
          const currentScale = scale || 1
          setSongTitleTooltip({
            text: title,
            left: (rect.left + rect.width / 2 - canvasRect.left) / currentScale,
            top: (rect.top - canvasRect.top) / currentScale,
          })
        } : undefined}
        onMouseLeave={truncated ? () => setSongTitleTooltip(null) : undefined}
      >
        {getDisplaySongTitle(title)}
      </strong>
    )
  }

  const renderRankingSongTitle = (title: string) => {
    const truncated = isRankingSongTitleTruncated(title)
    return (
      <strong
        className={`mix-song-title${truncated ? ' is-truncated' : ''}`}
        onMouseEnter={truncated ? (event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const canvas = event.currentTarget.closest('.mix-canvas')
          if (!(canvas instanceof HTMLElement)) return
          const canvasRect = canvas.getBoundingClientRect()
          const currentScale = scale || 1
          setSongTitleTooltip({
            text: title,
            left: (rect.left + rect.width / 2 - canvasRect.left) / currentScale,
            top: (rect.top - canvasRect.top) / currentScale,
          })
        } : undefined}
        onMouseLeave={truncated ? () => setSongTitleTooltip(null) : undefined}
      >
        {getDisplayRankingSongTitle(title)}
      </strong>
    )
  }

  const generationStepIndex = generationStepId ? generationSteps.findIndex((step) => step.id === generationStepId) : -1
  const generationCurrentStep = generationStepIndex >= 0 ? generationSteps[generationStepIndex] : null
  const generationProgressPercent = generationStepIndex >= 0 ? ((generationStepIndex + 1) / generationSteps.length) * 100 : 0
  const footerCurrentTitle = selectedReference?.title
  const footerCurrentDescription = selectedReference ? songLabel(selectedReference) : '请先选择热门代际歌曲'

  return (
    <main className="mix-page">
      <div className="mix-scaler" style={{ height: DESIGN_HEIGHT * scale }}>
        <section className="mix-canvas" style={{ transform: `translateX(-50%) scale(${scale})` }}>
          <img src="/dashboard-background.png" className="mix-dashboard-bg" alt="" aria-hidden />
          <div className="mix-bg-wash" />

          <header className="mix-header mix-header-primary">
            <span className="mix-layer-img mix-header-panel-svg" aria-hidden dangerouslySetInnerHTML={{ __html: headerLeftPanel }} />
            <span className="mix-title-icon mix-title-icon-primary" aria-hidden dangerouslySetInnerHTML={{ __html: headerLeftIcon }} />
            <button className="mix-home-button" type="button" onClick={() => window.location.assign('?mode=home')} aria-label="返回主页">
              <img src={backArrow} alt="" aria-hidden />
            </button>
            <div className="mix-title-copy">
              <span>代际知音</span>
              <span className="mix-title-separator">–</span>
              <strong>AI混曲</strong>
            </div>
          </header>

          <header className="mix-header mix-header-ranking">
            <span className="mix-layer-img mix-header-panel-svg" aria-hidden dangerouslySetInnerHTML={{ __html: headerRightPanel }} />
            <img src={headerRightIcon} className="mix-title-icon mix-title-icon-ranking" alt="" aria-hidden />
            <div className="mix-title-copy mix-title-copy-right">
              <strong>AI共创榜单</strong>
            </div>
          </header>

          <section className="mix-reference-section" aria-label="选择社区热门歌曲">
            <img src={topCapsule} className="mix-section-title-bg" alt="" aria-hidden />
            <div className="mix-section-title mix-section-title-reference">第一步：选择社区热门歌曲</div>
            <img src={selectorPanel} className="mix-section-panel" alt="" aria-hidden />
            <button className="mix-scroll-control mix-scroll-control-left" type="button" onClick={() => scrollReferences(-1)} aria-label="向左查看社区热门歌曲">
              <img src={selectorChevron} alt="" aria-hidden />
            </button>
            <div className="mix-reference-list" ref={referenceScrollRef}>
              {loadingSongs && <div className="mix-empty-card">加载榜单中...</div>}
              {!loadingSongs && referenceSongs.length === 0 && <div className="mix-empty-card">暂无社区热门歌曲</div>}
              {referenceSongs.map((song, index) => {
                const selected = selectedReference?.id === song.id
                const option = getReferenceEraOption(song)
                return (
                  <button
                    className={`mix-reference-card${selected ? ' is-selected' : ''}`}
                    type="button"
                    key={song.id}
                    data-reference-id={song.id}
                    onClick={() => {
                      autoPlayReferenceIdRef.current = song.id
                      setSelectedReferenceId(song.id)
                    }}
                  >
                    <img src={option.icon} className="mix-reference-record" alt="" aria-hidden />
                    <span className="mix-reference-rank">TOP {index + 1}</span>
                    <span className="mix-reference-label">
                      <img src={option.label} alt="" aria-hidden />
                      {renderSongTitle(song.title)}
                    </span>
                  </button>
                )
              })}
            </div>
            <button className="mix-scroll-control mix-scroll-control-right" type="button" onClick={() => scrollReferences(1)} aria-label="向右查看社区热门歌曲">
              <img src={selectorChevron} alt="" aria-hidden />
            </button>
          </section>

          <section className="mix-style-section" aria-label="选择风格">
            <img src={bottomCapsule} className="mix-style-title-bg" alt="" aria-hidden />
            <div className="mix-section-title mix-section-title-style">第二步：选择风格</div>
            <img src={formPanel} className="mix-style-panel" alt="" aria-hidden />
            <div className="mix-style-options">
              {styleOptions.map((style) => (
                <button
                  className={`mix-style-card${selectedStyleId === style.id ? ' is-selected' : ''}`}
                  type="button"
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id)}
                >
                  <img src={style.card} className="mix-style-card-bg" alt="" aria-hidden />
                  <span className="mix-style-card-title">
                    <strong>{style.title}</strong>
                  </span>
                </button>
              ))}
            </div>
            <div className="mix-style-actions">
              <div
                className={`mix-custom-style-btn${customStyleOpen ? ' is-open' : ''}`}
                role="button"
                tabIndex={0}
                onClick={handleCustomStyleClick}
                onMouseDown={(event) => {
                  if (event.target !== customInputRef.current) handleCustomStyleClick()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') handleCustomStyleClick()
                }}
              >
                <img src={secondaryCapsule} alt="" aria-hidden />
                {customStyleOpen ? (
                  <input
                    ref={customInputRef}
                    value={customStyle}
                    onChange={(event) => {
                      setSelectedStyleId(null)
                      setCustomStyle(event.target.value.slice(0, 300))
                    }}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="输入自定义风格"
                  />
                ) : (
                  <span>自定义风格</span>
                )}
              </div>
              <button className="mix-generate-mix-btn" type="button" onClick={handleGenerate} disabled={generating}>
                <img src={primaryCapsule} alt="" aria-hidden />
                <span>{generating ? '生成中...' : '生成混曲'}</span>
              </button>
            </div>
          </section>

          <aside className="mix-ranking-section" aria-label="AI混曲榜单">
            <svg className="mix-ranking-panel" viewBox="0 0 495 708" fill="none" aria-hidden>
              <image href={rankingPanel} x="0" y="0" width="495" height="708" />
              <text className="mix-ranking-svg-title" x="73" y="107">欢迎收听！</text>
            </svg>
            <div className="mix-ranking-list">
              {(loadingWorks || loadingSongs) && aiRankWorks.length === 0 && <div className="mix-ranking-empty">加载AI混曲榜单中...</div>}
              {!loadingWorks && !loadingSongs && aiRankWorks.length === 0 && <div className="mix-ranking-empty">暂无AI混曲，先生成一首吧</div>}
              {aiRankWorks.map((work, index) => {
                const waiting = work.isPending || work.isMusicLoading
                return (
                  <button
                    className={`mix-ranking-row${waiting ? ' is-pending' : ''}`}
                    type="button"
                    key={work.songId ?? work.id}
                    onClick={() => handleWorkSelect(work)}
                    disabled={waiting}
                  >
                    <span className="mix-ranking-play mix-ranking-ai-icon-shell"><img className="mix-ranking-ai-icon" src={aiRankingIcon} alt="" aria-hidden /></span>
                    <span className="mix-ranking-meta">
                      {renderRankingSongTitle(work.title)}
                      <small>{work.isPending ? 'AI正在生成音乐...' : work.isMusicLoading ? '音频信息加载中...' : work.missingMusic ? '缺少关联音乐，无法播放' : work.prompt}</small>
                    </span>
                    <span className="mix-ranking-tag">{work.isPending ? 'WAIT' : work.isMusicLoading ? 'LOAD' : work.missingMusic ? 'MISS' : `NO.${index + 1}`}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <footer className="mix-footer">
            <img src={footerPanel} className="mix-footer-panel" alt="" aria-hidden />
            <button className="mix-footer-current" type="button" onClick={toggleFooterPlay} disabled={!footerAudioReady}>
              <img src={selectedReferenceIcon} alt="" aria-hidden />
              <div>
                {footerCurrentTitle ? renderSongTitle(footerCurrentTitle) : <strong>等待选择歌曲</strong>}
                <span>{footerCurrentDescription}</span>
              </div>
            </button>
            <div className="mix-footer-player">
              <button type="button" onClick={() => selectAdjacentReference(-1)} disabled={!canSelectAdjacentReference} aria-label="上一首"><Icon name="prev" /></button>
              <span className={`mix-footer-play-wrapper${footerAudioUnavailableReason ? ' is-disabled' : ''}`} onMouseEnter={showFooterPlayTooltip} onMouseLeave={() => setFooterPlayTooltip(null)}>
                <button className="mix-footer-play" type="button" onClick={toggleFooterPlay} disabled={!footerAudioReady} aria-label={footerPlaying ? '暂停' : '播放'}>
                  <Icon name={footerPlaying ? 'pause' : 'play'} className={footerPlaying ? undefined : 'mix-footer-play-icon'} />
                </button>
              </span>
              <button type="button" onClick={() => selectAdjacentReference(1)} disabled={!canSelectAdjacentReference} aria-label="下一首"><Icon name="next" /></button>
              <span>{formatTime(footerDisplayCurrentTime)}</span>
              <input
                className="mix-footer-range"
                type="range"
                min="0"
                max={footerDisplayDuration}
                value={Math.min(footerDisplayCurrentTime, footerDisplayDuration)}
                onChange={handleFooterSeek}
                disabled={!footerAudioReady || !footerDisplayDuration}
                style={{ '--mix-progress': `${footerProgressPercent}%` } as CSSProperties}
              />
              <span>{formatTime(footerDisplayDuration)}</span>
            </div>
          </footer>

          <div className="mix-ai-disclaimer">此音乐内容由AI生成，不作任何商用途径，重要信息务必核查。</div>

          {(error || songsError || message) && (
            <div className={`mix-status${error || songsError ? ' is-error' : ''}`}>
              {error || songsError || message}
            </div>
          )}

          {generationCurrentStep && (
            <div className="mix-generation-modal" role="status" aria-live="polite">
              <div className="mix-generation-card">
                <div className="mix-generation-orb" aria-hidden>
                  <div className="mix-generation-orb-art" dangerouslySetInnerHTML={{ __html: generationOrbSvg }} />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mix-generation-copy">
                  <strong>{generationCurrentStep.title}</strong>
                  <p>{generationCurrentStep.description}</p>
                </div>
                <div className="mix-generation-progress" style={{ '--mix-generation-progress': `${generationProgressPercent}%` } as CSSProperties} aria-hidden>
                  <span />
                </div>
                <ol className="mix-generation-steps">
                  {generationSteps.map((step, index) => {
                    const active = index === generationStepIndex
                    const done = index < generationStepIndex
                    return (
                      <li className={`${active ? 'is-active' : ''}${done ? ' is-done' : ''}`} key={step.id}>
                        <span>{index + 1}</span>
                        <div>
                          <strong>{step.title}</strong>
                          <small>{step.description}</small>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          )}

          {playerOpen && selectedWork && (
            <div className="mix-player-modal" role="dialog" aria-modal="true" aria-label="AI混曲播放器" onClick={requestClosePlayer}>
              <div className="mix-player-card" onClick={(event) => event.stopPropagation()}>
                <button className="mix-player-close" type="button" onClick={requestClosePlayer} aria-label="关闭播放器">×</button>
                <div className="mix-player-visual" aria-hidden>
                  <div className="mix-player-orb" dangerouslySetInnerHTML={{ __html: generationOrbSvg }} />
                  <div className="mix-player-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="mix-player-content">
                  <h2>{selectedWork.title}</h2>
                  <p>{selectedWork.prompt}</p>
                  <div className="mix-player-controls">
                    <button type="button" onClick={() => selectAdjacentWork(-1)} disabled={!canSelectAdjacentWork} aria-label="上一首"><Icon name="prev" /></button>
                    <button className="mix-player-play" type="button" onClick={toggleAiPlay} disabled={!selectedWork.music_url} aria-label={aiPlaying ? '暂停' : '播放'}>
                      <Icon name={aiPlaying ? 'pause' : 'play'} className={aiPlaying ? undefined : 'mix-player-play-icon'} />
                    </button>
                    <button type="button" onClick={() => selectAdjacentWork(1)} disabled={!canSelectAdjacentWork} aria-label="下一首"><Icon name="next" /></button>
                  </div>
                  <div className="mix-player-progress">
                    <span>{formatTime(aiCurrentTime)}</span>
                    <input
                      className="mix-player-range"
                      type="range"
                      min="0"
                      max={aiDuration || 0}
                      value={Math.min(aiCurrentTime, aiDuration || 0)}
                      onChange={handleAiSeek}
                      disabled={!aiDuration}
                      style={{ '--mix-progress': `${aiProgressPercent}%` } as CSSProperties}
                    />
                    <span>{formatTime(aiDuration)}</span>
                  </div>
                  {(error || message) && (
                    <div className={`mix-player-status${error ? ' is-error' : ''}${statusFading ? ' is-leaving' : ''}`}>
                      {error || message}
                    </div>
                  )}
                  <div className={`mix-player-actions${selectedWorkUploaded ? ' is-uploaded' : ''}`}>
                    {!selectedWorkUploaded && (
                      <button className="mix-player-push-button mix-player-upload-button" type="button" onClick={handleUploadToRanking} disabled={!selectedWork || selectedWork.isPending || uploading}>
                        <img src={pushCapsule} alt="" aria-hidden />
                        <span>{uploading ? '上传中' : '上传'}</span>
                      </button>
                    )}
                    {selectedWorkUploaded && (
                      <button className="mix-player-push-button mix-player-vote-button" type="button" onClick={handleVoteUploadedWork} disabled={!selectedWorkUploadedSongId || voting}>
                        <img src={pushCapsule} alt="" aria-hidden />
                        <span>{voting ? '推榜中' : selectedWorkVoted ? '已推 +1' : '推榜'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {confirmCloseOpen && (
            <div className="mix-confirm-modal" role="dialog" aria-modal="true" aria-label="关闭确认" onClick={() => setConfirmCloseOpen(false)}>
              <div className="mix-confirm-card" onClick={(event) => event.stopPropagation()}>
                <strong>还没有上传</strong>
                <p>这首AI混曲还没有上传到榜单，确认关闭播放器吗？</p>
                <div className="mix-confirm-actions">
                  <button className="mix-confirm-secondary" type="button" onClick={() => setConfirmCloseOpen(false)}>继续上传</button>
                  <button className="mix-confirm-primary" type="button" onClick={confirmClosePlayer}>确认关闭</button>
                </div>
              </div>
            </div>
          )}

          <audio
            ref={aiAudioRef}
            src={selectedWork?.music_url || undefined}
            onTimeUpdate={(event) => setAiCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setAiDuration(event.currentTarget.duration)}
            onEnded={() => setAiPlaying(false)}
          />
          <audio
            ref={footerAudioRef}
            src={footerAudioUrl || undefined}
            onTimeUpdate={(event) => {
              if (footerAudioReady) setFooterCurrentTime(event.currentTarget.currentTime)
            }}
            onLoadedMetadata={(event) => {
              if (footerAudioReady) setFooterDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)
            }}
            onEnded={() => setFooterPlaying(false)}
          />
          {songTitleTooltip && (
            <div className="mix-song-title-tooltip" style={{ left: songTitleTooltip.left, top: songTitleTooltip.top }}>
              {songTitleTooltip.text}
            </div>
          )}
          {footerPlayTooltip && footerAudioUnavailableReason && (
            <div className="mix-song-title-tooltip" style={{ left: footerPlayTooltip.left, top: footerPlayTooltip.top }}>
              {footerPlayTooltip.text}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}


