import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import CommandPalette from '@/components/ui/CommandPalette';
import BackToTop from '@/components/ui/BackToTop';

/**
 * The home page's global overlays: keyboard shortcuts, the command palette and
 * the back-to-top button. Each is its own client island; this wrapper is a
 * Server Component and adds no JS of its own.
 *
 * It used to mount an intro curtain, an ambient orb field, a film-grain layer,
 * a cursor comet, a tap ripple, a section rail and a second progress bar. All
 * of that sat between the visitor and the content, so it is gone.
 */
export default function PageChrome() {
  return (
    <>
      <KeyboardShortcuts />
      <CommandPalette />
      <BackToTop />
    </>
  );
}
