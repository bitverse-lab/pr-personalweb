// A template (unlike a layout) is re-created on every navigation, so the page fades in each time it changes.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
