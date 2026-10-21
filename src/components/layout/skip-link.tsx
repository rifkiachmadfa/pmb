/** First focusable element: lets keyboard users jump past the header. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed left-4 top-4 z-50 -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Lewati ke konten utama
    </a>
  );
}
