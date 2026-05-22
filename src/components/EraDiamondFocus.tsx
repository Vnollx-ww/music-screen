import type { Era } from '../types/song'

import vinylPanel from '../svg/circles-overlay/diamonds/vinyl/Panel.svg'
import vinylIcon from '../svg/circles-overlay/diamonds/vinyl/Icon.svg'
import cdPanel from '../svg/circles-overlay/diamonds/cd/Panel.svg'
import cdIcon from '../svg/circles-overlay/diamonds/cd/Icon.svg'
import tapePanel from '../svg/circles-overlay/diamonds/tape/Panel.svg'
import tapeIcon from '../svg/circles-overlay/diamonds/tape/Icon.svg'
import digitalPanel from '../svg/circles-overlay/diamonds/digital/Panel.svg'
import digitalIcon from '../svg/circles-overlay/diamonds/digital/Icon.svg'
import aiPanel from '../svg/circles-overlay/diamonds/ai/Panel.svg'
import aiIcon from '../svg/circles-overlay/diamonds/ai/Icon.svg'

interface Props {
  activeEra: Era | null
}

const diamonds: { era: Era; panel: string; icon: string }[] = [
  { era: 'vinyl', panel: vinylPanel, icon: vinylIcon },
  { era: 'cd', panel: cdPanel, icon: cdIcon },
  { era: 'tape', panel: tapePanel, icon: tapeIcon },
  { era: 'digital', panel: digitalPanel, icon: digitalIcon },
  { era: 'ai', panel: aiPanel, icon: aiIcon },
]

export default function EraDiamondFocus({ activeEra }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {diamonds.map(({ era, panel, icon }) => {
        const isActive = activeEra === era
        const isDimmed = activeEra !== null && !isActive
        return (
          <div key={era} className="absolute inset-0">
            <img
              src={panel}
              alt=""
              className={
                'era-diamond-layer absolute inset-0 z-[3] h-full w-full select-none object-fill' +
                (isDimmed ? ' era-diamond-dimmed' : '')
              }
            />
            <img
              src={icon}
              alt=""
              className={
                'era-diamond-layer absolute inset-0 z-[5] h-full w-full select-none object-fill' +
                (isActive ? ' era-diamond-icon-lift' : '') +
                (isDimmed ? ' era-diamond-dimmed' : '')
              }
            />
          </div>
        )
      })}
    </div>
  )
}
