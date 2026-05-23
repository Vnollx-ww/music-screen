import type { Era } from '../types/song'

export interface EraVisualConfig {
  label: string
  color: string
  icon: Era
  shortLabel: string
}

export const eraConfig: Record<Era, EraVisualConfig> = {
  vinyl: { label: '黑胶年代', shortLabel: 'VINYL', color: '#E39FD0', icon: 'vinyl' },
  tape: { label: '磁带年代', shortLabel: 'TAPE', color: '#595CAC', icon: 'tape' },
  cd: { label: 'CD年代', shortLabel: 'CD', color: '#9872CE', icon: 'cd' },
  digital: { label: '数字年代', shortLabel: 'DIGITAL', color: '#29E3E1', icon: 'digital' },
  ai: { label: 'AI共创', shortLabel: 'AI', color: '#FCAFE4', icon: 'ai' },
}

export const eraOptions: { value: Era; label: string; icon: Era; color: string }[] = [
  { value: 'vinyl', label: '黑胶年代', icon: 'vinyl', color: '#E39FD0' },
  { value: 'tape', label: '磁带年代', icon: 'tape', color: '#595CAC' },
  { value: 'cd', label: 'CD年代', icon: 'cd', color: '#9872CE' },
  { value: 'digital', label: '数字年代', icon: 'digital', color: '#29E3E1' },
  { value: 'ai', label: 'AI共创', icon: 'ai', color: '#FCAFE4' },
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
