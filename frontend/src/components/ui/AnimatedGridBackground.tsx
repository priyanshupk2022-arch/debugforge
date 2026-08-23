import React from "react";

export function AnimatedGridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep Cyber Radial Glows */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-950/40 via-violet-950/20 to-transparent blur-3xl rounded-full" />
      <div className="absolute top-[30%] -left-[10%] w-[600px] h-[600px] bg-cyan-950/20 blur-3xl rounded-full" />
      <div className="absolute top-[60%] -right-[10%] w-[600px] h-[600px] bg-emerald-950/20 blur-3xl rounded-full" />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
