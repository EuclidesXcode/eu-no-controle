"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Search, Calendar, FileText, Download } from "lucide-react";
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vendas & Relatórios</h2>
                    <p className="text-muted-foreground">Monitore o desempenho financeiro e histórico de vendas.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-all border border-border">
                        <Download size={18} />
                        Exportar
                    </button>
                    <Link
                        href="/vendas/nova"
                        className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105"
                    >
                        <Plus size={20} />
                        Nova Venda
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-6 glass-card rounded-xl border-l-4 border-primary">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total de Vendas</p>
                    <p className="text-2xl font-bold mt-1">R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 glass-card rounded-xl border-l-4 border-accent">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Lucro Estimado</p>
                    <p className="text-2xl font-bold mt-1 text-accent">R$ {totals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 glass-card rounded-xl border-l-4 border-secondary">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Quantidade de Vendas</p>
                    <p className="text-2xl font-bold mt-1">{sales.length}</p>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar histórico..."
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-white/5 rounded-lg border border-border hover:bg-white/10 transition-colors">
                            <Calendar size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-sm font-medium text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Ítem</th>
                                <th className="px-6 py-4">Método Pagto</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Taxa</th>
                                <th className="px-6 py-4">Comissão</th>
                                <th className="px-6 py-4 text-primary font-bold">Lucro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Buscando vendas...</td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Nenhuma venda registrada.</td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {sale.bouquets?.name || "Produto Excluído"}
                                            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded text-muted-foreground">x{sale.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${sale.payment_method === 'Pix' ? 'bg-accent/20 text-accent' :
                                                sale.payment_method === 'Cartão Crédito' ? 'bg-primary/20 text-primary' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">R$ {sale.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">R$ {(sale.cost_price_at_sale || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">R$ {(sale.tax_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">R$ {(sale.commission_value || 7).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 font-bold text-accent">
                                            R$ {(sale.total_price - (sale.cost_price_at_sale || 0) - (sale.tax_value || 0) - (sale.commission_value || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
