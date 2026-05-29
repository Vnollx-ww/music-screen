import React, { useEffect, useState } from 'react';

type FullscreenToggleButtonProps = {
  className?: string;
};

// 简单的全屏切换按钮组件：右下角圆形按钮，使用浏览器 Fullscreen API
const FullscreenToggleButton: React.FC<FullscreenToggleButtonProps> = ({ className }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleChange = () => {
      const fsElement =
        document.fullscreenElement ||
        // 兼容部分老浏览器前缀（TS 里做类型断言）
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange as any);
    document.addEventListener('mozfullscreenchange', handleChange as any);
    document.addEventListener('MSFullscreenChange', handleChange as any);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange as any);
      document.removeEventListener('mozfullscreenchange', handleChange as any);
      document.removeEventListener('MSFullscreenChange', handleChange as any);
    };
  }, []);

  const enterFullscreen = async () => {
    const docEl: any = document.documentElement;
    if (docEl.requestFullscreen) return docEl.requestFullscreen();
    if (docEl.webkitRequestFullscreen) return docEl.webkitRequestFullscreen();
    if (docEl.mozRequestFullScreen) return docEl.mozRequestFullScreen();
    if (docEl.msRequestFullscreen) return docEl.msRequestFullscreen();
  };

  const exitFullscreen = async () => {
    const doc: any = document;
    if (document.exitFullscreen) return document.exitFullscreen();
    if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
    if (doc.mozCancelFullScreen) return doc.mozCancelFullScreen();
    if (doc.msExitFullscreen) return doc.msExitFullscreen();
  };

  const handleClick = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  return (
    <button
      type="button"
      className={`fullscreen-toggle-btn ${isFullscreen ? 'fullscreen-toggle-btn--active' : ''} ${
        className ?? ''
      }`.trim()}
      onClick={handleClick}
      aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
    >
      <span className="fullscreen-toggle-icon">
        {/* 采用简单几何图形做 ICON：非全屏时是四角、全屏时是收缩的角 */}
        <span className="fullscreen-toggle-corner fullscreen-toggle-corner--tl" />
        <span className="fullscreen-toggle-corner fullscreen-toggle-corner--tr" />
        <span className="fullscreen-toggle-corner fullscreen-toggle-corner--bl" />
        <span className="fullscreen-toggle-corner fullscreen-toggle-corner--br" />
      </span>
    </button>
  );
};

export default FullscreenToggleButton;
