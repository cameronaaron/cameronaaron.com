export default function Loading() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-14 w-14">
          <span className="absolute inset-0 rounded-full border-2 border-cyan-300/20" />
          <span className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Loading...
        </p>
      </div>
    </div>
  );
}
