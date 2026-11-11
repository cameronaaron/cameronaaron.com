import Link from 'next/link';
import { buildNotFoundMetadata } from '@/data/metadata';

export const metadata = buildNotFoundMetadata();

export default function NotFound() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="text-[11px] font-semibold text-primary/80 mb-4">
          404
        </p>
        <h1 className="text-4xl font-bold text-foreground mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/20 hover:border-primary/50"
        >
          ← Back home
        </Link>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-success/40 to-transparent" />
      </div>
    </div>
  );
}
