import { Header } from "@/components/nav/Header";
import { GlassFABNav } from "@/components/nav/GlassFABNav";
import { Footer } from "@/components/footer/Footer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[var(--surface-bg)]">
      <AnnouncementBanner />
      <Header />
      <main className="flex-1 flex flex-col relative z-0 pb-24 md:pb-10 lg:px-8">{children}</main>
      <Footer />
      <div className="md:hidden">
        <GlassFABNav />
      </div>
    </div>
  );
}
