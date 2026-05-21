export default function StatusBar() {
  return (
    <header className="absolute left-1/2 top-[58px] z-40 flex h-[85px] w-[677px] -translate-x-1/2 items-center justify-center rounded-full px-10 shadow-[0_18px_50px_rgba(0,0,0,0.45)]" style={{ background: 'linear-gradient(180deg, rgba(16,16,16,1) 0%, rgba(0,0,0,0.88) 100%)', border: '2px solid rgba(255,255,255,0.45)', backdropFilter: 'blur(4.3px)' }}>
      <h1 className="text-[32px] font-black tracking-[0.24em] text-white" style={{ textShadow: '0 0 14px rgba(252,175,228,0.45)' }}>
        信义坊社区音乐榜单
      </h1>
    </header>
  )
}
