import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Flower2, ShoppingCart, Menu } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EU NO CONTROLE - Dashboard de Produtos",
  description: "Sistema de gerenciamento de produtos e vendas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-background flex flex-col md:flex-row text-foreground`}>
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 glass fixed top-0 w-full z-50">
          <h1 className="text-lg font-bold gradient-text">EU NO CONTROLE</h1>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/20" />
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border glass flex-col fixed h-full z-50">
          <div className="p-6">
            <h1 className="text-xl font-bold gradient-text">EU NO CONTROLE</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestão de Produtos</p>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors group">
              <LayoutDashboard size={20} className="text-primary group-hover:scale-110 transition-transform" />
              <span>Dashboard</span>
            </Link>
            <Link href="/buques" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors group">
              <Flower2 size={20} className="text-secondary group-hover:scale-110 transition-transform" />
              <span>Produtos</span>
            </Link>
            <Link href="/vendas" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors group">
              <ShoppingCart size={20} className="text-accent group-hover:scale-110 transition-transform" />
              <span>Vendas</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary border-2 border-white/10 shadow-xl" />
              <div>
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Online</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden min-h-screen pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#181825]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around py-3 px-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl group-active:bg-primary/20 transition-colors">
              <LayoutDashboard size={22} className="text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 group-active:opacity-100">Home</span>
          </Link>
          <Link href="/buques" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl group-active:bg-secondary/20 transition-colors">
              <Flower2 size={22} className="text-secondary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 group-active:opacity-100">Produtos</span>
          </Link>
          <Link href="/vendas" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl group-active:bg-accent/20 transition-colors">
              <ShoppingCart size={22} className="text-accent" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 group-active:opacity-100">Vendas</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
