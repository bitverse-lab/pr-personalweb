import { LocaleProvider } from "@/lib/i18n/context";
import LangSync from "@/components/shared/LangSync";

// Every page under /id renders in Indonesian. The wrapper's lang covers server-rendered text for
// screen readers and crawlers; LangSync keeps <html lang> right on client-side navigation.
export default function IndonesianLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale="id">
      <LangSync />
      <div lang="id">{children}</div>
    </LocaleProvider>
  );
}
