import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import EraIcon from '../components/EraIcon'
import InlineSvg from '../components/InlineSvg'
import SubmitTopRecord from '../components/SubmitTopRecord'
import { eraConfig } from '../lib/eraConfig'
import { insertSong } from '../lib/songs'
import { decorateMobileSubmitBaseSvg } from '../lib/mobileSvgFloat'
import type { Era } from '../types/song'
import submitBaseSvg from '../svg/mobile-submit/SubmitBase.svg?raw'
import eraOptionSelectedUrl from '../svg/mobile-submit/EraOptionSelected.svg'
import submitButtonActiveUrl from '../svg/mobile-submit/SubmitButtonActive.svg'
import '../styles/mobile-submit.css'

type Stage = 'form' | 'submitting' | 'success'

type SubmitEraOption = {
  value: Era
  name: string
  years: string
}

const submitEraOptions: SubmitEraOption[] = [
  { value: 'vinyl', name: '黑胶', years: '1970' },
  { value: 'cd', name: 'CD', years: '1990' },
  { value: 'tape', name: '磁带', years: '1980' },
  { value: 'digital', name: '数字', years: '2000' },
]

const floatingSubmitBaseSvg = decorateMobileSubmitBaseSvg(submitBaseSvg)

function useFitToWidth(designWidth: number) {
  const [scale, setScale] = useState(() => {
    if (typeof window === 'undefined') return 1
    return Math.min(1.6, window.innerWidth / designWidth)
  })

  useEffect(() => {
    const update = () => setScale(Math.min(1.6, window.innerWidth / designWidth))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [designWidth])

  return scale
}

export default function MobileSubmitPage() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [era, setEra] = useState<Era | null>(null)
  const [stage, setStage] = useState<Stage>('form')
  const [errMsg, setErrMsg] = useState('')
  const scale = useFitToWidth(390)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setErrMsg('请输入歌曲名')
      setStage('form')
      return
    }

    if (!era) {
      setErrMsg('请选择歌曲年代')
      setStage('form')
      return
    }

    setErrMsg('')
    setStage('submitting')

    try {
      await insertSong({ title: title.trim(), artist: artist.trim() || undefined, era })
      setTitle('')
      setArtist('')
      setStage('success')
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : '提交失败')
      setStage('form')
    }
  }

  const handleTextChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    if (stage === 'success') setStage('form')
    if (errMsg) setErrMsg('')
  }

  const handleEraSelect = (value: Era) => {
    setEra(value)
    if (stage === 'success') setStage('form')
    if (errMsg) setErrMsg('')
  }

  const selectedEraLabel = era ? eraConfig[era].label : '选择年代'
  const feedback = errMsg || (stage === 'success' ? '投稿成功，歌曲正在同步到现场大屏' : '')
  const isSubmitActive = stage === 'submitting' || stage === 'success'

  return (
    <main className="ms-page">
      <div className="ms-scaler" style={{ height: 844 * scale }}>
        <div className="ms-canvas" style={{ transform: `scale(${scale})` }}>
          <InlineSvg html={floatingSubmitBaseSvg} className="ms-base mobile-floating-svg" />

          <button
            type="button"
            className="ms-back"
            aria-label="返回主页"
            onClick={() => window.location.assign('?mode=home')}
          />

          <h1 className="ms-title">上传歌曲</h1>

          {era && <SubmitTopRecord era={era} className="ms-top-icon" />}

          <div className="ms-era-pill-label">{selectedEraLabel}</div>

          <form className="ms-form" onSubmit={handleSubmit}>
            <label className="ms-field-label ms-field-label-title" htmlFor="mobile-submit-title">
              歌曲名称
            </label>
            <input
              id="mobile-submit-title"
              className="ms-input ms-input-title"
              value={title}
              onChange={(e) => handleTextChange(setTitle)(e.target.value)}
              placeholder="请输入歌曲名称"
              autoComplete="off"
            />

            <label className="ms-field-label ms-field-label-artist" htmlFor="mobile-submit-artist">
              歌手名称
            </label>
            <input
              id="mobile-submit-artist"
              className="ms-input ms-input-artist"
              value={artist}
              onChange={(e) => handleTextChange(setArtist)(e.target.value)}
              placeholder="请输入歌手或创作者"
              autoComplete="off"
            />

            <div className="ms-era-label">选择年代</div>

            {submitEraOptions.map((option) => {
              const isSelected = era === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className={
                    `ms-era-option ms-era-option-${option.value}` +
                    (isSelected ? ' ms-era-option-selected' : '')
                  }
                  onClick={() => handleEraSelect(option.value)}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <img src={eraOptionSelectedUrl} className="ms-era-option-bg" alt="" aria-hidden />
                  )}
                  <span className="ms-era-option-icon">
                    <EraIcon era={option.value} size={36} />
                  </span>
                  <span className="ms-era-option-name">{option.name}</span>
                  <span className="ms-era-option-year">{option.years}</span>
                </button>
              )
            })}

            {feedback && (
              <div className={`ms-feedback${errMsg ? ' ms-feedback-error' : ''}`} role="status">
                {feedback}
              </div>
            )}

            <button
              type="submit"
              className={`ms-submit${isSubmitActive ? ' ms-submit-active' : ''}`}
              disabled={stage === 'submitting'}
            >
              <img src={submitButtonActiveUrl} className="ms-submit-active-bg" alt="" aria-hidden />
              <span className="ms-submit-label">
                {stage === 'submitting' ? '上传中' : '上传歌曲'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
