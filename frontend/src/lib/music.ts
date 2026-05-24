import { apiRequest } from './api'

export type GeneratedMusic = {
  id: string
  model: string
  prompt: string
  lyrics: string | null
  source_audio_url: string
  music_url: string
  minio_bucket: string
  minio_object_name: string
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
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
      output_format: 'url',
    }),
  })
}
