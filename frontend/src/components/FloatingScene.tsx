export default function FloatingScene() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {[
        ['left-[520px] top-[498px]', '🎵', '#555555'],
        ['left-[696px] top-[283px]', '🎵', '#F5ABDE'],
        ['left-[934px] top-[454px]', '💬', '#1B202C'],
        ['left-[1110px] top-[660px]', '🎧', '#29E3E1'],
        ['left-[590px] top-[842px]', '💿', '#9E75D2'],
      ].map(([pos, icon, color]) => (
        <div key={pos} className={`float-ball absolute ${pos} flex h-[92px] w-[92px] items-center justify-center rounded-full border-[13px] border-black text-[34px] text-white shadow-[0_18px_38px_rgba(0,0,0,0.35)]`} style={{ backgroundColor: color, animationDuration: '6s' }}>
          {icon}
        </div>
      ))}
    </div>
  )
}
