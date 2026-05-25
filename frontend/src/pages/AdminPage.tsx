import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { fetchGeneratedMusic, uploadSourceAudio } from '../lib/music'
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
type UploadMode = 'only' | 'link' | 'create'

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
  return `${prompt} · ${record.model}`
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
  const [songs, setSongs] = useState<Song[]>([])
  const [musicList, setMusicList] = useState<GeneratedMusic[]>([])
  const [selectedSongId, setSelectedSongId] = useState('')
  const [songForm, setSongForm] = useState<SongFormState>(() => createEmptySongForm())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadArtist, setUploadArtist] = useState('')
  const [uploadEra, setUploadEra] = useState<Era>('digital')
  const [uploadMode, setUploadMode] = useState<UploadMode>('only')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadInputKey, setUploadInputKey] = useState(0)

  const musicById = useMemo(() => new Map(musicList.map((record) => [record.id, record])), [musicList])
  const selectedSong = useMemo(() => songs.find((song) => song.id === selectedSongId) ?? null, [selectedSongId, songs])
  const selectedMusic = songForm.music_id ? musicById.get(songForm.music_id) ?? null : null

  const filteredSongs = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return songs
    return songs.filter((song) => {
      return [song.title, song.artist, song.era, song.id, song.music_id ?? '']
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [query, songs])

  const stats = useMemo(() => {
    return {
      total: songs.length,
      ai: songs.filter((song) => song.era === 'ai').length,
      withAudio: songs.filter((song) => song.music_id).length,
      votes: songs.reduce((sum, song) => sum + song.votes, 0),
      score: songs.reduce((sum, song) => sum + calcScore(song), 0),
    }
  }, [songs])

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
        setError('')
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, '加载后台数据失败'))
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
      setError('')
    } catch (err: unknown) {
      setError(getErrorMessage(err, '刷新后台数据失败'))
    } finally {
      setLoading(false)
    }
  }

  const selectSong = (song: Song) => {
    setSelectedSongId(song.id)
    setSongForm(createSongForm(song))
    setMessage('')
    setError('')
  }

  const startCreateSong = () => {
    setSelectedSongId('')
    setSongForm(createEmptySongForm())
    setActiveTab('songs')
    setMessage('正在新增歌曲')
    setError('')
  }

  const updateSongField = (key: keyof SongFormState, value: string) => {
    setSongForm((prev) => ({ ...prev, [key]: value }))
    if (message) setMessage('')
    if (error) setError('')
  }

  const handleSaveSong = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const title = songForm.title.trim()
    if (!title) {
      setError('请输入歌曲名称')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title,
        artist: songForm.artist.trim() || null,
        era: songForm.era,
        music_id: songForm.music_id || null,
        votes: parseCounter(songForm.votes, '投票数'),
        play_count: parseCounter(songForm.play_count, '播放数'),
        recommend_count: parseCounter(songForm.recommend_count, '推荐数'),
      }

      let savedSong: Song
      if (selectedSongId) {
        savedSong = await updateSong(selectedSongId, payload)
        setMessage('歌曲信息已保存')
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
              votes: payload.votes,
              play_count: payload.play_count,
              recommend_count: payload.recommend_count,
            })
          : createdSong
        setMessage('新歌曲已创建')
      }

      await refreshData(savedSong.id)
    } catch (err: unknown) {
      setError(getErrorMessage(err, '保存歌曲失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSong = async () => {
    if (!selectedSong) return
    const confirmed = window.confirm(`确认删除歌曲「${selectedSong.title}」吗？此操作会同步影响大屏榜单。`)
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSong(selectedSong.id)
      setMessage('歌曲已删除')
      await refreshData('')
    } catch (err: unknown) {
      setError(getErrorMessage(err, '删除歌曲失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadFile(event.target.files?.[0] ?? null)
    if (message) setMessage('')
    if (error) setError('')
  }

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (uploading) return

    const title = uploadTitle.trim()
    const artist = uploadArtist.trim()
    if (!title) {
      setError('请输入源文件标题')
      return
    }
    if (!uploadFile) {
      setError('请选择要上传的音频源文件')
      return
    }
    if (uploadMode === 'link' && !selectedSongId) {
      setError('请先选择要关联的歌曲')
      return
    }

    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadSourceAudio(uploadFile, title, artist || undefined)
      let preferredSongId = selectedSongId
      if (uploadMode === 'link') {
        const linkedSong = await updateSong(selectedSongId, { music_id: uploaded.id })
        preferredSongId = linkedSong.id
        setMessage('源文件已上传并关联到当前歌曲')
      } else if (uploadMode === 'create') {
        const createdSong = await insertSong({
          title,
          artist: artist || undefined,
          era: uploadEra,
          music_id: uploaded.id,
        })
        preferredSongId = createdSong.id
        setMessage('源文件已上传，并已创建歌曲')
      } else {
        setMessage('源文件已上传到音乐素材库')
      }

      setUploadFile(null)
      setUploadInputKey((key) => key + 1)
      await refreshData(preferredSongId)
    } catch (err: unknown) {
      setError(getErrorMessage(err, '上传源文件失败'))
    } finally {
      setUploading(false)
    }
  }

  const copyText = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text)
    setMessage(`${label}已复制`)
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">MS</span>
          <div>
            <p>Music Screen</p>
            <h1>后台管理</h1>
          </div>
        </div>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>歌曲总数</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="admin-stat-card">
            <span>已关联源文件</span>
            <strong>{stats.withAudio}</strong>
          </div>
          <div className="admin-stat-card">
            <span>AI 歌曲</span>
            <strong>{stats.ai}</strong>
          </div>
          <div className="admin-stat-card">
            <span>总热度</span>
            <strong>{stats.score}</strong>
          </div>
        </div>

        <nav className="admin-nav" aria-label="后台模块">
          <button type="button" className={activeTab === 'songs' ? 'admin-nav-active' : ''} onClick={() => setActiveTab('songs')}>
            歌曲信息管理
          </button>
          <button type="button" className={activeTab === 'music' ? 'admin-nav-active' : ''} onClick={() => setActiveTab('music')}>
            源文件素材库
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={() => window.location.assign(window.location.pathname)}>
            返回大屏
          </button>
          <button type="button" onClick={() => window.location.assign('?mode=home')}>
            移动端入口
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>PC ADMIN CONSOLE</p>
            <h2>{activeTab === 'songs' ? '歌曲、作者与榜单数据' : '上传音频与源文件管理'}</h2>
          </div>
          <div className="admin-header-actions">
            <button type="button" onClick={() => void refreshData()} disabled={loading || saving || uploading}>
              {loading ? '刷新中' : '刷新数据'}
            </button>
            <button type="button" className="admin-primary-btn" onClick={startCreateSong}>
              新增歌曲
            </button>
          </div>
        </header>

        {(message || error) && (
          <div className={`admin-alert ${error ? 'admin-alert-error' : ''}`} role="status">
            {error || message}
          </div>
        )}

        {activeTab === 'songs' ? (
          <div className="admin-content-grid">
            <section className="admin-panel admin-song-panel">
              <div className="admin-panel-head">
                <div>
                  <h3>歌曲列表</h3>
                  <span>{filteredSongs.length} / {songs.length} 首</span>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索歌曲、作者、ID"
                  autoComplete="off"
                />
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
                        <td>{calcScore(song)}</td>
                        <td>{song.music_id ? '已关联' : '未关联'}</td>
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

            <aside className="admin-editor-stack">
              <section className="admin-panel admin-editor-panel">
                <div className="admin-panel-head">
                  <div>
                    <h3>{selectedSongId ? '编辑歌曲' : '新增歌曲'}</h3>
                    <span>{selectedSongId || '保存后同步到大屏'}</span>
                  </div>
                </div>

                <form className="admin-form" onSubmit={handleSaveSong}>
                  <label>
                    <span>歌曲名称</span>
                    <input value={songForm.title} onChange={(event) => updateSongField('title', event.target.value)} placeholder="请输入歌曲名称" />
                  </label>
                  <label>
                    <span>作者 / 歌手</span>
                    <input value={songForm.artist} onChange={(event) => updateSongField('artist', event.target.value)} placeholder="请输入作者或歌手" />
                  </label>
                  <label>
                    <span>年代分类</span>
                    <select value={songForm.era} onChange={(event) => updateSongField('era', event.target.value as Era)}>
                      {eraOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>关联源文件</span>
                    <select value={songForm.music_id} onChange={(event) => updateSongField('music_id', event.target.value)}>
                      <option value="">不关联源文件</option>
                      {musicList.map((record) => <option key={record.id} value={record.id}>{getMusicLabel(record)}</option>)}
                    </select>
                  </label>

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
                        <span>{formatBytes(selectedMusic.file_size_bytes)} · {selectedMusic.content_type || 'audio'}</span>
                      </div>
                      <audio controls preload="none" src={selectedMusic.music_url} />
                    </div>
                  )}

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-primary-btn" disabled={saving || uploading}>
                      {saving ? '保存中' : selectedSongId ? '保存修改' : '创建歌曲'}
                    </button>
                    {selectedSongId && (
                      <button type="button" className="admin-danger-btn" onClick={() => void handleDeleteSong()} disabled={saving || uploading}>
                        删除歌曲
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="admin-panel admin-upload-panel">
                <div className="admin-panel-head">
                  <div>
                    <h3>上传源文件</h3>
                    <span>支持 mp3、wav、m4a、flac、aac、ogg</span>
                  </div>
                </div>

                <form className="admin-form" onSubmit={handleUpload}>
                  <label>
                    <span>源文件标题</span>
                    <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="请输入音频标题" />
                  </label>
                  <label>
                    <span>作者 / 歌手</span>
                    <input value={uploadArtist} onChange={(event) => setUploadArtist(event.target.value)} placeholder="可选" />
                  </label>
                  <div className="admin-upload-row">
                    <label>
                      <span>创建分类</span>
                      <select value={uploadEra} onChange={(event) => setUploadEra(event.target.value as Era)}>
                        {eraOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>上传后操作</span>
                      <select value={uploadMode} onChange={(event) => setUploadMode(event.target.value as UploadMode)}>
                        <option value="only">仅上传到素材库</option>
                        <option value="link" disabled={!selectedSongId}>关联当前歌曲</option>
                        <option value="create">创建为新歌曲</option>
                      </select>
                    </label>
                  </div>
                  <label className="admin-file-control">
                    <span>{uploadFile ? uploadFile.name : '选择音频源文件'}</span>
                    <input key={uploadInputKey} type="file" accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/*" onChange={handleUploadFileChange} />
                  </label>
                  <button type="submit" className="admin-primary-btn" disabled={uploading || saving}>
                    {uploading ? '上传中' : '上传源文件'}
                  </button>
                </form>
              </section>
            </aside>
          </div>
        ) : (
          <section className="admin-panel admin-library-panel">
            <div className="admin-panel-head">
              <div>
                <h3>源文件素材库</h3>
                <span>{musicList.length} 个可用音频文件</span>
              </div>
              <button type="button" onClick={() => setActiveTab('songs')}>去关联歌曲</button>
            </div>

            <div className="admin-music-grid">
              {musicList.map((record) => (
                <article key={record.id} className="admin-music-card">
                  <div className="admin-music-card-head">
                    <div>
                      <h4>{record.prompt}</h4>
                      <span>{record.model} · {record.status}</span>
                    </div>
                    <button type="button" onClick={() => copyText(record.id, '音乐 ID')}>复制 ID</button>
                  </div>
                  <audio controls preload="none" src={record.music_url} />
                  <dl>
                    <div><dt>文件大小</dt><dd>{formatBytes(record.file_size_bytes)}</dd></div>
                    <div><dt>文件类型</dt><dd>{record.content_type || '--'}</dd></div>
                    <div><dt>对象路径</dt><dd>{record.minio_object_name}</dd></div>
                    <div><dt>创建时间</dt><dd>{formatDate(record.created_at)}</dd></div>
                    <div><dt>过期时间</dt><dd>{formatDate(record.expires_at)}</dd></div>
                  </dl>
                </article>
              ))}
              {!musicList.length && <div className="admin-empty-library">暂无源文件，请先上传音频。</div>}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
