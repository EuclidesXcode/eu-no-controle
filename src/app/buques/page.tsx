"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Search, MoreVertical, Edit2, Trash2, Image as ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import EditBuqueModal from "@/components/EditBuqueModal";

export default function BuquesPage() {
    const [buques, setBuques] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBuque, setSelectedBuque] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchBuques();
    }, []);

    async function fetchBuques() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("bouquets")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setBuques(data || []);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
        }
    }

    function handleEditClick(buque: any) {
        setSelectedBuque(buque);
        setIsEditModalOpen(true);
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        const { error } = await supabase.from("bouquets").delete().eq('id', id);
        if (!error) fetchBuques();
    }

    const filteredBuques = buques.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Catálogo</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">Gerencie seus produtos e preços.</p>
                    </div>
                </div>
                <Link
                    href="/buques/novo"
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 md:py-2 rounded-2xl md:rounded-lg transition-all shadow-lg shadow-primary/20 font-bold text-sm md:text-base"
                >
                    <Plus size={20} />
                    Novo Produto
                </Link>
            </div>

            <div className="glass-card rounded-2xl md:rounded-xl overflow-hidden border border-white/5">
                <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Foto</th>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Venda</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Taxa</th>
                                <th className="px-6 py-4">Margem</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Carregando...</td>
                                </tr>
                            ) : filteredBuques.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Nenhum produto encontrado.</td>
                                </tr>
                            ) : (
                                filteredBuques.map((buque) => (
                                    <tr
                                        key={buque.id}
                                        onClick={() => handleEditClick(buque)}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                                                {buque.images && buque.images[0] ? (
                                                    <img src={buque.images[0]} alt={buque.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={20} className="text-muted-foreground" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{buque.name}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">{buque.category || 'premium'}</td>
                                        <td className="px-6 py-4 font-bold text-lg text-primary">R$ {buque.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">R$ {buque.cost_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">{buque.card_tax}%</td>
                                        <td className="px-6 py-4">
                                            <div className="bg-accent/10 px-3 py-1 rounded-full inline-block border border-accent/20">
                                                <span className="text-accent font-bold">
                                                    R$ {(buque.price - buque.cost_price - (buque.price * (buque.card_tax / 100)) - (buque.fixed_commission || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                    <Edit2 size={18} className="text-secondary" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(buque.id, e)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} className="text-destructive" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-border">
                    {loading ? (
                        <div className="p-10 text-center text-muted-foreground">Carregando...</div>
                    ) : filteredBuques.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground">Nenhum produto encontrado.</div>
                    ) : (
                        filteredBuques.map((buque) => (
                            <div
                                key={buque.id}
                                onClick={() => handleEditClick(buque)}
                                className="p-4 flex items-center gap-4 active:bg-white/5 transition-colors"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0 overflow-hidden border border-white/5 shadow-lg">
                                    {buque.images && buque.images[0] ? (
                                        <img src={buque.images[0]} alt={buque.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={24} className="text-muted-foreground m-auto" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base truncate">{buque.name}</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{buque.category || 'premium'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-primary font-bold">R$ {buque.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                                            R${(buque.price - buque.cost_price - (buque.price * (buque.card_tax / 100)) - (buque.fixed_commission || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Lucro
                                        </span>
                                    </div>
                                </div>
                                <button className="p-2 text-muted-foreground">
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <EditBuqueModal
                buque={selectedBuque}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={fetchBuques}
            />
        </div>
    );
}
