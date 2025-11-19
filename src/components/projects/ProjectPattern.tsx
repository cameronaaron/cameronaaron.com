'use client';

export default function ProjectPattern({ index }: { index: number }) {
  const patterns = [
    // Pattern 1: Grid
    <div key="1" className="absolute inset-0 opacity-20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]" />
    </div>,
    // Pattern 2: Dots
    <div key="2" className="absolute inset-0 opacity-20">
      <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>,
    // Pattern 3: Diagonal Lines
    <div key="3" className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#7c3aed_10px,#7c3aed_11px)]" />
    </div>
  ];

  return patterns[index % patterns.length];
}
