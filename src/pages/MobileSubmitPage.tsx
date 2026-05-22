import { useState } from 'react'
import { insertSong as persistSong } from '../lib/songs'
import EraIcon from '../components/EraIcon'
import '../styles/mobile-pages.css'

// ==========================================
// 🛠 本地配置与数据定义 (解决外部文件无法解析的编译报错)
// ==========================================
export type Era = 'vinyl' | 'tape' | 'cd' | 'digital' | 'ai'

export interface EraOption {
  value: Era
  label: string
  icon: Era
}

export const eraOptions: EraOption[] = [
  { value: 'vinyl', label: '黑胶年代', icon: 'vinyl' },
  { value: 'tape', label: '磁带年代', icon: 'tape' },
  { value: 'cd', label: 'CD年代', icon: 'cd' },
  { value: 'digital', label: '数字年代', icon: 'digital' },
  { value: 'ai', label: 'AI共创', icon: 'ai' },
]

export function inferEraFromYear(year: number): Era {
  if (year < 1975) return 'vinyl'
  if (year <= 1989) return 'tape'
  if (year <= 2002) return 'cd'
  if (year <= 2023) return 'digital'
  return 'ai'
}

// 模拟异步数据提交
export const insertSong = async (song: { title: string; artist?: string; era: Era }) => {
  return persistSong(song)
}

// ==========================================
// 📱 页面组件实现
// ==========================================
type Stage = 'form' | 'submitting' | 'success'

export default function MobileSubmitPage() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const [era, setEra] = useState<Era>('digital')
  const [stage, setStage] = useState<Stage>('form')
  const [errMsg, setErrMsg] = useState('')

  const handleYearChange = (v: string) => {
    setYear(v)
    const n = Number(v)
    if (v.length === 4 && Number.isFinite(n)) {
      setEra(inferEraFromYear(n))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrMsg('请输入歌曲名')
      return
    }
    setErrMsg('')
    setStage('submitting')
    try {
      await insertSong({ title: title.trim(), artist: artist.trim() || undefined, era })
      setStage('success')
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : '提交失败')
      setStage('form')
    }
  }

  if (stage === 'success') {
    return (
      <div className="mobile-success-page">
        <div className="mobile-success-bg" />

        <div className="mobile-success-content">
          <div className="mobile-success-orb">
            <span className="mobile-success-emoji">✨</span>
            <div className="mobile-success-ping" />
          </div>

          <h1 className="mobile-success-title">
            投稿成功!
          </h1>
          <p className="mobile-success-text">
            大功告成！正在出现在现场大屏榜单上
          </p>

          <button
            type="button"
            className="mobile-secondary-button mobile-success-action"
            onClick={() => {
              setTitle('')
              setArtist('')
              setYear('')
              setStage('form')
            }}
          >
            继续投稿歌曲
          </button>
          <a
            href="?mode=vote"
            className="mobile-primary-link"
          >
            去投票推榜
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-page">
      {/* 宇宙霓虹背景：固定在视口，不随滚动移动 */}
      <div className="mobile-page-bg" />

      <div className="mobile-page-container">
        {/* Header */}
        <div className="mobile-page-header">
          <div className="mobile-page-header-icon">
            🎵
          </div>
          <h1 className="mobile-page-title">
            投稿歌曲
          </h1>
          <p className="mobile-page-subtitle">
            推荐心仪之作，即刻闪耀于现场大屏
          </p>
        </div>

        <div className="mobile-tabs">
          <a href="?mode=vote" className="mobile-tab">
            投票推榜
          </a>
          <a href="?mode=mobile" className="mobile-tab mobile-tab-active">
            投稿歌曲
          </a>
        </div>

        {/* 表单卡片 */}
        <div className="mobile-submit-card">
          <div className="mobile-submit-card-bg" />
          <form onSubmit={handleSubmit} className="mobile-submit-form">
            <Field
              label="歌曲名 *"
              value={title}
              onChange={setTitle}
              placeholder="请输入您推荐的歌曲名称"
              required
            />

            <Field
              label="艺术家 / 歌手"
              value={artist}
              onChange={setArtist}
              placeholder="歌手、组合或原作者"
            />

            <Field
              label="发行年份 (自动推导年代)"
              value={year}
              onChange={handleYearChange}
              placeholder="例如 1997"
              type="number"
            />

            {/* 年代选择 */}
            <div className="mobile-era-field">
              <label className="mobile-field-label">
                音乐纪元 / 年代
              </label>
              <div className="mobile-era-grid">
                {eraOptions.map((o) => {
                  const isSelected = era === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setEra(o.value)}
                      className={`mobile-era-option${isSelected ? ' mobile-era-option-selected' : ''}`}
                    >
                      <span
                        className={`mobile-era-icon${isSelected ? ' mobile-era-icon-selected' : ''}`}
                      >
                        <EraIcon era={o.icon} size={26} />
                      </span>
                      <span className="mobile-era-label">{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 错误提示 */}
            {errMsg && (
              <div className="mobile-error-bar">
                <span aria-hidden>⚠️</span>
                <span className="mobile-error-text">{errMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* 提交按钮 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={stage === 'submitting'}
          className="mobile-submit-button"
        >
          <span className="mobile-submit-button-shimmer" />
          <span className="mobile-submit-button-label">
            {stage === 'submitting' ? '正在连接大屏...' : '立即提交投稿'}
          </span>
        </button>
      </div>
    </div>
  )
}

// 统一的输入框子组件
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <div className="mobile-field">
      <label className="mobile-field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={type === 'number' ? 'numeric' : undefined}
        className="mobile-input"
      />
    </div>
  )
}