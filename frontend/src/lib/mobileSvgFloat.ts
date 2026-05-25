const HOME_BACKGROUND_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint17_linear_42_6623)" fill-opacity="0.55"/>'
const SUBMIT_BASE_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint30_linear_44_7235)" fill-opacity="0.55"/>'
const VOTE_BACKGROUND_SINGLE_BUBBLE = '<circle cx="-14.4682" cy="592.62" r="17.8624" transform="rotate(-31.1976 -14.4682 592.62)" fill="url(#paint17_linear_40_6336)" fill-opacity="0.55"/>'
const SUBMIT_FORM_SHELL_START = '<path d="M32 720C32 711.716 38.7157 705 47 705H341C349.284 705 356 711.716 356 720V778C356 786.284 349.284 793 341 793H47C38.7157 793 32 786.284 32 778V720Z" fill="#D9D9D9" fill-opacity="0.22"/>'
const SUBMIT_FORM_SHELL_END = '<path d="M62.5 737H328.5C343.136 737 355 748.864 355 763.5C355 778.136 343.136 790 328.5 790H62.5C47.8645 790 36 778.136 36 763.5C36 748.864 47.8645 737 62.5 737Z" fill="#5F6786" stroke="#B2B2B2" stroke-width="2"/>'

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

function removeHomeSolidBackground(svg: string) {
  return svg.replace('<rect width="390" height="844" fill="#14161F"/>', '')
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

function decorateSubmitTopPill(svg: string) {
  return svg.replace(
    /<foreignObject x="56" y="184" width="273" height="136">[\s\S]*?<g filter="url\(#filter7_d_44_7235\)" data-figma-bg-blur-radius="4\.3">[\s\S]*?<\/g>/,
    (match) => `<g class="mobile-svg-submit-era-pill">${match}</g>`,
  )
}

function extractSubmitTopPill(svg: string) {
  const svgOpen = svg.match(/^<svg\b[^>]*>/)?.[0] ?? '<svg width="390" height="844" viewBox="0 0 390 844" fill="none" xmlns="http://www.w3.org/2000/svg">'
  const pill = svg.match(/<foreignObject x="56" y="184" width="273" height="136">[\s\S]*?<g filter="url\(#filter7_d_44_7235\)" data-figma-bg-blur-radius="4\.3">[\s\S]*?<\/g>/)?.[0]
  const defs = svg.match(/<defs>[\s\S]*<\/defs>/)?.[0] ?? ''
  if (!pill) return decorateSubmitTopPill(svg)
  return `${svgOpen}<g class="mobile-svg-submit-era-pill">${pill}</g>${defs}</svg>`
}

function decorateSubmitTopFrame(svg: string) {
  return svg.replace(
    /<foreignObject x="58" y="44" width="271" height="271">[\s\S]*?<g filter="url\(#filter6_d_44_7235\)" data-figma-bg-blur-radius="4\.3">[\s\S]*?<\/g>/,
    (match) => `<g class="mobile-svg-submit-top-frame">${match}</g>`,
  )
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
    decorateFirstBubbleGroup(removeHomeSolidBackground(svg)),
    HOME_BACKGROUND_SINGLE_BUBBLE,
    'mobile-svg-bubble-home-single',
  )
}

export function decorateMobileSubmitBaseSvg(svg: string) {
  return decorateSingleBubble(
    decorateFirstBubbleGroup(
      decorateSubmitTopFrame(
        decorateSubmitTopPill(
          wrapRange(
            decorateFirstRecordGroup(svg, 'mobile-svg-records-submit'),
            SUBMIT_FORM_SHELL_START,
            SUBMIT_FORM_SHELL_END,
            'mobile-svg-submit-form-shell',
          ),
        ),
      ),
    ),
    SUBMIT_BASE_SINGLE_BUBBLE,
    'mobile-svg-bubble-submit-single',
  )
}

export function decorateMobileSubmitEraPillSvg(svg: string) {
  return extractSubmitTopPill(svg)
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
