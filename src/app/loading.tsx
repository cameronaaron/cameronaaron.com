export default function Loading() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-14 w-14">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <span className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Loading...
        </p>
      </div>
    </div>
  );
}
