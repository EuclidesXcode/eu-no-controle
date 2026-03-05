import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Flower2, ShoppingCart, BarChart3 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EU NO CONTROLE - Dashboard de Buquês",
  description: "Sistema de gerenciamento de buquês e vendas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-background flex text-foreground`}>
        {/* Sidebar */}
        <aside className="w-64 border-r border-border glass flex flex-col fixed h-full z-50">
          <div className="p-6">
            <h1 className="text-xl font-bold gradient-text">EU NO CONTROLE</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestão de Buquês</p>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
              <LayoutDashboard size={20} className="text-primary" />
              <span>Dashboard</span>
            </Link>
            <Link href="/buques" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
              <Flower2 size={20} className="text-secondary" />
              <span>Buquês</span>
            </Link>
            <Link href="/vendas" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
              <ShoppingCart size={20} className="text-accent" />
              <span>Vendas</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary" />
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
