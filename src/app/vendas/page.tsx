"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Search, Calendar, FileText, Download, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VendasPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchSales();
    }, []);

    async function fetchSales() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("sales")
                .select(`
          *,
          bouquets (
            name
          )
        `)
                .order("sale_date", { ascending: false });

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
        } finally {
            setLoading(false);
        }
    }

    const totals = sales.reduce((acc, sale) => ({
        revenue: acc.revenue + sale.total_price,
        profit: acc.profit + (sale.total_price - (sale.cost_price_at_sale || 0) - (sale.tax_value || 0) - (sale.commission_value || 7))
    }), { revenue: 0, profit: 0 });

    const filteredSales = sales.filter(s =>
        s.bouquets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Finanças</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">Monitore lucros e histórico de vendas.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#181825] hover:bg-white/10 text-white px-4 py-3 md:py-2 rounded-2xl md:rounded-lg transition-all border border-white/5 font-semibold text-sm">
                        <Download size={18} />
                        Exportar
                    </button>
                    <Link
                        href="/vendas/nova"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-3 md:py-2 rounded-2xl md:rounded-lg transition-all shadow-lg shadow-accent/20 font-bold text-sm"
                    >
                        <Plus size={20} />
                        Nova Venda
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-primary flex-shrink-0 min-w-[200px] sm:min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-primary opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Volume Total</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold">R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-accent flex-shrink-0 min-w-[200px] sm:min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-accent opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Lucro Líquido</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-accent">R$ {totals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-secondary flex-shrink-0 min-w-[200px] sm:min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag size={14} className="text-secondary opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Transações</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold">{sales.length}</p>
                </div>
            </div>

            <div className="glass-card rounded-2xl md:rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/40">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4 bg-white/[0.02]">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar no histórico..."
                            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Ítem</th>
                                <th className="px-6 py-4">Metodo</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-accent text-right font-bold">Lucro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Buscando vendas...</td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Nenhuma venda registrada.</td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            {sale.bouquets?.name || "Deletado"}
                                            <span className="ml-2 text-[10px] bg-white/5 px-2 py-1 rounded-full text-muted-foreground">x{sale.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${sale.payment_method === 'Pix' ? 'bg-accent/10 text-accent border border-accent/20' :
                                                sale.payment_method === 'Cartão Crédito' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                    'bg-muted/50 text-muted-foreground border border-white/5'
                                                }`}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">R$ {sale.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right font-bold text-accent">
                                            R$ {(sale.total_price - (sale.cost_price_at_sale || 0) - (sale.tax_value || 0) - (sale.commission_value || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-border">
                    {loading ? (
                        <div className="p-10 text-center text-muted-foreground">Buscando...</div>
                    ) : filteredSales.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground text-sm">Nenhuma venda encontrada.</div>
                    ) : (
                        filteredSales.map((sale) => (
                            <div key={sale.id} className="p-4 space-y-3 active:bg-white/5 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">
                                            {format(new Date(sale.sale_date), "dd MMM, HH:mm", { locale: ptBR })}
                                        </span>
                                        <h4 className="font-bold text-base leading-tight mt-1">{sale.bouquets?.name}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sale.payment_method === 'Pix' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                                                {sale.payment_method}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Qtd: {sale.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-sm font-semibold text-muted-foreground leading-none">R$ {sale.total_price.toFixed(2)}</span>
                                        <span className="text-lg font-black text-accent mt-1">
                                            + R$ {(sale.total_price - (sale.cost_price_at_sale || 0) - (sale.tax_value || 0) - (sale.commission_value || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Lucro Líquido</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
