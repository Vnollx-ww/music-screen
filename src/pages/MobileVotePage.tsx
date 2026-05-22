import { useMemo, useState } from 'react'
import EraIcon from '../components/EraIcon'
import { useSongs } from '../hooks/useSongs'
import { calcScore, voteSong } from '../lib/songs'
import { eraConfig } from '../lib/eraConfig'
import type { Song } from '../types/song'
import '../styles/mobile-pages.css'

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

    if (code === 'PGRST202' || code === '42883') {
      parts.push('请先在 Supabase SQL Editor 执行 supabase/migrations/20260522130300_create_vote_song_rpc.sql')
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

export default function MobileVotePage() {
  const { songs, loading, error, upsertSong } = useSongs()
  const [votingId, setVotingId] = useState<string | null>(null)
  const [votedId, setVotedId] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [voteError, setVoteError] = useState<VoteError | null>(null)

  const rankedSongs = useMemo(() => {
    return [...songs].sort((a, b) => calcScore(b) - calcScore(a))
  }, [songs])

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
      setErrMsg(`《${song.title}》投票失败：${message}`)
      setVoteError({ songId: song.id, message })
    } finally {
      setVotingId(null)
    }
  }

  return (
    <div className="mobile-page">
      <div className="mobile-page-bg" />

      <div className="mobile-page-container">
        <div className="mobile-page-header">
          <div className="mobile-page-header-icon">
            🏆
          </div>
          <h1 className="mobile-page-title">
            投票推榜
          </h1>
          <p className="mobile-page-subtitle">
            为喜欢的歌曲推一票，实时影响现场大屏排名
          </p>
        </div>

        <div className="mobile-tabs">
          <a href="?mode=vote" className="mobile-tab mobile-tab-active">
            投票推榜
          </a>
          <a href="?mode=mobile" className="mobile-tab">
            投稿歌曲
          </a>
        </div>

        {errMsg && (
          <div className="mobile-error-bar" role="alert">
            <span aria-hidden>⚠️</span>
            <span className="mobile-error-text">{errMsg}</span>
          </div>
        )}

        {error && (
          <div className="mobile-error-box" role="alert">
            {error}
          </div>
        )}

        <div className="mobile-song-list">
          {loading ? (
            <div className="mobile-state-card mobile-loading-card">
              正在同步现场榜单...
            </div>
          ) : rankedSongs.length === 0 ? (
            <div className="mobile-state-card mobile-empty-card">
              <div className="mobile-empty-icon">
                🎵
              </div>
              <p className="mobile-empty-title">还没有歌曲上榜</p>
              <p className="mobile-empty-text">先投稿一首喜欢的歌吧</p>
              <a href="?mode=mobile" className="mobile-secondary-button mobile-empty-action">
                去投稿歌曲
              </a>
            </div>
          ) : (
            rankedSongs.map((song, index) => {
              const cfg = eraConfig[song.era]
              const isVoting = votingId === song.id
              const isVoted = votedId === song.id

              return (
                <article key={song.id} className="mobile-song-card">
                  <div className="mobile-song-card-line" />
                  <div className="mobile-song-main">
                    <div className="mobile-song-rank">
                      {index + 1}
                    </div>
                    <div className="mobile-song-era" style={{ background: `${cfg.color}22` }}>
                      <EraIcon era={song.era} size={38} />
                    </div>
                    <div className="mobile-song-info">
                      <div className="mobile-song-title-row">
                        <h2 className="mobile-song-title">{song.title}</h2>
                        <span className="mobile-song-era-badge" style={{ background: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mobile-song-artist">{song.artist}</p>
                    </div>
                  </div>

                  <div className="mobile-song-footer">
                    <div className="mobile-song-votes">
                      当前票数 <span>{song.votes}</span>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(votingId)}
                      onClick={() => void handleVote(song)}
                      className="mobile-vote-button"
                    >
                      {isVoting ? '推榜中...' : isVoted ? '已推 +1' : '推一票'}
                    </button>
                  </div>

                  {voteError?.songId === song.id && (
                    <div className="mobile-card-error" role="alert">
                      <span aria-hidden>⚠️</span>
                      <span>{voteError.message}</span>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
