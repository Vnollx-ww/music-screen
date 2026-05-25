import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import InlineSvg from '../components/InlineSvg'
import SubmitTopRecord from '../components/SubmitTopRecord'
import { useFitToWidth } from '../hooks/useFitToWidth'
import { uploadSourceAudio } from '../lib/music'
import { insertSong } from '../lib/songs'
import { decorateMobileSubmitBaseSvg, decorateMobileSubmitEraPillSvg } from '../lib/mobileSvgFloat'
import type { Era } from '../types/song'
import vinylIconUrl from '../svg/ranking-panel-left/icons/Vinyl.svg'
import cdIconUrl from '../svg/ranking-panel-left/icons/Cd.svg'
import tapeIconUrl from '../svg/ranking-panel-left/icons/Tape.svg'
import digitalIconUrl from '../svg/ranking-panel-left/icons/Digital.svg'
import submitBaseSvg from '../svg/mobile-submit/SubmitBase.svg?raw'
import eraOptionSelectedUrl from '../svg/mobile-submit/EraOptionSelected.svg'
import submitButtonActiveUrl from '../svg/mobile-submit/SubmitButtonActive.svg'
import '../styles/mobile-submit.css'

type Stage = 'form' | 'animating' | 'submitting' | 'success'

type SubmitEraOption = {
  value: Era
  name: string
  years: string
  iconUrl: string
}

const submitEraOptions: SubmitEraOption[] = [
  { value: 'vinyl', name: '黑胶', years: '1970', iconUrl: vinylIconUrl },
  { value: 'cd', name: 'CD', years: '1990', iconUrl: cdIconUrl },
  { value: 'tape', name: '磁带', years: '1980', iconUrl: tapeIconUrl },
  { value: 'digital', name: '数字', years: '2000', iconUrl: digitalIconUrl },
]

const floatingSubmitBaseSvg = decorateMobileSubmitBaseSvg(submitBaseSvg)
const floatingSubmitEraPillSvg = decorateMobileSubmitEraPillSvg(submitBaseSvg)
const SUBMIT_ANIMATION_MS = 2600
const ERA_PILL_TITLE_MAX_CHARS = 6

function getEraPillDisplayTitle(value: string) {
  const chars = Array.from(value)
  if (chars.length <= ERA_PILL_TITLE_MAX_CHARS) return value
  return `${chars.slice(0, ERA_PILL_TITLE_MAX_CHARS).join('')}…`
}

export default function MobileSubmitPage() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [era, setEra] = useState<Era | null>(null)
  const [sourceAudioFile, setSourceAudioFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('form')
  const [errMsg, setErrMsg] = useState('')
  const submitTimerRef = useRef<number | null>(null)
  const submitInProgressRef = useRef(false)
  const sourceAudioInputRef = useRef<HTMLInputElement | null>(null)
  const scale = useFitToWidth(390)

  useEffect(() => {
    return () => {
      if (submitTimerRef.current !== null) window.clearTimeout(submitTimerRef.current)
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (stage !== 'form' || submitInProgressRef.current) return

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
    setStage('animating')
    submitInProgressRef.current = true

    const songTitle = title.trim()
    const songArtist = artist.trim() || undefined
    const songEra = era

    submitTimerRef.current = window.setTimeout(() => {
      submitTimerRef.current = null
      setStage('submitting')

      void (async () => {
        const uploadedMusic = sourceAudioFile ? await uploadSourceAudio(sourceAudioFile, songTitle, songArtist) : null
        return insertSong({ title: songTitle, artist: songArtist, era: songEra, music_id: uploadedMusic?.id })
      })()
        .then(() => {
          setTitle('')
          setArtist('')
          setSourceAudioFile(null)
          if (sourceAudioInputRef.current) sourceAudioInputRef.current.value = ''
          setStage('success')
        })
        .catch((err: unknown) => {
          setErrMsg(err instanceof Error ? err.message : '提交失败')
          setStage('form')
        })
        .finally(() => {
          submitInProgressRef.current = false
        })
    }, SUBMIT_ANIMATION_MS)
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

  const handleSourceAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceAudioFile(event.target.files?.[0] ?? null)
    if (stage === 'success') setStage('form')
    if (errMsg) setErrMsg('')
  }

  const selectedEraLabel = title.trim() ? getEraPillDisplayTitle(title.trim()) : '请输入歌曲名'
  const sourceAudioLabel = sourceAudioFile ? sourceAudioFile.name : '上传音频源文件（可选）'
  const feedback = errMsg
  const isUploadLocked = stage !== 'form'
  const isBackDisabled = stage === 'animating' || stage === 'submitting'
  const isUploadFlow = stage === 'animating' || stage === 'submitting' || stage === 'success'
  const isSubmitActive = era !== null || isUploadFlow
  const submitLabel = stage === 'animating' || stage === 'submitting' ? '推榜中' : '上传歌曲'
  const canvasClassName =
    `ms-canvas${isUploadFlow ? ' ms-canvas-upload-flow' : ''}` +
    (stage === 'submitting' ? ' ms-canvas-submitting' : '') +
    (stage === 'success' ? ' ms-canvas-success' : '')

  return (
    <main className="ms-page">
      <div className="ms-scaler" style={{ height: 844 * scale }}>
        <div className={canvasClassName} style={{ transform: `scale(${scale})` }}>
          <InlineSvg html={floatingSubmitBaseSvg} className="ms-base mobile-floating-svg" />

          <button
            type="button"
            className="ms-back"
            aria-label="返回主页"
            disabled={isBackDisabled}
            onClick={() => window.location.assign('?mode=home')}
          />

          <h1 className="ms-title">上传歌曲</h1>

          {era && <SubmitTopRecord era={era} className="ms-top-icon" />}

          <InlineSvg html={floatingSubmitEraPillSvg} className="ms-era-pill-overlay mobile-floating-svg" />

          <div className="ms-era-pill-label">{selectedEraLabel}</div>

          {(stage === 'submitting' || stage === 'success') && (
            <div className="ms-upload-status" role="status">
              <span className="ms-upload-status-title">
                {stage === 'success' ? '已推榜' : '正在推榜'}
              </span>
              <span className="ms-upload-status-subtitle">
                {stage === 'success' ? '已同步到现场大屏' : '请稍候，正在写入榜单'}
              </span>
            </div>
          )}

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
              disabled={isUploadLocked}
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
              disabled={isUploadLocked}
            />

            <label className="ms-source-audio-control" htmlFor="mobile-submit-source-audio">
              <input
                ref={sourceAudioInputRef}
                id="mobile-submit-source-audio"
                type="file"
                accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/*"
                onChange={handleSourceAudioChange}
                disabled={isUploadLocked}
              />
              <span>{sourceAudioLabel}</span>
            </label>

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
                  disabled={isUploadLocked}
                >
                  {isSelected && (
                    <img src={eraOptionSelectedUrl} className="ms-era-option-bg" alt="" aria-hidden />
                  )}
                  <span className="ms-era-option-icon">
                    <img src={option.iconUrl} width={36} height={36} alt="" aria-hidden />
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
              disabled={isUploadLocked}
            >
              <img src={submitButtonActiveUrl} className="ms-submit-active-bg" alt="" aria-hidden />
              <span className="ms-submit-label">{submitLabel}</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
