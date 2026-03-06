"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Search, Download, TrendingUp, DollarSign, ShoppingBag, XCircle, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VendasPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [cancelModal, setCancelModal] = useState<{ open: boolean; sale: any | null }>({ open: false, sale: null });
    const [cancelForm, setCancelForm] = useState({ notes: "", productionCost: "", refundAmount: "" });
    const [cancelling, setCancelling] = useState(false);

    const supabase = createClient();

    useEffect(() => { fetchSales(); }, []);

    async function fetchSales() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("sales")
                .select("*, bouquets(name)")
                .order("sale_date", { ascending: false });
            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
        } finally {
            setLoading(false);
        }
    }

    const [bouquetMap, setBouquetMap] = useState<Record<string, any>>({});
    useEffect(() => {
        supabase.from("bouquets").select("id, cost_price, fixed_commission, card_tax").then(({ data }) => {
            const map: Record<string, any> = {};
            (data || []).forEach((b: any) => { map[b.id] = b; });
            setBouquetMap(map);
        });
    }, []);

    const effCost = (s: any) => s.cost_price_at_sale ?? (bouquetMap[s.bouquet_id]?.cost_price || 0);
    const effTax = (s: any) => s.tax_value ?? 0;
    const effComm = (s: any) => s.commission_value ?? (bouquetMap[s.bouquet_id]?.fixed_commission ?? 7);
    const calcProfit = (s: any) => s.status === 'cancelled'
        ? -(s.cancellation_cost || 0)
        : s.total_price - effCost(s) - effTax(s) - effComm(s);

    const activeSales = sales.filter(s => s.status !== 'cancelled');
    const totals = activeSales.reduce((acc, sale) => ({
        revenue: acc.revenue + sale.total_price,
        profit: acc.profit + calcProfit(sale)
    }), { revenue: 0, profit: 0 });

    const cancelledCount = sales.filter(s => s.status === 'cancelled').length;
    const totalLoss = sales.filter(s => s.status === 'cancelled').reduce((acc, s) => acc + (s.cancellation_cost || 0), 0);

    const filteredSales = sales.filter(s => {
        const term = searchTerm.toLowerCase();
        return (
            (s.bouquets?.name?.toLowerCase() || '').includes(term) ||
            (s.payment_method?.toLowerCase() || '').includes(term) ||
            (s.buyer_name?.toLowerCase() || '').includes(term)
        );
    });

    async function handleCancelSubmit() {
        if (!cancelModal.sale) return;
        setCancelling(true);
        try {
            const productionCost = parseFloat(cancelForm.productionCost) || 0;
            const refundAmount = parseFloat(cancelForm.refundAmount) || 0;
            const totalLoss = productionCost + refundAmount;

            const { error } = await supabase
                .from("sales")
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_notes: cancelForm.notes,
                    cancellation_cost: productionCost,  // what was spent producing
                    refund_amount: refundAmount,          // what was returned to client
                })
                .eq("id", cancelModal.sale.id);
            if (error) throw error;
            setCancelModal({ open: false, sale: null });
            setCancelForm({ notes: "", productionCost: "", refundAmount: "" });
            await fetchSales();
        } catch (err: any) {
            alert(`Erro ao cancelar: ${err.message}`);
        } finally {
            setCancelling(false);
        }
    }

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-primary">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-primary opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Volume</p>
                    </div>
                    <p className="text-xl font-bold">R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-accent">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-accent opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Lucro</p>
                    </div>
                    <p className="text-xl font-bold text-accent">R$ {totals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-secondary">
                    <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag size={14} className="text-secondary opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Vendas</p>
                    </div>
                    <p className="text-xl font-bold">{activeSales.length}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl border-l-[6px] border-destructive">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle size={14} className="text-destructive opacity-70" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Prejuízo</p>
                    </div>
                    <p className="text-xl font-bold text-destructive">
                        {cancelledCount > 0 ? `${cancelledCount} cancel. / -R$ ${totalLoss.toFixed(2)}` : 'Nenhum'}
                    </p>
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
                                <th className="px-6 py-4">Comprador</th>
                                <th className="px-6 py-4">Ítem</th>
                                <th className="px-6 py-4">Metodo</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-accent text-right font-bold">Lucro / Prej.</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Buscando vendas...</td></tr>
                            ) : filteredSales.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Nenhuma venda registrada.</td></tr>
                            ) : (
                                filteredSales.map((sale) => {
                                    const cancelled = sale.status === 'cancelled';
                                    const profit = calcProfit(sale);
                                    return (
                                        <tr key={sale.id} className={`transition-colors group ${cancelled ? 'opacity-60 bg-red-500/5' : 'hover:bg-white/5'}`}>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                {cancelled && sale.cancelled_at && (
                                                    <div className="text-[10px] text-destructive mt-0.5">
                                                        Cancel. {format(new Date(sale.cancelled_at), "dd/MM HH:mm")}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{sale.buyer_name || "N/A"}</span>
                                                    {cancelled
                                                        ? <span className="text-[9px] text-destructive font-bold uppercase">Cancelado</span>
                                                        : sale.wants_to_register && <span className="text-[9px] text-accent font-bold uppercase">Novo Cliente ✓</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-sm">
                                                {sale.bouquets?.name || "Deletado"}
                                                <span className="ml-2 text-[10px] bg-white/5 px-2 py-1 rounded-full text-muted-foreground">x{sale.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${cancelled ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                                    sale.payment_method === 'Pix' ? 'bg-accent/10 text-accent border border-accent/20' :
                                                        'bg-primary/10 text-primary border border-primary/20'
                                                    }`}>
                                                    {cancelled ? 'Cancelado' : sale.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-sm line-through-if-cancelled">
                                                R$ {sale.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold text-sm ${cancelled ? 'text-destructive' : 'text-accent'}`}>
                                                {cancelled ? '-' : '+'} R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                {cancelled && sale.cancellation_notes && (
                                                    <div className="text-[10px] text-muted-foreground font-normal truncate max-w-[160px] ml-auto">{sale.cancellation_notes}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {!cancelled && (
                                                    <button
                                                        onClick={() => { setCancelModal({ open: true, sale }); setCancelForm({ notes: "", productionCost: "", refundAmount: "" }); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold uppercase hover:bg-destructive/20 flex items-center gap-1"
                                                    >
                                                        <XCircle size={12} /> Cancelar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
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
                        filteredSales.map((sale) => {
                            const cancelled = sale.status === 'cancelled';
                            const profit = calcProfit(sale);
                            return (
                                <div key={sale.id} className={`p-4 space-y-3 transition-colors ${cancelled ? 'opacity-60 bg-red-500/5' : 'active:bg-white/5'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">
                                                {format(new Date(sale.sale_date), "dd MMM, HH:mm", { locale: ptBR })}
                                            </span>
                                            <h4 className="font-bold text-base leading-tight mt-1">{sale.bouquets?.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground font-medium">Comprador: {sale.buyer_name || "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cancelled ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'}`}>
                                                    {cancelled ? 'Cancelado' : sale.payment_method}
                                                </span>
                                                <span className="text-xs text-muted-foreground">Qtd: {sale.quantity}</span>
                                            </div>
                                            {cancelled && sale.cancellation_notes && (
                                                <p className="text-[10px] text-muted-foreground mt-1 italic">{sale.cancellation_notes}</p>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="text-sm font-semibold text-muted-foreground leading-none">R$ {sale.total_price.toFixed(2)}</span>
                                            <span className={`text-lg font-black mt-1 ${cancelled ? 'text-destructive' : 'text-accent'}`}>
                                                {cancelled ? '-' : '+'} R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{cancelled ? 'Prejuízo' : 'Lucro Líquido'}</span>
                                            {!cancelled && (
                                                <button
                                                    onClick={() => { setCancelModal({ open: true, sale }); setCancelForm({ notes: "", productionCost: "", refundAmount: "" }); }}
                                                    className="mt-1 px-3 py-1 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold uppercase flex items-center gap-1"
                                                >
                                                    <XCircle size={12} /> Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            {cancelModal.open && cancelModal.sale && (() => {
                const productionCost = parseFloat(cancelForm.productionCost) || 0;
                const refundAmount = parseFloat(cancelForm.refundAmount) || 0;
                const totalLoss = productionCost + refundAmount;
                const saleTotal = cancelModal.sale.total_price || 0;

                return (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-destructive" />
                                    <h3 className="text-lg font-bold">Cancelar Pedido</h3>
                                </div>
                                <button onClick={() => setCancelModal({ open: false, sale: null })} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Sale info */}
                            <div className="bg-white/5 rounded-xl p-3 mb-4 text-sm">
                                <p className="font-semibold">{cancelModal.sale.bouquets?.name || 'Produto'}</p>
                                <p className="text-muted-foreground text-xs">Comprador: {cancelModal.sale.buyer_name || 'N/A'} · <span className="text-accent font-bold">R$ {saleTotal.toFixed(2)}</span></p>
                            </div>

                            <div className="space-y-4">
                                {/* Motivo */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo / Descrição</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-destructive/40"
                                        placeholder="Ex: Cliente desistiu, produto avariado, devolução em 06/03 às 15h..."
                                        value={cancelForm.notes}
                                        onChange={e => setCancelForm(p => ({ ...p, notes: e.target.value }))}
                                    />
                                </div>

                                {/* Custo de produção */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo que tive (R$)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
                                        placeholder="0.00 — flores, entrega, embalagem..."
                                        value={cancelForm.productionCost}
                                        onChange={e => setCancelForm(p => ({ ...p, productionCost: e.target.value }))}
                                    />
                                </div>

                                {/* Devolução ao cliente */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devolvido ao cliente (R$)</label>
                                        <button
                                            type="button"
                                            onClick={() => setCancelForm(p => ({ ...p, refundAmount: saleTotal.toFixed(2) }))}
                                            className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-md transition-colors"
                                        >
                                            ↩ Devolver tudo (R$ {saleTotal.toFixed(2)})
                                        </button>
                                    </div>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
                                        placeholder="0.00 — quanto foi devolvido ao cliente"
                                        value={cancelForm.refundAmount}
                                        onChange={e => setCancelForm(p => ({ ...p, refundAmount: e.target.value }))}
                                    />
                                </div>

                                {/* Prejuízo calculado */}
                                {(productionCost > 0 || refundAmount > 0) && (
                                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                                        <p className="text-xs text-muted-foreground mb-1">Prejuízo total calculado</p>
                                        <p className="text-2xl font-black text-destructive">- R$ {totalLoss.toFixed(2)}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Custo R$ {productionCost.toFixed(2)} + Devolução R$ {refundAmount.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setCancelModal({ open: false, sale: null })}
                                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-white/5 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCancelSubmit}
                                    disabled={cancelling || !cancelForm.notes}
                                    className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} />
                                    {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
