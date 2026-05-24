import { memo } from 'react'

type InlineSvgProps = {
  html: string
  className?: string
}

function InlineSvg({ html, className }: InlineSvgProps) {
  return <div className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}

export default memo(InlineSvg)
