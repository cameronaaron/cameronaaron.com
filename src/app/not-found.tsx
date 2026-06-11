import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-cyan-400/80 mb-4">
          404
        </p>
        <h1 className="text-4xl font-bold text-foreground mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 hover:border-cyan-300/50"
        >
          ← Back home
        </Link>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
      </div>
    </div>
  );
}
