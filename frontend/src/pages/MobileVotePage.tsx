import { useEffect, useMemo, useState, type UIEvent } from 'react'
import InlineSvg from '../components/InlineSvg'
import { useSongs } from '../hooks/useSongs'
import { calcScore, voteSong } from '../lib/songs'
import { decorateMobileVoteBackgroundSvg } from '../lib/mobileSvgFloat'
import type { Song } from '../types/song'

import bgSvg from '../svg/mobile-vote/Background.svg?raw'
import panelBgUrl from '../svg/mobile-vote/PanelBackground.svg'
import backArrowUrl from '../svg/mobile-vote/icons/BackArrow.svg'
import downChevronUrl from '../svg/mobile-vote/icons/DownChevron.svg'
import heartUrl from '../svg/mobile-vote/icons/Heart.svg'
import downloadUrl from '../svg/mobile-vote/icons/Download.svg'
import loopUrl from '../svg/mobile-vote/icons/Loop.svg'
import dotsUrl from '../svg/mobile-vote/icons/Dots.svg'
import playArrowUrl from '../svg/mobile-vote/icons/PlayArrow.svg'
import voteButtonUrl from '../svg/mobile-vote/buttons/VoteButton.svg'
import bubble1Url from '../svg/mobile-vote/bubbles/RankBubble1.svg'
import bubble2Url from '../svg/mobile-vote/bubbles/RankBubble2.svg'
import bubble3Url from '../svg/mobile-vote/bubbles/RankBubble3.svg'
import bubble4Url from '../svg/mobile-vote/bubbles/RankBubble4.svg'

import '../styles/mobile-vote.css'

const BUBBLE_URLS = [bubble1Url, bubble2Url, bubble3Url, bubble4Url]
const FIRST_ROW_TOP = 245 // Y of first row's bubble top after moving the panel closer to the header
const ROW_HEIGHT = 78 // Vertical spacing between rows
const MAX_VISIBLE_ROWS = 10
const PANEL_CONTENT_BOTTOM = 837
const ROW_BOTTOM_PADDING = 35
const PAGE_SIZE = 20
const floatingVoteBackgroundSvg = decorateMobileVoteBackgroundSvg(bgSvg)

type VoteError = {
  songId: string
  message: string
}

function getVoteErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>
    const parts = [record.message, record.details, record.hint].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )

    const code = typeof record.code === 'string' ? record.code.trim() : ''
    const message = typeof record.message === 'string' ? record.message.trim() : ''

    if (code === 'P0001' && message.includes('投票次数已达上限')) {
      return '当前 IP 投票次数已达上限（每个 IP 最多 3 票）'
    }

    if (code === 'PGRST202' || code === '42883') {
      parts.push('请先在 Supabase SQL Editor 执行 supabase/migrations/20260522214700_limit_vote_by_ip.sql')
    }

    if (code) {
      parts.push(`错误码 ${code}`)
    }

    if (parts.length > 0) return parts.join('；')
  }

  if (err instanceof Error && err.message.trim()) return err.message
  if (typeof err === 'string' && err.trim()) return err

  return '投票失败，请稍后重试'
}

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

