import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { deleteGeneratedMusic, fetchGeneratedMusic, uploadSourceAudio } from '../lib/music'
import type { GeneratedMusic } from '../lib/music'
import { calcScore, deleteSong, fetchSongs, insertSong, updateSong } from '../lib/songs'
import type { Era, Song } from '../types/song'
import '../styles/admin.css'

type SongFormState = {
  title: string
  artist: string
  era: Era
  music_id: string
  votes: string
  play_count: string
  recommend_count: string
}

type AdminTab = 'songs' | 'music'
type AdminTheme = 'dark' | 'light'
type EraFilter = 'all' | Era
type AudioFilter = 'all' | 'linked' | 'unlinked'
type SongSortKey = 'created' | 'score' | 'title'
type AdminSelectOption = {
  value: string
  label: string
  disabled?: boolean
}
type ToastKind = 'success' | 'error'
type ToastState = {
  text: string
  kind: ToastKind
} | null

const eraOptions: { value: Era; label: string }[] = [
  { value: 'vinyl', label: '黑胶 · 1970s' },
  { value: 'tape', label: '磁带 · 1980s' },
  { value: 'cd', label: 'CD · 1990s' },
  { value: 'digital', label: '数字 · 2000s' },
  { value: 'ai', label: 'AI 共创' },
]

const eraLabelMap: Record<Era, string> = {
  vinyl: '黑胶',
  tape: '磁带',
  cd: 'CD',
  digital: '数字',
  ai: 'AI',
}

const musicStatusLabelMap: Record<string, string> = {
  completed: '可用',
  success: '可用',
  ready: '可用',
  pending: '处理中',
  processing: '处理中',
  failed: '失败',
  error: '失败',
}

function getInitialAdminTheme(): AdminTheme {
  return typeof window !== 'undefined' && window.localStorage.getItem('music-admin-theme') === 'dark' ? 'dark' : 'light'
}

const eraFilterOptions: AdminSelectOption[] = [
  { value: 'all', label: '全部年代' },
  ...eraOptions,
]

const audioFilterOptions: AdminSelectOption[] = [
  { value: 'all', label: '全部源文件' },
  { value: 'linked', label: '已关联' },
  { value: 'unlinked', label: '未关联' },
]

const songSortOptions: AdminSelectOption[] = [
  { value: 'created', label: '按创建时间' },
  { value: 'score', label: '按热度排序' },
  { value: 'title', label: '按歌曲名称' },
]

