import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ResQLogo from "./ResQLogo";

export const PremiumLoader = ({ onComplete }) => {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const textRef = useRef(null);
  const subtitleRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });

      // 1. Initial State
      gsap.set([ring1Ref.current, ring2Ref.current], { scale: 0.8, opacity: 0 });
      gsap.set(logoRef.current, { scale: 0.6, opacity: 0 });
      gsap.set(textRef.current, { y: 20, opacity: 0 });
      gsap.set(subtitleRef.current, { opacity: 0 });
      gsap.set(progressBarRef.current, { width: "0%" });

      // 2. Entrance & Expansion Sequence
      tl.to(logoRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: "back.out(1.7)",
      })
        .to(
          ring1Ref.current,
          {
            scale: 1.5,
            opacity: 0.4,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.4"
        )
        .to(
          ring2Ref.current,
          {
            scale: 2.1,
            opacity: 0.2,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .to(
          textRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.2"
        )
        .to(progressBarRef.current, {
          width: "100%",
          duration: 0.8,
          ease: "power1.inOut",
        })
        // 3. Exit Animation
        .to(containerRef.current, {
          opacity: 0,
          scale: 1.05,
          duration: 0.5,
          ease: "power2.inOut",
        });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950 text-white select-none"
    >
      {/* Expanding Pulse Rings */}
      <div className="relative flex items-center justify-center mb-6">
        <div
          ref={ring2Ref}
          className="absolute w-36 h-36 rounded-full border border-cyan-500/30 pointer-events-none"
        />
        <div
          ref={ring1Ref}
          className="absolute w-28 h-28 rounded-full border border-emergency-500/40 pointer-events-none"
        />
        <div ref={logoRef} className="relative z-10">
          <ResQLogo className="w-20 h-20" />
        </div>
      </div>

      {/* Brand Title */}
      <h1
        ref={textRef}
        className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-dark-200 to-emergency-400 bg-clip-text text-transparent"
      >
        ResQ AI
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="text-xs uppercase tracking-widest text-dark-400 mt-2 font-mono"
      >
        Emergency Coordination Platform
      </p>

      {/* Sleek Progress Bar */}
      <div className="w-48 h-1 bg-dark-800 rounded-full overflow-hidden mt-6">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-emergency-500 to-cyan-400 rounded-full"
        />
      </div>
    </div>
  );
};

export default PremiumLoader;

