import { QRCodeSVG } from 'qrcode.react'

export default function QRCode() {
  const lanHost = import.meta.env.VITE_LAN_HOST || window.location.hostname
  const lanPort = import.meta.env.VITE_LAN_PORT || window.location.port
  const url = `http://${lanHost}:${lanPort}/?mode=vote`

  return (
    <div className="absolute bottom-[58px] right-[66px] z-30 flex flex-col items-end gap-3">
      <div className="flex h-[132px] w-[138px] items-center justify-center bg-[#D9D9D9]">
        <QRCodeSVG
          value={url}
          size={98}
          bgColor="#D9D9D9"
          fgColor="#000000"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-right text-[18px] font-bold tracking-[0.16em] text-white">
        欢迎居民扫码推榜！
      </p>
    </div>
  )
}
