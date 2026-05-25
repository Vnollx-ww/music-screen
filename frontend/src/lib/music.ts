import { apiFormRequest, apiRequest } from './api'

export type GeneratedMusic = {
  id: string
  model: string
  prompt: string
  lyrics: string | null
  source_audio_url: string
  music_url: string
  minio_bucket: string
  minio_object_name: string
  content_type: string | null
  file_size_bytes: number | null
  status: string
  expires_at: string
  created_at: string
}

export type GenerateMusicInput = {
  model: string
  prompt: string
  lyrics?: string
  is_instrumental?: boolean
  audio_url?: string
  audio_base64?: string
  cover_feature_id?: string
  reference_music_id?: string
}

export type MusicCoverPreprocessInput = {
  audio_url?: string
  audio_base64?: string
}

export type MusicCoverPreprocessResult = {
  cover_feature_id: string
  formatted_lyrics: string | null
  structure_result: string | null
  audio_duration: number | null
  trace_id: string | null
}

export async function fetchGeneratedMusic(): Promise<GeneratedMusic[]> {
  return apiRequest<GeneratedMusic[]>('/music')
}

export async function generateMusic(input: GenerateMusicInput): Promise<GeneratedMusic> {
  return apiRequest<GeneratedMusic>('/music/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt.trim(),
      lyrics: input.lyrics?.trim() || undefined,
      is_instrumental: input.is_instrumental,
      audio_url: input.audio_url?.trim() || undefined,
      audio_base64: input.audio_base64 || undefined,
      cover_feature_id: input.cover_feature_id?.trim() || undefined,
      reference_music_id: input.reference_music_id?.trim() || undefined,
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
      output_format: 'url',
    }),
  })
}

export async function preprocessMusicCover(input: MusicCoverPreprocessInput): Promise<MusicCoverPreprocessResult> {
  return apiRequest<MusicCoverPreprocessResult>('/music/cover-preprocess', {
    method: 'POST',
    body: JSON.stringify({
      model: 'music-cover',
      audio_url: input.audio_url?.trim() || undefined,
      audio_base64: input.audio_base64 || undefined,
    }),
  })
}

export async function uploadSourceAudio(file: File, title: string, artist?: string): Promise<GeneratedMusic> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title.trim())
  if (artist?.trim()) formData.append('artist', artist.trim())
  return apiFormRequest<GeneratedMusic>('/music/source-upload', formData)
}

export async function deleteGeneratedMusic(musicId: string): Promise<void> {
  await apiRequest<void>(`/music/${encodeURIComponent(musicId)}`, {
    method: 'DELETE',
  })
}
