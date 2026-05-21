import { QRCodeSVG } from 'qrcode.react'

export default function QRCode() {
  const lanHost = import.meta.env.VITE_LAN_HOST || window.location.hostname
  const lanPort = import.meta.env.VITE_LAN_PORT || window.location.port
  const url = `http://${lanHost}:${lanPort}/?mode=mobile`

  return (
    <div className="absolute bottom-[42px] right-[56px] z-30 flex flex-col items-center gap-3">
      <div className="glass-panel relative flex h-[154px] w-[154px] items-center justify-center rounded-[24px] p-4 shadow-[0_0_50px_rgba(41,227,225,0.18)]">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="rounded-xl bg-white p-2">
          <QRCodeSVG
            value={url}
            size={112}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin={false}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-black tracking-[0.3em] text-cyan-100/80">欢迎居民扫码推榜</p>
      </div>
    </div>
  )
}
