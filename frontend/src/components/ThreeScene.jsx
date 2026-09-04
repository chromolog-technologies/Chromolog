import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const VIDEO_SRC_1 = "/videos/logo animation.mp4";
const VIDEO_SRC_2 = "/videos/logo animation 2.mp4";
const FALLBACK_LOGO = "/images/chromologtechnologies.webp";

export default function ThreeScene() {
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const sweepRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    const sweep = sweepRef.current;
    if (!stage || !card) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(card, { opacity: 1, rotateY: 0, rotateX: 0, y: 0, scale: 1 });
      if (sweep) gsap.set(sweep, { opacity: 0 });
      return;
    }

    gsap.set(card, { opacity: 0, rotateY: -12, rotateX: 6, y: 24, scale: 0.92 });
    if (sweep) gsap.set(sweep, { xPercent: -130, opacity: 0 });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline
      .to(card, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 0)
      .to(card, { rotateY: 20, rotateX: -5, duration: 1.2, ease: "power2.inOut" }, 0.2);

    if (sweep) {
      timeline
        .to(sweep, { opacity: 1, duration: 0.2 }, 0.8)
        .to(sweep, { xPercent: 130, duration: 1.1, ease: "power2.inOut" }, 0.8)
        .to(sweep, { opacity: 0, duration: 0.25 }, 1.8);
    }

    timeline.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "power3.out" }, 1.8);

    const idle = gsap.to(card, {
      y: -10,
      rotateY: 2,
      duration: 3.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      paused: true,
    });
    timeline.eventCallback("onComplete", () => idle.play());

    let inView = true;
    const syncPaused = () => {
      const shouldPause = document.hidden || !inView;
      timeline.paused(shouldPause);
      if (timeline.progress() >= 1) idle.paused(shouldPause);
      if (videoRef.current) {
        if (shouldPause) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncPaused();
      },
      { threshold: 0.05 }
    );
    io.observe(stage);
    document.addEventListener("visibilitychange", syncPaused);

    return () => {
      timeline.kill();
      idle.kill();
      io.disconnect();
      document.removeEventListener("visibilitychange", syncPaused);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="w-full h-full min-h-[360px] md:min-h-[480px] relative flex items-center justify-center p-2"
      style={{ perspective: "1100px" }}
    >
      {/* Radiant Multi-layered Neon Ambient Aura */}
      <div className="absolute inset-[10%] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-purple-600/30 blur-[90px] animate-pulse" />
      <div className="absolute inset-[25%] rounded-full bg-purple-500/25 blur-[110px]" />

      <div
        ref={cardRef}
        className="relative w-full max-w-[500px] aspect-video sm:aspect-square flex items-center justify-center rounded-3xl overflow-hidden border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,229,255,0.2)] group"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glowing border highlight */}
        <div className="absolute inset-0 rounded-3xl border border-cyan-400/30 group-hover:border-purple-400/50 transition-colors duration-500 pointer-events-none z-20" />

        {/* Video Player Showcase */}
        <div className="relative w-full h-full flex items-center justify-center p-2 z-10 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
          >
            <source src={VIDEO_SRC_1} type="video/mp4" />
            <source src={VIDEO_SRC_2} type="video/mp4" />
            <img src={FALLBACK_LOGO} alt="Chromolog Technologies Logo" className="w-full h-full object-contain" />
          </video>

          {/* Light Sweep Overlay */}
          <div
            ref={sweepRef}
            className="absolute inset-y-[-10%] w-1/3 -skew-x-12 pointer-events-none mix-blend-screen"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.0) 10%, rgba(56,189,248,0.4) 45%, rgba(168,85,247,0.4) 70%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