function AdminSelect({
  value,
  options,
  onChange,
  placeholder = '请选择',
}: {
  value: string
  options: AdminSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.value === value)

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const gap = 8
    const edge = 12
    const availableBelow = window.innerHeight - rect.bottom - edge
    const availableAbove = rect.top - edge
    const shouldOpenUp = availableBelow < 180 && availableAbove > availableBelow
    const availableHeight = shouldOpenUp ? availableAbove : availableBelow
    const maxHeight = Math.max(140, Math.min(280, availableHeight - gap))
    const top = shouldOpenUp
      ? Math.max(edge, rect.top - maxHeight - gap)
      : Math.min(window.innerHeight - edge - maxHeight, rect.bottom + gap)
    const left = Math.min(Math.max(edge, rect.left), window.innerWidth - edge - rect.width)

    setMenuStyle({
      left,
      maxHeight,
      position: 'fixed',
      top,
      width: rect.width,
      zIndex: 1000,
    })
  }

  useEffect(() => {
    if (!open) return

    updateMenuPosition()
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const reposition = () => updateMenuPosition()

    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open])

  const menu = open && typeof document !== 'undefined'
    ? createPortal(
        <div ref={menuRef} className="admin-select-menu" role="listbox" style={menuStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              disabled={option.disabled}
              className={option.value === value ? 'admin-select-option-active' : ''}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (option.disabled) return
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null

  return (
    <div className={`admin-select ${open ? 'admin-select-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="admin-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <span>{selected?.label || placeholder}</span>
        <em>⌄</em>
      </button>
      {menu}
    </div>
  )
}

function createEmptySongForm(): SongFormState {
  return {
    title: '',
    artist: '',
    era: 'digital',
    music_id: '',
    votes: '1',
    play_count: '0',
    recommend_count: '1',
  }
}

function createSongForm(song: Song): SongFormState {
  return {
    title: song.title,
    artist: song.artist,
    era: song.era,
    music_id: song.music_id ?? '',
    votes: String(song.votes),
    play_count: String(song.play_count),
    recommend_count: String(song.recommend_count),
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', { hour12: false })
}

function formatBytes(value: number | null | undefined): string {
  if (!value || value <= 0) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function getMusicLabel(record: GeneratedMusic): string {
  const prompt = record.prompt?.trim() || record.minio_object_name.split('/').pop() || record.id
  return prompt
}

function getMusicStatusLabel(status: string): string {
  return musicStatusLabelMap[status.toLowerCase()] ?? status
}

function parseCounter(value: string, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`${label}必须是非负整数`)
  }
  return parsed
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('songs')
  const [adminTheme, setAdminTheme] = useState<AdminTheme>(() => getInitialAdminTheme())
  const [songs, setSongs] = useState<Song[]>([])
  const [musicList, setMusicList] = useState<GeneratedMusic[]>([])
  const [selectedSongId, setSelectedSongId] = useState('')
  const [songForm, setSongForm] = useState<SongFormState>(() => createEmptySongForm())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadInputKey, setUploadInputKey] = useState(0)
  const [songAudioFile, setSongAudioFile] = useState<File | null>(null)
  const [songAudioInputKey, setSongAudioInputKey] = useState(0)
  const [eraFilter, setEraFilter] = useState<EraFilter>('all')
  const [audioFilter, setAudioFilter] = useState<AudioFilter>('all')
  const [songSortKey, setSongSortKey] = useState<SongSortKey>('created')
  const [musicQuery, setMusicQuery] = useState('')
  const [songDialogOpen, setSongDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [musicDeleteTarget, setMusicDeleteTarget] = useState<GeneratedMusic | null>(null)

  const musicById = useMemo(() => new Map(musicList.map((record) => [record.id, record])), [musicList])
  const selectedSong = useMemo(() => songs.find((song) => song.id === selectedSongId) ?? null, [selectedSongId, songs])
  const selectedMusic = songForm.music_id ? musicById.get(songForm.music_id) ?? null : null

  const filteredSongs = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return songs
      .filter((song) => {
        if (eraFilter !== 'all' && song.era !== eraFilter) return false
        if (audioFilter === 'linked' && !song.music_id) return false
        if (audioFilter === 'unlinked' && song.music_id) return false
        if (!keyword) return true
        return [song.title, song.artist, song.era, song.id, song.music_id ?? '']
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
      .sort((a, b) => {
        if (songSortKey === 'score') return calcScore(b) - calcScore(a)
        if (songSortKey === 'title') return a.title.localeCompare(b.title, 'zh-CN')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [audioFilter, eraFilter, query, songSortKey, songs])

  const filteredMusicList = useMemo(() => {
    const keyword = musicQuery.trim().toLowerCase()
    if (!keyword) return musicList
    return musicList.filter((record) => {
      return [record.prompt, record.model, record.status, record.id, record.minio_object_name, record.content_type ?? '']
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [musicList, musicQuery])

  const selectedSongScore = selectedSong ? calcScore(selectedSong) : 0
  const linkedSongsForDeleteTarget = useMemo(() => {
    if (!musicDeleteTarget) return []
    return songs.filter((song) => song.music_id === musicDeleteTarget.id)
  }, [musicDeleteTarget, songs])

  const musicSelectOptions = useMemo<AdminSelectOption[]>(() => {
    return [
      { value: '', label: '不关联源文件' },
      ...musicList.map((record) => ({ value: record.id, label: getMusicLabel(record) })),
    ]
  }, [musicList])

  const showToast = (text: string, kind: ToastKind = 'success') => {
    setToast({ text, kind })
  }

  const clearToast = () => {
    setToast(null)
  }

  const toggleAdminTheme = () => {
    setAdminTheme((theme) => theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('music-admin-theme', adminTheme)
    document.body.dataset.adminTheme = adminTheme
    return () => {
      delete document.body.dataset.adminTheme
    }
  }, [adminTheme])

  useEffect(() => {
    let active = true
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [nextSongs, nextMusic] = await Promise.all([fetchSongs(), fetchGeneratedMusic()])
        if (!active) return
        setSongs(nextSongs)
        setMusicList(nextMusic)
        const firstSong = nextSongs[0] ?? null
        setSelectedSongId(firstSong?.id ?? '')
        setSongForm(firstSong ? createSongForm(firstSong) : createEmptySongForm())
        clearToast()
      } catch (err: unknown) {
        if (active) showToast(getErrorMessage(err, '加载后台数据失败'), 'error')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitialData()
    return () => {
      active = false
    }
  }, [])

  const refreshData = async (preferredSongId = selectedSongId) => {
    setLoading(true)
    try {
      const [nextSongs, nextMusic] = await Promise.all([fetchSongs(), fetchGeneratedMusic()])
      setSongs(nextSongs)
      setMusicList(nextMusic)
      const nextSelected = nextSongs.find((song) => song.id === preferredSongId) ?? nextSongs[0] ?? null
      setSelectedSongId(nextSelected?.id ?? '')
      setSongForm(nextSelected ? createSongForm(nextSelected) : createEmptySongForm())
      clearToast()
    } catch (err: unknown) {
      showToast(getErrorMessage(err, '刷新后台数据失败'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectSong = (song: Song) => {
    setSelectedSongId(song.id)
    setSongForm(createSongForm(song))
    setSongAudioFile(null)
    setSongAudioInputKey((key) => key + 1)
    setSongDialogOpen(true)
    clearToast()
  }

  const startCreateSong = () => {
    setSelectedSongId('')
    setSongForm(createEmptySongForm())
    setSongAudioFile(null)
    setSongAudioInputKey((key) => key + 1)
    setActiveTab('songs')
    setSongDialogOpen(true)
    clearToast()
  }

  const openUploadDialog = () => {
    setUploadDialogOpen(true)
    clearToast()
  }

  const closeSongDialog = () => {
    if (saving) return
    setDeleteDialogOpen(false)
    setSongDialogOpen(false)
  }

  const openDeleteDialog = () => {
    if (!selectedSong || saving || uploading) return
    setDeleteDialogOpen(true)
    clearToast()
  }

  const closeDeleteDialog = () => {
    if (saving) return
    setDeleteDialogOpen(false)
  }

  const closeUploadDialog = () => {
    if (uploading) return
    setUploadDialogOpen(false)
  }

  const openMusicDeleteDialog = (record: GeneratedMusic) => {
    if (saving || uploading) return
    setMusicDeleteTarget(record)
    clearToast()
  }

  const closeMusicDeleteDialog = () => {
    if (saving) return
    setMusicDeleteTarget(null)
  }

  const updateSongField = (key: keyof SongFormState, value: string) => {
    setSongForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'music_id' && value) {
      setSongAudioFile(null)
      setSongAudioInputKey((inputKey) => inputKey + 1)
    }
    clearToast()
  }

  const handleSongAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSongAudioFile(file)
    if (file) setSongForm((prev) => ({ ...prev, music_id: '' }))
    clearToast()
  }

  const handleSaveSong = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const title = songForm.title.trim()
    if (!title) {
      showToast('请输入歌曲名称', 'error')
      return
    }

    setSaving(true)
    clearToast()
    try {
      let musicId = songForm.music_id || null
      let uploadedMusicId: string | null = null
      if (songAudioFile) {
        const audioTitle = songAudioFile.name.replace(/\.[^/.]+$/, '') || songAudioFile.name
        const uploaded = await uploadSourceAudio(songAudioFile, audioTitle)
        musicId = uploaded.id
        uploadedMusicId = uploaded.id
        setSongForm((prev) => ({ ...prev, music_id: uploaded.id }))
      }

      const payload = {
        title,
        artist: songForm.artist.trim() || null,
        era: songForm.era,
        music_id: musicId,
        votes: parseCounter(songForm.votes, '投票数'),
        play_count: parseCounter(songForm.play_count, '播放数'),
        recommend_count: parseCounter(songForm.recommend_count, '推荐数'),
      }

      let savedSong: Song
      let successText = ''
      if (selectedSongId) {
        savedSong = await updateSong(selectedSongId, payload)
        successText = '歌曲信息已保存'
      } else {
        const createdSong = await insertSong({
          title: payload.title,
          artist: payload.artist ?? undefined,
          era: payload.era,
          music_id: payload.music_id ?? undefined,
        })
        const needsMetricUpdate = payload.votes !== 1 || payload.play_count !== 0 || payload.recommend_count !== 1
        savedSong = needsMetricUpdate
          ? await updateSong(createdSong.id, {
              music_id: payload.music_id,
              votes: payload.votes,
              play_count: payload.play_count,
              recommend_count: payload.recommend_count,
            })
          : createdSong
        successText = '新歌曲已创建'
      }

      if (uploadedMusicId && savedSong.music_id !== uploadedMusicId) {
        savedSong = await updateSong(savedSong.id, { music_id: uploadedMusicId })
      }

      await refreshData(savedSong.id)
      setSongAudioFile(null)
      setSongAudioInputKey((key) => key + 1)
      setSongDialogOpen(false)
      showToast(successText)
    } catch (err: unknown) {
      showToast(getErrorMessage(err, '保存歌曲失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteSong = async () => {
    if (!selectedSong) return

    setSaving(true)
    clearToast()
    try {
      await deleteSong(selectedSong.id)
      await refreshData('')
      setDeleteDialogOpen(false)
      setSongDialogOpen(false)
      showToast('歌曲已删除')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, '删除歌曲失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteMusic = async () => {
    if (!musicDeleteTarget) return

    setSaving(true)
    clearToast()
    try {
      await deleteGeneratedMusic(musicDeleteTarget.id)
      await refreshData(selectedSongId)
      setMusicDeleteTarget(null)
      showToast('源文件资产已删除')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, '删除源文件资产失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadFile(event.target.files?.[0] ?? null)
    clearToast()
  }

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (uploading) return

    if (!uploadFile) {
      showToast('请选择要上传的音频源文件', 'error')
      return
    }

    setUploading(true)
    clearToast()
    try {
      const title = uploadFile.name.replace(/\.[^/.]+$/, '') || uploadFile.name
      await uploadSourceAudio(uploadFile, title)

      setUploadFile(null)
      setUploadInputKey((key) => key + 1)
      await refreshData(selectedSongId)
      setUploadDialogOpen(false)
      showToast('源文件已上传到音乐素材库')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, '上传源文件失败'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const copyText = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text)
    showToast(`${label}已复制`)
  }

  return (
    <main className="admin-shell" data-admin-theme={adminTheme}>
      <aside className="admin-sidebar">
        <nav className="admin-nav" aria-label="后台模块">
          <button type="button" title="歌曲信息管理" aria-label="歌曲信息管理" className={activeTab === 'songs' ? 'admin-nav-active' : ''} onClick={() => setActiveTab('songs')}>
            <span aria-hidden="true">♫</span>
          </button>
          <button type="button" title="源文件素材库" aria-label="源文件素材库" className={activeTab === 'music' ? 'admin-nav-active' : ''} onClick={() => setActiveTab('music')}>
            <span className="admin-icon-library" aria-hidden="true" />
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" title="返回大屏" aria-label="返回大屏" onClick={() => window.location.assign(window.location.pathname)}>
            <span className="admin-icon-screen" aria-hidden="true" />
          </button>
          <button type="button" title="移动端入口" aria-label="移动端入口" onClick={() => window.location.assign('?mode=home')}>
            <span className="admin-icon-phone" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>管理控制台</p>
            <h2>{activeTab === 'songs' ? '歌曲、作者与榜单数据' : '上传音频与源文件管理'}</h2>
          </div>
          <div className="admin-header-actions">
            <button type="button" onClick={toggleAdminTheme}>
              {adminTheme === 'dark' ? '浅色调' : '深色调'}
            </button>
            <button type="button" onClick={() => void refreshData()} disabled={loading || saving || uploading}>
              {loading ? '刷新中' : '刷新数据'}
            </button>
            <button type="button" onClick={openUploadDialog} disabled={saving || uploading}>
              上传源文件
            </button>
            <button type="button" className="admin-primary-btn" onClick={startCreateSong}>
              新增歌曲
            </button>
          </div>
        </header>

        {toast && (
          <div className={`admin-toast admin-toast-${toast.kind}`} role="status">
            <span>{toast.text}</span>
            <button type="button" onClick={clearToast} aria-label="关闭提示">×</button>
          </div>
        )}

        {activeTab === 'songs' ? (
          <div className="admin-content-grid admin-content-grid-single">
            <section className="admin-panel admin-song-panel">
              <div className="admin-panel-head">
                <div>
                  <h3>歌曲列表</h3>
                  <span>{filteredSongs.length} / {songs.length} 首 · 点击歌曲弹窗编辑</span>
                </div>
                <div className="admin-toolbar">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索歌曲、作者、编号"
                    autoComplete="off"
                  />
                  <AdminSelect value={eraFilter} options={eraFilterOptions} onChange={(value) => setEraFilter(value as EraFilter)} />
                  <AdminSelect value={audioFilter} options={audioFilterOptions} onChange={(value) => setAudioFilter(value as AudioFilter)} />
                  <AdminSelect value={songSortKey} options={songSortOptions} onChange={(value) => setSongSortKey(value as SongSortKey)} />
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-song-table">
                  <thead>
                    <tr>
                      <th>歌曲</th>
                      <th>作者</th>
                      <th>年代</th>
                      <th>热度</th>
                      <th>源文件</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSongs.map((song) => (
                      <tr
                        key={song.id}
                        className={song.id === selectedSongId ? 'admin-row-selected' : ''}
                        onClick={() => selectSong(song)}
                      >
                        <td>
                          <strong>{song.title}</strong>
                          <span>{song.id}</span>
                        </td>
                        <td>{song.artist}</td>
                        <td><em className={`admin-era-pill admin-era-${song.era}`}>{eraLabelMap[song.era]}</em></td>
                        <td>
                          <strong className="admin-score-cell">{calcScore(song)}</strong>
                          <span>{song.votes} 票 · {song.play_count} 播放 · {song.recommend_count} 推荐</span>
                        </td>
                        <td>
                          <em className={`admin-audio-status ${song.music_id ? 'admin-audio-linked' : 'admin-audio-unlinked'}`}>
                            {song.music_id ? '已关联' : '未关联'}
                          </em>
                        </td>
                        <td>{formatDate(song.created_at)}</td>
                      </tr>
                    ))}
                    {!filteredSongs.length && (
                      <tr>
                        <td colSpan={6} className="admin-empty-cell">暂无匹配歌曲</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        ) : (
          <section className="admin-panel admin-library-panel">
            <div className="admin-panel-head">
              <div>
                <h3>源文件素材库</h3>
                <span>{filteredMusicList.length} / {musicList.length} 个可用音频文件</span>
              </div>
              <div className="admin-toolbar">
                <input
                  value={musicQuery}
                  onChange={(event) => setMusicQuery(event.target.value)}
                  placeholder="搜索素材、模型、编号"
                  autoComplete="off"
                />
                <button type="button" onClick={() => setActiveTab('songs')}>去关联歌曲</button>
              </div>
            </div>

            <div className="admin-music-grid">
              {filteredMusicList.map((record) => (
                <article key={record.id} className="admin-music-card">
                  <div className="admin-music-card-head">
                    <div className="admin-music-icon" aria-hidden="true">♪</div>
                    <div className="admin-music-title">
                      <h4>{record.prompt || record.minio_object_name}</h4>
                    </div>
                    <em className={`admin-music-status admin-music-status-${record.status.toLowerCase()}`}>{getMusicStatusLabel(record.status)}</em>
                    <button type="button" onClick={() => copyText(record.id, '音乐编号')}>复制编号</button>
                    <button type="button" className="admin-danger-btn" onClick={() => openMusicDeleteDialog(record)} disabled={saving || uploading}>删除资产</button>
                  </div>
                  <audio controls preload="none" src={record.music_url} />
                  <dl>
                    <div><dt>◷ 文件大小</dt><dd>{formatBytes(record.file_size_bytes)}</dd></div>
                    <div><dt>＋ 创建时间</dt><dd>{formatDate(record.created_at)}</dd></div>
                  </dl>
                </article>
              ))}
              {!filteredMusicList.length && <div className="admin-empty-library">{musicList.length ? '没有匹配的源文件素材' : '暂无源文件，请先上传音频。'}</div>}
            </div>
          </section>
        )}
      </section>

      {songDialogOpen && (
        <div className="admin-modal-backdrop" onMouseDown={closeSongDialog}>
          <section
            className="admin-modal admin-song-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-song-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <p>歌曲详情</p>
                <h3 id="admin-song-dialog-title">{selectedSongId ? '编辑歌曲' : '新增歌曲'}</h3>
                <span>{selectedSongId || '保存后同步到大屏榜单'}</span>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeSongDialog} disabled={saving}>
                关闭
              </button>
            </div>

            {selectedSong && (
              <div className="admin-editor-summary">
                <div>
                  <span>当前热度</span>
                  <strong>{selectedSongScore}</strong>
                </div>
                <div>
                  <span>源文件</span>
                  <strong>{selectedSong.music_id ? '已关联' : '未关联'}</strong>
                </div>
                <div>
                  <span>创建时间</span>
                  <strong>{formatDate(selectedSong.created_at)}</strong>
                </div>
              </div>
            )}

            <form className="admin-form admin-modal-form" onSubmit={handleSaveSong}>
              <label>
                <span>歌曲名称</span>
                <input value={songForm.title} onChange={(event) => updateSongField('title', event.target.value)} placeholder="请输入歌曲名称" />
              </label>
              <label>
                <span>作者 / 歌手</span>
                <input value={songForm.artist} onChange={(event) => updateSongField('artist', event.target.value)} placeholder="请输入作者或歌手" />
              </label>
              <div className="admin-upload-row">
                <label>
                  <span>年代分类</span>
                  <AdminSelect value={songForm.era} options={eraOptions} onChange={(value) => updateSongField('era', value as Era)} />
                </label>
                <label>
                  <span>关联源文件</span>
                  <AdminSelect value={songForm.music_id} options={musicSelectOptions} onChange={(value) => updateSongField('music_id', value)} />
                </label>
              </div>

              <div className="admin-inline-upload">
                <div>
                  <strong>或上传新的源文件</strong>
                  <span>保存歌曲时会先上传音频，并自动关联到这首歌曲。</span>
                </div>
                <label className="admin-file-control">
                  <span>{songAudioFile ? songAudioFile.name : '选择新音频并关联'}</span>
                  <input key={songAudioInputKey} type="file" accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/*" onChange={handleSongAudioFileChange} />
                </label>
                {songAudioFile && (
                  <button type="button" onClick={() => {
                    setSongAudioFile(null)
                    setSongAudioInputKey((key) => key + 1)
                  }}>
                    取消新上传
                  </button>
                )}
              </div>

              <div className="admin-metric-row">
                <label>
                  <span>投票数</span>
                  <input type="number" min="0" step="1" value={songForm.votes} onChange={(event) => updateSongField('votes', event.target.value)} />
                </label>
                <label>
                  <span>播放数</span>
                  <input type="number" min="0" step="1" value={songForm.play_count} onChange={(event) => updateSongField('play_count', event.target.value)} />
                </label>
                <label>
                  <span>推荐数</span>
                  <input type="number" min="0" step="1" value={songForm.recommend_count} onChange={(event) => updateSongField('recommend_count', event.target.value)} />
                </label>
              </div>

              {selectedMusic && (
                <div className="admin-linked-audio">
                  <div>
                    <strong>{getMusicLabel(selectedMusic)}</strong>
                    <span>{formatBytes(selectedMusic.file_size_bytes)} · 音频文件</span>
                  </div>
                  <audio controls preload="none" src={selectedMusic.music_url} />
                </div>
              )}

              <div className="admin-form-actions">
                {selectedSongId && (
                  <button type="button" className="admin-danger-btn" onClick={openDeleteDialog} disabled={saving || uploading}>
                    删除歌曲
                  </button>
                )}
                <button type="button" onClick={closeSongDialog} disabled={saving}>
                  取消
                </button>
                <button type="submit" className="admin-primary-btn" disabled={saving || uploading}>
                  {saving ? '保存中' : selectedSongId ? '保存修改' : '创建歌曲'}
                </button>
              </div>
            </form>
          </section>
          {deleteDialogOpen && selectedSong && (
            <div className="admin-confirm-backdrop" onMouseDown={closeDeleteDialog}>
              <section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title" onMouseDown={(event) => event.stopPropagation()}>
                <div className="admin-confirm-icon">!</div>
                <div>
                  <h4 id="admin-delete-title">确认删除歌曲？</h4>
                  <p>将删除「{selectedSong.title}」，并同步影响大屏榜单。此操作不可撤销。</p>
                </div>
                <div className="admin-confirm-actions">
                  <button type="button" onClick={closeDeleteDialog} disabled={saving}>取消</button>
                  <button type="button" className="admin-danger-btn" onClick={() => void confirmDeleteSong()} disabled={saving}>
                    {saving ? '删除中' : '确认删除'}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {uploadDialogOpen && (
        <div className="admin-modal-backdrop" onMouseDown={closeUploadDialog}>
          <section
            className="admin-modal admin-upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-upload-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <p>源文件上传</p>
                <h3 id="admin-upload-dialog-title">上传源文件</h3>
                <span>只负责保存音频文件；素材标题会使用文件名</span>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeUploadDialog} disabled={uploading}>
                关闭
              </button>
            </div>

            <form className="admin-form admin-modal-form" onSubmit={handleUpload}>
              <label className="admin-file-control">
                <span>{uploadFile ? uploadFile.name : '选择音频源文件'}</span>
                <input key={uploadInputKey} type="file" accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/*" onChange={handleUploadFileChange} />
              </label>
              <div className="admin-upload-helper">
                上传后只进入源文件素材库，不自动创建或关联歌曲；歌曲标题、作者、年代请在新增歌曲弹窗里填写。
              </div>
              <div className="admin-form-actions">
                <button type="button" onClick={closeUploadDialog} disabled={uploading}>
                  取消
                </button>
                <button type="submit" className="admin-primary-btn" disabled={uploading || saving}>
                  {uploading ? '上传中' : '上传源文件'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {musicDeleteTarget && (
        <div className="admin-confirm-backdrop" onMouseDown={closeMusicDeleteDialog}>
          <section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-music-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-confirm-icon">!</div>
            <div>
              <h4 id="admin-delete-music-title">确认删除源文件资产？</h4>
              <p>将从素材库中移除「{getMusicLabel(musicDeleteTarget)}」。</p>
              {linkedSongsForDeleteTarget.length > 0 && (
                <div className="admin-confirm-warning">
                  <strong>已有 {linkedSongsForDeleteTarget.length} 首歌曲关联该资产，删除后这些歌曲的关联也会被解除。</strong>
                  <span>{linkedSongsForDeleteTarget.map((song) => song.title).join('、')}</span>
                </div>
              )}
            </div>
            <div className="admin-confirm-actions">
              <button type="button" onClick={closeMusicDeleteDialog} disabled={saving}>取消</button>
              <button type="button" className="admin-danger-btn" onClick={() => void confirmDeleteMusic()} disabled={saving}>
                {saving ? '删除中' : '确认删除'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
