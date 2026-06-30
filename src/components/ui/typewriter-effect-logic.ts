export function getVisibleTypedText(displayedText: string, text: string): string {
  return displayedText || text.charAt(0);
}
