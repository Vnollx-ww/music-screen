import { useId } from 'react'
import InlineSvg from './InlineSvg'
import type { Era } from '../types/song'
import vinylRecordSvg from '../svg/center-records/Record1.svg?raw'
import digitalRecordSvg from '../svg/center-records/Record4.svg?raw'
import tapeRecordSvg from '../svg/center-records/Record5.svg?raw'
import cdRecordSvg from '../svg/center-records/Record6.svg?raw'

type SubmitTopRecordProps = {
  era: Era
  className?: string
}

const submitTopRecordSvgs: Partial<Record<Era, string>> = {
  vinyl: vinylRecordSvg,
  cd: cdRecordSvg,
  tape: tapeRecordSvg,
  digital: digitalRecordSvg,
}

const submitTopRecordViewBoxes: Partial<Record<Era, string>> = {
  vinyl: '698.5 186.5 204.5 204.5',
  cd: '447.5 306.5 171.5 171.5',
  tape: '1087.5 490.5 154.5 154.5',
  digital: '939.5 291.5 185 185',
}

const TOP_RECORD_SIZE = 100
const TOP_RECORD_CENTER = TOP_RECORD_SIZE / 2
const TOP_RECORD_DIAMETER = 98

function getRecordTransform(centerX: number, centerY: number, diameter: number, scaleMultiplier = 1) {
  const scale = (TOP_RECORD_DIAMETER / diameter) * scaleMultiplier
  return `translate(${TOP_RECORD_CENTER} ${TOP_RECORD_CENTER}) scale(${scale}) translate(${-centerX} ${-centerY})`
}

