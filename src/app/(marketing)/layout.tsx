import { Header } from "@/components/nav/Header";
import { GlassFABNav } from "@/components/nav/GlassFABNav";
import { Footer } from "@/components/footer/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-8">{children}</main>
      <Footer />
      <div className="md:hidden">
        <GlassFABNav />
      </div>
    </div>
  );
}
