// Templates remount on navigation so page-local client state resets.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