export default function SubmitTopRecord({ era, className }: SubmitTopRecordProps) {
  const prefix = useId().replace(/:/g, '')
  const recordSvg = submitTopRecordSvgs[era]
  const viewBox = submitTopRecordViewBoxes[era]

  if (recordSvg && viewBox) {
    const croppedSvg = recordSvg.replace(/<svg\b([^>]*)\bviewBox="[^"]*"([^>]*)>/, `<svg$1viewBox="${viewBox}"$2>`)
    return <InlineSvg html={croppedSvg} className={className} />
  }

  if (era === 'vinyl') {
    const linear = `${prefix}-submit-top-vinyl-linear`
    const radialA = `${prefix}-submit-top-vinyl-radial-a`
    const radialB = `${prefix}-submit-top-vinyl-radial-b`
    const recordTransform = getRecordTransform(198.795, 135.771, 103.0614)

    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={linear} x1="182.678" y1="170.235" x2="217.485" y2="73.6703" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D9D9D9" stopOpacity="0.03" />
            <stop offset="0.643634" stopColor="#E5A1D1" />
            <stop offset="1" stopColor="#E6A1D2" />
          </linearGradient>
          <radialGradient id={radialA} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(198.975 136.965) rotate(-0.490819) scale(20.6644)">
            <stop offset="0.240385" />
            <stop offset="0.541667" stopColor="#0E0E0E" />
            <stop offset="0.567708" stopColor="#0A0A0A" />
            <stop offset="0.604167" stopColor="#111111" />
            <stop offset="0.630208" stopColor="#030303" />
            <stop offset="0.692708" stopColor="#0A0A0A" />
            <stop offset="0.739583" stopColor="#0C0C0C" />
            <stop offset="0.776042" stopColor="#090909" />
            <stop offset="0.802083" stopColor="#070707" />
            <stop offset="0.838484" stopColor="#050505" />
            <stop offset="0.894232" stopColor="#0D0D0D" />
            <stop offset="0.921875" stopColor="#0C0C0C" />
            <stop offset="0.96875" stopColor="#0C0C0C" />
            <stop offset="1" stopColor="#F8F8F8" />
          </radialGradient>
          <radialGradient id={radialB} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(198.975 136.965) rotate(-0.490819) scale(20.6644)">
            <stop offset="0.240385" />
            <stop offset="0.541667" stopColor="#0E0E0E" />
            <stop offset="0.567708" stopColor="#0A0A0A" />
            <stop offset="0.604167" stopColor="#111111" />
            <stop offset="0.630208" stopColor="#030303" />
            <stop offset="0.692708" stopColor="#0A0A0A" />
            <stop offset="0.739583" stopColor="#0C0C0C" />
            <stop offset="0.776042" stopColor="#090909" />
            <stop offset="0.802083" stopColor="#070707" />
            <stop offset="0.838484" stopColor="#050505" />
            <stop offset="0.894232" stopColor="#0D0D0D" />
            <stop offset="0.921875" stopColor="#0C0C0C" />
            <stop offset="0.96875" stopColor="#0C0C0C" />
            <stop offset="1" stopColor="#F8F8F8" />
          </radialGradient>
        </defs>
        <g transform={recordTransform}>
        <circle cx="198.795" cy="135.771" r="51.5307" transform="rotate(-31.1976 198.795 135.771)" fill={`url(#${linear})`} fillOpacity="0.99" />
        <circle cx="198.913" cy="136.902" r="27.3383" fill="#272727" />
        <path d="M198.798 116.301C210.211 116.203 219.541 125.376 219.639 136.788C219.737 148.2 210.565 157.531 199.152 157.629C187.74 157.726 178.41 148.554 178.312 137.142C178.214 125.73 187.386 116.399 198.798 116.301ZM198.782 139.667C200.386 139.654 201.675 138.342 201.661 136.738C201.648 135.134 200.336 133.845 198.732 133.858C197.128 133.872 195.839 135.184 195.852 136.788C195.866 138.392 197.178 139.681 198.782 139.667Z" fill="white" />
        <path d="M198.798 116.301C210.211 116.203 219.541 125.376 219.639 136.788C219.737 148.2 210.565 157.531 199.152 157.629C187.74 157.726 178.41 148.554 178.312 137.142C178.214 125.73 187.386 116.399 198.798 116.301ZM198.782 139.667C200.386 139.654 201.675 138.342 201.661 136.738C201.648 135.134 200.336 133.845 198.732 133.858C197.128 133.872 195.839 135.184 195.852 136.788C195.866 138.392 197.178 139.681 198.782 139.667Z" fill={`url(#${radialA})`} fillOpacity="0.7" />
        <path d="M198.798 116.301C210.211 116.203 219.541 125.376 219.639 136.788C219.737 148.2 210.565 157.531 199.152 157.629C187.74 157.726 178.41 148.554 178.312 137.142C178.214 125.73 187.386 116.399 198.798 116.301ZM198.782 139.667C200.386 139.654 201.675 138.342 201.661 136.738C201.648 135.134 200.336 133.845 198.732 133.858C197.128 133.872 195.839 135.184 195.852 136.788C195.866 138.392 197.178 139.681 198.782 139.667Z" fill="white" />
        <path d="M198.798 116.301C210.211 116.203 219.541 125.376 219.639 136.788C219.737 148.2 210.565 157.531 199.152 157.629C187.74 157.726 178.41 148.554 178.312 137.142C178.214 125.73 187.386 116.399 198.798 116.301ZM198.782 139.667C200.386 139.654 201.675 138.342 201.661 136.738C201.648 135.134 200.336 133.845 198.732 133.858C197.128 133.872 195.839 135.184 195.852 136.788C195.866 138.392 197.178 139.681 198.782 139.667Z" fill={`url(#${radialB})`} fillOpacity="0.7" />
        <path d="M214.271 114.667C215.11 114.689 215.772 115.386 215.75 116.225L215.348 131.705C215.295 133.745 214.318 135.65 212.692 136.884L208.55 140.026C207.882 140.533 206.929 140.402 206.422 139.734C205.915 139.066 206.045 138.112 206.714 137.605L210.071 135.059C211.457 134.006 212.291 132.381 212.336 130.641L212.713 116.146C212.735 115.307 213.432 114.645 214.271 114.667Z" fill="#D7D7D7" />
        </g>
      </svg>
    )
  }

  if (era === 'cd') {
    const linear = `${prefix}-submit-top-cd-linear`
    const radialA = `${prefix}-submit-top-cd-radial-a`
    const radialB = `${prefix}-submit-top-cd-radial-b`
    const recordTransform = getRecordTransform(211.52, 256.418, 86.4686)

    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={linear} x1="222.177" y1="202.843" x2="203.022" y2="286.806" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D9D9D9" stopOpacity="0.03" />
            <stop offset="0.370809" stopColor="#BE8BFF" stopOpacity="0.62" />
            <stop offset="1" stopColor="#BE8BFF" />
          </linearGradient>
          <radialGradient id={radialA} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(212.294 255.913) rotate(-0.490819) scale(16.6496)">
            <stop stopColor="#232323" />
            <stop offset="0.541667" stopColor="#A3A1A1" />
            <stop offset="0.567708" stopColor="#0A0A0A" />
            <stop offset="0.604167" stopColor="#111111" />
            <stop offset="0.630208" stopColor="#030303" />
            <stop offset="0.692708" stopColor="#0A0A0A" />
            <stop offset="0.739583" stopColor="#0C0C0C" />
            <stop offset="0.776042" stopColor="#090909" />
            <stop offset="0.802083" stopColor="#070707" />
            <stop offset="0.838484" stopColor="#050505" />
            <stop offset="0.894232" stopColor="#0D0D0D" />
            <stop offset="0.921875" stopColor="#0C0C0C" />
            <stop offset="0.96875" stopColor="#0C0C0C" />
            <stop offset="1" stopColor="white" />
          </radialGradient>
          <radialGradient id={radialB} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(212.294 255.913) rotate(-0.490819) scale(16.6496)">
            <stop stopColor="#232323" />
            <stop offset="0.541667" stopColor="#A3A1A1" />
            <stop offset="0.567708" stopColor="#0A0A0A" />
            <stop offset="0.604167" stopColor="#111111" />
            <stop offset="0.630208" stopColor="#030303" />
            <stop offset="0.692708" stopColor="#0A0A0A" />
            <stop offset="0.739583" stopColor="#0C0C0C" />
            <stop offset="0.776042" stopColor="#090909" />
            <stop offset="0.802083" stopColor="#070707" />
            <stop offset="0.838484" stopColor="#050505" />
            <stop offset="0.894232" stopColor="#0D0D0D" />
            <stop offset="0.921875" stopColor="#0C0C0C" />
            <stop offset="0.96875" stopColor="#0C0C0C" />
            <stop offset="1" stopColor="white" />
          </radialGradient>
        </defs>
        <g transform={recordTransform}>
        <circle cx="211.52" cy="256.418" r="43.2343" transform="rotate(117.592 211.52 256.418)" fill={`url(#${linear})`} fillOpacity="0.83" />
        <circle cx="211.869" cy="256.326" r="23.0803" fill="black" />
        <path d="M212.152 239.264C221.347 239.185 228.865 246.575 228.943 255.77C229.022 264.965 221.632 272.483 212.437 272.562C203.242 272.641 195.724 265.25 195.645 256.055C195.567 246.86 202.957 239.343 212.152 239.264ZM212.367 264.371C217.038 264.331 220.792 260.511 220.752 255.84C220.712 251.169 216.893 247.415 212.222 247.455C207.551 247.495 203.797 251.314 203.837 255.985C203.877 260.656 207.696 264.411 212.367 264.371Z" fill="white" />
        <path d="M212.152 239.264C221.347 239.185 228.865 246.575 228.943 255.77C229.022 264.965 221.632 272.483 212.437 272.562C203.242 272.641 195.724 265.25 195.645 256.055C195.567 246.86 202.957 239.343 212.152 239.264ZM212.367 264.371C217.038 264.331 220.792 260.511 220.752 255.84C220.712 251.169 216.893 247.415 212.222 247.455C207.551 247.495 203.797 251.314 203.837 255.985C203.877 260.656 207.696 264.411 212.367 264.371Z" fill={`url(#${radialA})`} fillOpacity="0.7" />
        <path d="M212.152 239.264C221.347 239.185 228.865 246.575 228.943 255.77C229.022 264.965 221.632 272.483 212.437 272.562C203.242 272.641 195.724 265.25 195.645 256.055C195.567 246.86 202.957 239.343 212.152 239.264ZM212.367 264.371C217.038 264.331 220.792 260.511 220.752 255.84C220.712 251.169 216.893 247.415 212.222 247.455C207.551 247.495 203.797 251.314 203.837 255.985C203.877 260.656 207.696 264.411 212.367 264.371Z" fill="white" />
        <path d="M212.152 239.264C221.347 239.185 228.865 246.575 228.943 255.77C229.022 264.965 221.632 272.483 212.437 272.562C203.242 272.641 195.724 265.25 195.645 256.055C195.567 246.86 202.957 239.343 212.152 239.264ZM212.367 264.371C217.038 264.331 220.792 260.511 220.752 255.84C220.712 251.169 216.893 247.415 212.222 247.455C207.551 247.495 203.797 251.314 203.837 255.985C203.877 260.656 207.696 264.411 212.367 264.371Z" fill={`url(#${radialB})`} fillOpacity="0.7" />
        <circle cx="212.288" cy="255.908" r="3.35713" fill="#D9D9D9" />
        </g>
      </svg>
    )
  }

  if (era === 'tape') {
    const linear = `${prefix}-submit-top-tape-linear`
    const recordTransform = getRecordTransform(288.002, 243.917, 68.932)

    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={linear} x1="277.222" y1="266.968" x2="306.19" y2="228.613" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D9D9D9" stopOpacity="0.03" />
            <stop offset="0.447115" stopColor="#7E82EB" stopOpacity="0.74" />
            <stop offset="1" stopColor="#7E82EB" />
          </linearGradient>
        </defs>
        <g transform={recordTransform}>
        <circle cx="288.002" cy="243.917" r="34.466" transform="rotate(12.2515 288.002 243.917)" fill={`url(#${linear})`} fillOpacity="0.55" />
        <circle cx="287.972" cy="242.769" r="17.4016" transform="rotate(43.4491 287.972 242.769)" fill="black" />
        <path d="M301.331 240.919C302.094 241.358 302.356 242.333 301.916 243.096L296.062 253.253C295.622 254.016 294.647 254.278 293.884 253.839L276.556 243.865C275.793 243.426 275.53 242.451 275.97 241.689L281.825 231.531C282.265 230.768 283.24 230.506 284.003 230.945L301.331 240.919ZM285.267 237.952C284.363 237.432 283.229 237.706 282.734 238.565C282.239 239.424 282.571 240.541 283.475 241.062C284.378 241.582 285.512 241.308 286.007 240.449C286.502 239.59 286.17 238.473 285.267 237.952ZM295.085 243.604C294.181 243.084 293.047 243.358 292.553 244.217C292.058 245.075 292.389 246.193 293.293 246.713C294.197 247.233 295.331 246.959 295.825 246.1C296.32 245.242 295.989 244.124 295.085 243.604Z" fill="black" />
        <path d="M294.326 253.072L293.884 253.839L276.556 243.866L276.998 243.098L294.326 253.072ZM295.294 252.812L301.149 242.654C301.338 242.326 301.235 241.909 300.92 241.706L300.888 241.687L283.561 231.713C283.221 231.518 282.788 231.634 282.593 231.973L276.738 242.131C276.542 242.47 276.659 242.903 276.998 243.098L276.556 243.866C275.793 243.426 275.53 242.452 275.97 241.689L281.825 231.532C282.265 230.769 283.24 230.506 284.003 230.946L301.331 240.919C302.094 241.359 302.356 242.333 301.916 243.096L296.062 253.253C295.622 254.016 294.647 254.279 293.884 253.839L294.326 253.072C294.665 253.267 295.099 253.151 295.294 252.812ZM286.007 240.449C286.502 239.591 286.17 238.473 285.267 237.953C284.363 237.433 283.229 237.707 282.734 238.565C282.239 239.424 282.571 240.542 283.475 241.062C284.378 241.582 285.512 241.308 286.007 240.449ZM295.825 246.101C296.305 245.269 296.009 244.194 295.168 243.655L295.085 243.604C294.181 243.084 293.047 243.358 292.553 244.217C292.058 245.075 292.389 246.193 293.293 246.713C294.197 247.234 295.331 246.959 295.825 246.101ZM286.775 240.891C286.015 242.21 284.323 242.572 283.032 241.829C281.742 241.087 281.206 239.442 281.966 238.124C282.727 236.805 284.419 236.443 285.709 237.185C286.999 237.928 287.535 239.572 286.775 240.891ZM296.593 246.543C295.833 247.861 294.141 248.224 292.851 247.481C291.56 246.738 291.025 245.094 291.785 243.775C292.545 242.456 294.237 242.094 295.528 242.837C296.818 243.58 297.353 245.224 296.593 246.543Z" fill="#7F7E7E" />
        <path d="M286.654 232.983L297.868 239.549L297.582 240.038C296.896 241.209 295.447 241.634 294.344 240.988L287.124 236.76C286.021 236.114 285.683 234.642 286.368 233.472L286.654 232.983Z" fill="#7F7E7E" />
        </g>
      </svg>
    )
  }

  if (era === 'digital') {
    const linear = `${prefix}-submit-top-digital-linear`
    const recordTransform = getRecordTransform(284.4115, 165.3255, 106.927, 1.16)

    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={linear} x1="288.107" y1="199.709" x2="269.705" y2="108.244" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D9D9D9" stopOpacity="0.03" />
            <stop offset="0.643634" stopColor="#29E3E1" />
            <stop offset="1" stopColor="#29E3E1" />
          </linearGradient>
        </defs>
        <g transform={recordTransform}>
        <path d="M324.476 141.064C337.875 163.191 330.8 191.991 308.673 205.39C286.546 218.789 257.747 211.714 244.347 189.587C230.948 167.46 238.023 138.661 260.15 125.261C282.277 111.862 311.077 118.937 324.476 141.064Z" fill={`url(#${linear})`} fillOpacity="0.55" />
        <path d="M302.123 165.06C302.123 175.548 293.621 184.05 283.133 184.05C272.645 184.05 264.143 175.548 264.143 165.06C264.143 154.572 272.645 146.07 283.133 146.07C293.621 146.07 302.123 154.572 302.123 165.06Z" fill="#555555" />
        <path d="M302.122 165.06C302.122 154.736 293.884 146.336 283.623 146.076L283.133 146.07C272.645 146.07 264.142 154.572 264.142 165.06L264.149 165.55C264.405 175.648 272.544 183.787 282.642 184.043L283.133 184.05C293.457 184.049 301.856 175.811 302.116 165.55L302.122 165.06ZM312.671 165.06C312.671 181.374 299.446 194.598 283.133 194.598C266.819 194.598 253.594 181.374 253.594 165.06C253.594 148.746 266.819 135.521 283.133 135.521C299.447 135.521 312.671 148.746 312.671 165.06Z" fill="black" />
        <path d="M290.813 153.726L277.838 157.558C277.575 157.64 277.345 157.805 277.181 158.027C277.018 158.25 276.93 158.519 276.929 158.795V169.396C276.504 169.293 276.069 169.24 275.632 169.237C273.482 169.237 271.739 170.399 271.739 171.833C271.739 173.266 273.482 174.428 275.632 174.428C277.781 174.428 279.525 173.266 279.525 171.833V162.356L289.906 159.314V166.801C289.481 166.698 289.046 166.644 288.608 166.642C286.459 166.642 284.715 167.804 284.715 169.237C284.715 170.67 286.459 171.833 288.608 171.833C290.758 171.833 292.501 170.671 292.501 169.237V154.962C292.501 154.758 292.453 154.558 292.361 154.376C292.268 154.194 292.135 154.037 291.97 153.917C291.806 153.796 291.616 153.716 291.415 153.683C291.214 153.65 291.008 153.664 290.813 153.726Z" fill="#D9D9D9" />
        </g>
      </svg>
    )
  }

  return null
}
