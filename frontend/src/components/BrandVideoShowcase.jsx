import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Sparkles, ShieldCheck, Film } from "lucide-react";
import Badge from "./ui/Badge";

const VIDEO_SRC = "/videos/logo animation 2.mp4";
const VIDEO_FALLBACK = "/videos/logo animation.mp4";
const LOGO_IMG = "/images/chromologtechnologies.webp";

export default function BrandVideoShowcase() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let inView = true;
    const syncVideo = () => {
      if (document.hidden || !inView) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncVideo();
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    document.addEventListener("visibilitychange", syncVideo);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVideo);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section
      ref={containerRef}
      className="relative py-16 md:py-24 bg-[#060818] border-b border-white/10 overflow-hidden"
      id="brand-video"
    >
      {/* Radiant Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-indigo-600/15 to-purple-600/20 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 text-center">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto space-y-3">
          <Badge variant="ai" className="px-3.5 py-1 text-xs">
            <Film className="w-3.5 h-3.5 mr-1.5 inline text-cyan-400" />
            Brand Signature
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Chromolog in Motion: <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Identity &amp; Vision Showcase
            </span>
          </h2>
          <p className="text-xs sm:text-base text-slate-300 font-body leading-relaxed max-w-xl mx-auto">
            Experience our official brand identity animation representing high-precision engineering, scalable architecture, and modern digital innovation.
          </p>
        </div>

        {/* Cinematic Video Showcase Card */}
        <div className="max-w-4xl mx-auto relative group">
          
          {/* Ambient Glow Box */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Video Container Frame */}
          <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            
            {/* Top Window Bar */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-white/[0.04] border-b border-white/10 text-xs font-heading font-semibold text-slate-300 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-2 text-slate-400 font-mono text-[11px]">chromolog-brand-signature-v2.mp4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">4K Ultra HD</span>
              </div>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video w-full bg-black/40 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={VIDEO_SRC} type="video/mp4" />
                <source src={VIDEO_FALLBACK} type="video/mp4" />
                <img src={LOGO_IMG} alt="Chromolog Logo" className="w-full h-full object-contain" />
              </video>

              {/* Overlay Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3 z-20">
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="p-3 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-110"
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400 ml-0.5" />}
                </button>
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="p-3 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-110"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-purple-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                </button>
              </div>

              {/* Light Sweep Highlight */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
