import { useEffect, useRef } from "react";
import Hls from "hls.js";

type Props = {
  src: string;
  className?: string;
};

/** 100ms recording playback — video only (MP4 or HLS). */
export function RecordingPlayer({ src, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    const isHls = src.includes(".m3u8") || src.includes("playlist");
    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <video ref={videoRef} className={className} controls playsInline preload="metadata" />
  );
}