export default function MobileVotePage() {
  const { songs, loading, error, upsertSong } = useSongs()
  const [votingId, setVotingId] = useState<string | null>(null)
  const [votedId, setVotedId] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [voteError, setVoteError] = useState<VoteError | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const scale = useFitToWidth(390)

  const rankedSongs = useMemo(() => {
    return [...songs].sort((a, b) => calcScore(b) - calcScore(a))
  }, [songs])

  const visibleRankedSongs = useMemo(() => {
    return rankedSongs.slice(0, visibleCount)
  }, [rankedSongs, visibleCount])

  const handleVote = async (song: Song) => {
    if (votingId) return
    setVotingId(song.id)
    setErrMsg('')
    setVoteError(null)
    try {
      const updatedSong = await voteSong(song.id)
      upsertSong(updatedSong)
      setVoteError(null)
      setVotedId(song.id)
      window.setTimeout(() => setVotedId((id) => (id === song.id ? null : id)), 1400)
    } catch (err: unknown) {
      const message = getVoteErrorMessage(err)
      if (message.includes('投票次数已达上限')) {
        setErrMsg(message)
      } else {
        setErrMsg(`《${song.title}》投票失败：${message}`)
        setVoteError({ songId: song.id, message })
      }
    } finally {
      setVotingId(null)
    }
  }

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const list = event.currentTarget
    const distanceToBottom = list.scrollHeight - list.scrollTop - list.clientHeight

    if (distanceToBottom > ROW_HEIGHT || visibleCount >= rankedSongs.length) return

    setVisibleCount((count) => Math.min(count + PAGE_SIZE, rankedSongs.length))
  }

  const hasMoreSongs = visibleRankedSongs.length < rankedSongs.length
  const visibleRowCount = Math.min(visibleRankedSongs.length, MAX_VISIBLE_ROWS)
  const maxListHeight = PANEL_CONTENT_BOTTOM - FIRST_ROW_TOP
  const listHeight = Math.min(visibleRowCount * ROW_HEIGHT, maxListHeight)
  const listContentHeight = visibleRankedSongs.length * ROW_HEIGHT
  const lastRowBottom = FIRST_ROW_TOP + listHeight
  const canvasHeight = Math.max(844, lastRowBottom + ROW_BOTTOM_PADDING)
  const showFooterChevron = !loading && rankedSongs.length > 0 && rankedSongs.length <= 4

  return (
    <div className="mv-page">
      <div className="mv-scaler" style={{ transform: `scale(${scale})` }}>
        <div className="mv-canvas" style={{ height: canvasHeight }}>
          {/* 背景：暗底 + 装饰圆 + 顶部漂浮图标 */}
          <InlineSvg html={floatingVoteBackgroundSvg} className="mv-bg mobile-floating-svg" />

          {/* 顶部返回按钮 */}
          <button
            type="button"
            className="mv-back-arrow"
            onClick={() => window.location.assign('?mode=home')}
            aria-label="返回"
          >
            <img src={backArrowUrl} alt="" aria-hidden />
          </button>

          <h1 className="mv-title">代际歌曲榜单</h1>

          {/* 排行面板背景（含模糊与阴影） */}
          <img src={panelBgUrl} className="mv-panel-bg" alt="" aria-hidden />

          {/* 面板标题区 */}
          <h1 className="mv-panel-title">代际歌曲榜单</h1>
          <p className="mv-panel-subtitle">
            信义坊社区大屏
          </p>

          {/* 装饰图标行 + 大粉色播放箭头 */}
          <div className="mv-action-icons" aria-hidden>
            <img src={heartUrl} alt="" />
            <img src={downloadUrl} alt="" />
            <img src={loopUrl} alt="" />
            <img src={dotsUrl} alt="" />
          </div>
          <img src={playArrowUrl} className="mv-play-arrow" alt="" aria-hidden />

          {/* 顶部错误提示 */}
          {errMsg && (
            <div className="mv-error-bar" role="alert">
              <span aria-hidden>⚠️</span>
              <span>{errMsg}</span>
            </div>
          )}
          {error && !errMsg && (
            <div className="mv-error-bar" role="alert">
              <span aria-hidden>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 列表 / 加载 / 空态 */}
          {loading ? (
            <div className="mv-state">正在同步现场榜单...</div>
          ) : rankedSongs.length === 0 ? (
            <div className="mv-state mv-state-empty">
              <p className="mv-empty-title">还没有歌曲上榜</p>
              <p>先投稿一首喜欢的歌吧</p>
              <a href="?mode=mobile" className="mv-empty-link">去投稿歌曲 →</a>
            </div>
          ) : (
            <div className="mv-list" style={{ top: FIRST_ROW_TOP, height: listHeight }} onScroll={handleListScroll}>
              <div className="mv-list-inner" style={{ height: listContentHeight }}>
                {visibleRankedSongs.map((song, i) => {
                  const isVoting = votingId === song.id
                  const isVoted = votedId === song.id
                  const top = i * ROW_HEIGHT
                  const bubbleUrl = BUBBLE_URLS[i % BUBBLE_URLS.length]
                  const isLast = i === visibleRankedSongs.length - 1 && !hasMoreSongs
                  const showError = voteError?.songId === song.id

                  return (
                    <div key={song.id} className="mv-row" style={{ top }}>
                      <img src={bubbleUrl} className="mv-row-bubble" alt="" aria-hidden />

                      <div className="mv-row-info">
                        <h2 className="mv-row-title">{song.title}</h2>
                        <div className="mv-row-meta">
                          <span className="mv-row-artist">{song.artist}</span>
                          <span className="mv-row-votes">{song.votes} 票</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={
                          'mv-vote-btn' +
                          (isVoting ? ' mv-vote-btn-voting' : '') +
                          (isVoted ? ' mv-vote-btn-voted' : '')
                        }
                        disabled={Boolean(votingId)}
                        onClick={() => void handleVote(song)}
                      >
                        <img src={voteButtonUrl} className="mv-vote-btn-bg" alt="" aria-hidden />
                        <span className="mv-vote-btn-text">
                          {isVoting ? '推榜中...' : isVoted ? '已推 +1' : '推榜！'}
                        </span>
                      </button>

                      {showError && (
                        <div className="mv-row-error" role="alert">
                          <span aria-hidden>⚠️</span>
                          <span className="mv-row-error-text">{voteError.message}</span>
                        </div>
                      )}

                      {!isLast && (
                        <span className="mv-row-divider" aria-hidden />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 底部 v 形提示 */}
          {showFooterChevron && (
            <img src={downChevronUrl} className="mv-chevron" alt="" aria-hidden />
          )}
        </div>
      </div>
    </div>
  )
}
