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
  const visibleDiamonds = activeEra ? diamonds.filter(({ era }) => era === activeEra) : diamonds

  return (
    <div className="pointer-events-none absolute inset-0 z-[3]">
      {visibleDiamonds.map(({ era, panel, icon }) => (
        <div key={era} className={'absolute inset-0 ' + (activeEra ? 'era-diamond-focus-active' : '')}>
          <img src={panel} alt="" className="absolute inset-0 h-full w-full select-none object-fill" />
          <img src={icon} alt="" className="absolute inset-0 h-full w-full select-none object-fill" />
        </div>
      ))}
    </div>
  )
}
