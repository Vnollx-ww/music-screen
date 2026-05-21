import type { Era } from '../types/song'

export interface EraVisualConfig {
  label: string
  color: string
  emoji: string
  shortLabel: string
}

export const eraConfig: Record<Era, EraVisualConfig> = {
  vinyl: { label: '黑胶年代', shortLabel: 'VINYL', color: '#C0C0C0', emoji: '⬤' },
  tape: { label: '磁带年代', shortLabel: 'TAPE', color: '#9E75D2', emoji: '📼' },
  cd: { label: 'CD年代', shortLabel: 'CD', color: '#29E3E1', emoji: '💿' },
  digital: { label: '数字年代', shortLabel: 'DIGITAL', color: '#BE8BFF', emoji: '🎵' },
  ai: { label: 'AI共创', shortLabel: 'AI', color: '#FCAFE4', emoji: '✨' },
}

export const eraOptions: { value: Era; label: string; emoji: string; color: string }[] = [
  { value: 'vinyl', label: '黑胶年代', emoji: '⬤', color: '#C0C0C0' },
  { value: 'tape', label: '磁带年代', emoji: '📼', color: '#9E75D2' },
  { value: 'cd', label: 'CD年代', emoji: '💿', color: '#29E3E1' },
  { value: 'digital', label: '数字年代', emoji: '🎵', color: '#BE8BFF' },
  { value: 'ai', label: 'AI共创', emoji: '✨', color: '#FCAFE4' },
]

export function inferEraFromYear(year: number): Era {
  if (year < 1975) return 'vinyl'
  if (year <= 1989) return 'tape'
  if (year <= 2002) return 'cd'
  if (year <= 2023) return 'digital'
  return 'ai'
}

export function normalizeEra(val: string | null | undefined): Era {
  if (val === 'vinyl' || val === 'tape' || val === 'cd' || val === 'digital' || val === 'ai') return val
  return 'digital'
}
