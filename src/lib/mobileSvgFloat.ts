const HOME_BACKGROUND_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint17_linear_42_6623)" fill-opacity="0.55"/>'
const SUBMIT_BASE_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint30_linear_44_7235)" fill-opacity="0.55"/>'
const VOTE_BACKGROUND_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint17_linear_40_6336)" fill-opacity="0.55"/>'

const VOTE_RECORD_START = '<circle cx="290.917" cy="244.917" r="34.466" transform="rotate(12.2515 290.917 244.917)" fill="url(#paint18_linear_40_6336)" fill-opacity="0.55"/>'
const VOTE_RECORD_END = '<circle cx="215.202" cy="256.908" r="3.35713" fill="#D9D9D9"/>'

function wrapBubbleCircles(svgContent: string) {
  let index = 0
  return svgContent.replace(/<circle\b[^>]*\/>/g, (circle) => {
    const className = `mobile-svg-bubble mobile-svg-bubble-${index % 4}`
    index += 1
    return `<g class="${className}">${circle}</g>`
  })
}

function decorateFirstBubbleGroup(svg: string) {
  return svg.replace(/<g opacity="0\.62">([\s\S]*?)<\/g>/, (_match, content: string) => (
    `<g class="mobile-svg-bubbles" opacity="0.62">${wrapBubbleCircles(content)}</g>`
  ))
}

function decorateSingleBubble(svg: string, circle: string, extraClassName = '') {
  const className = `mobile-svg-bubble mobile-svg-bubble-single ${extraClassName}`.trim()
  return svg.replace(circle, `<g class="${className}">${circle}</g>`)
}

function decorateFirstRecordGroup(svg: string, className: string) {
  return svg.replace(/<g opacity="0\.27">([\s\S]*?)<\/g>/, (_match, content: string) => (
    `<g class="mobile-svg-records ${className}" opacity="0.27">${content}</g>`
  ))
}

function wrapRange(svg: string, start: string, end: string, className: string) {
  const startIndex = svg.indexOf(start)
  if (startIndex < 0) return svg

  const endIndex = svg.indexOf(end, startIndex)
  if (endIndex < 0) return svg

  const rangeEnd = endIndex + end.length
  return `${svg.slice(0, startIndex)}<g class="${className}">${svg.slice(startIndex, rangeEnd)}</g>${svg.slice(rangeEnd)}`
}

export function decorateMobileHomeBackgroundSvg(svg: string) {
  return decorateSingleBubble(
    decorateFirstBubbleGroup(svg),
    HOME_BACKGROUND_SINGLE_BUBBLE,
    'mobile-svg-bubble-home-single',
  )
}

export function decorateMobileSubmitBaseSvg(svg: string) {
  return decorateSingleBubble(
    decorateFirstBubbleGroup(decorateFirstRecordGroup(svg, 'mobile-svg-records-submit')),
    SUBMIT_BASE_SINGLE_BUBBLE,
    'mobile-svg-bubble-submit-single',
  )
}

export function decorateMobileVoteBackgroundSvg(svg: string) {
  return decorateSingleBubble(
    decorateFirstBubbleGroup(
      wrapRange(svg, VOTE_RECORD_START, VOTE_RECORD_END, 'mobile-svg-records mobile-svg-records-vote'),
    ),
    VOTE_BACKGROUND_SINGLE_BUBBLE,
    'mobile-svg-bubble-vote-single',
  )
}
