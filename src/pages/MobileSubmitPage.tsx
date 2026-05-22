import { useState } from 'react'
import { insertSong as persistSong } from '../lib/songs'
import EraIcon from '../components/EraIcon'

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
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#05030d] px-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.2),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-[0_0_50px_rgba(34,211,238,0.25)]">
            <span className="animate-bounce text-5xl">✨</span>
            <div className="absolute inset-0 animate-ping rounded-full border border-pink-400/20 opacity-40" />
          </div>

          <h1 className="bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-3xl font-black tracking-wider text-transparent">
            投稿成功!
          </h1>
          <p className="mt-3 text-base tracking-wide text-white/60">
            大功告成！正在出现在现场大屏榜单上
          </p>

          <button
            type="button"
            className="mt-10 rounded-full border border-cyan-300/30 bg-gradient-to-b from-cyan-950/40 to-cyan-900/60 px-10 py-3.5 text-sm font-bold text-cyan-200 shadow-[0_15px_35px_rgba(6,182,212,0.15)] transition-all duration-300 active:scale-95"
            onClick={() => {
              setTitle('')
              setArtist('')
              setYear('')
              setStage('form')
            }}
          >
            继续投稿歌曲
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#05030d] font-sans antialiased">
      {/* 宇宙霓虹背景：固定在视口，不随滚动移动 */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(190,139,255,0.25),transparent_60%),radial-gradient(circle_at_10%_30%,rgba(41,227,225,0.12),transparent_40%),radial-gradient(circle_at_90%_70%,rgba(244,114,182,0.1),transparent_40%)]" />

      <div
        className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-5 sm:gap-6 sm:px-5 sm:pt-7"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
        }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl shadow-[0_15px_45px_rgba(190,139,255,0.15)] backdrop-blur-md">
            🎵
          </div>
          <h1 className="bg-gradient-to-r from-white via-white/90 to-white/75 bg-clip-text text-2xl font-black tracking-wide text-transparent">
            投稿歌曲
          </h1>
          <p className="mt-1 text-xs tracking-wide text-white/45">
            推荐心仪之作，即刻闪耀于现场大屏
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="relative p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-x-0 -top-4 bottom-0 rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_32px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl" />
          <form onSubmit={handleSubmit} className="relative space-y-5 pl-2">
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
            <div className="space-y-2">
              <label className="block text-sm font-bold tracking-wide text-white/55">
                音乐纪元 / 年代
              </label>
              <div className="grid grid-cols-2 gap-2">
                {eraOptions.map((o) => {
                  const isSelected = era === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setEra(o.value)}
                      className={`flex min-h-12 min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-xs font-bold transition-all duration-200 active:scale-[0.97] ${
                        isSelected
                          ? 'border-cyan-500/50 bg-white/10 text-white shadow-[0_0_24px_rgba(6,182,212,0.15)]'
                          : 'border-white/5 bg-white/[0.02] text-white/50'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-white shadow-[0_4px_12px_rgba(6,182,212,0.3)]'
                            : 'bg-white/[0.04]'
                        }`}
                      >
                        <EraIcon era={o.icon} size={26} />
                      </span>
                      <span className="min-w-0 flex-1 truncate tracking-wide">{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 错误提示 */}
            {errMsg && (
              <div className="animate-headShake flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-center text-xs font-semibold text-red-300">
                <span aria-hidden>⚠️</span>
                <span className="truncate">{errMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* 提交按钮 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={stage === 'submitting'}
          className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-base font-black tracking-widest text-white shadow-[0_15px_40px_rgba(6,182,212,0.3)] transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20 [animation:shimmer_2.5s_infinite]" />
          <span className="relative z-10">
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
    <div className="space-y-2">
      <label className="block text-sm font-bold tracking-wide text-white/55">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={type === 'number' ? 'numeric' : undefined}
        className="block h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-base text-white placeholder-white/25 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.02)] outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(6,182,212,0.08)]"
      />
    </div>
  )
}