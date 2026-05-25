import { memo } from 'react'
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

function EraDiamondFocus({ activeEra }: Props) {
  const activeDiamond = diamonds.find((diamond) => diamond.era === activeEra)

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[5]">
        {diamonds.map(({ era, panel }) => {
          const isDimmed = activeEra !== null && activeEra !== era
          return (
            <img
              key={`panel-${era}`}
              src={panel}
              alt=""
              className={
                'era-diamond-layer absolute inset-0 z-[3] h-full w-full select-none object-fill' +
                (isDimmed ? ' era-diamond-dimmed' : '')
              }
            />
          )
        })}

        {diamonds.map(({ era, icon }) => {
          const isActive = activeEra === era
          const isDimmed = activeEra !== null && !isActive
          if (isActive) return null

          return (
            <img
              key={`icon-${era}`}
              src={icon}
              alt=""
              className={
                'era-diamond-layer absolute inset-0 z-[5] h-full w-full select-none object-fill' +
                (isDimmed ? ' era-diamond-dimmed' : '')
              }
            />
          )
        })}
      </div>

      {activeDiamond ? (
        <div className="pointer-events-none absolute inset-0 z-[30]">
          <img
            key={`active-icon-${activeDiamond.era}`}
            src={activeDiamond.icon}
            alt=""
            className="era-diamond-layer era-diamond-icon-lift absolute inset-0 h-full w-full select-none object-fill"
          />
        </div>
      ) : null}
    </>
  )
}

export default memo(EraDiamondFocus)
