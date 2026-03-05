"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Search, MoreVertical, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
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
            console.error("Erro ao buscar buquês:", error);
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
        if (!confirm("Tem certeza que deseja excluir este buquê?")) return;

        const { error } = await supabase.from("bouquets").delete().eq('id', id);
        if (!error) fetchBuques();
    }

    const filteredBuques = buques.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Buquês</h2>
                    <p className="text-muted-foreground">Gerencie o catálogo de flores e preços.</p>
                </div>
                <Link
                    href="/buques/novo"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105"
                >
                    <Plus size={20} />
                    Novo Buquê
                </Link>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar buquê..."
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-sm font-medium text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Foto</th>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Preço Venda</th>
                                <th className="px-6 py-4">Preço Custo</th>
                                <th className="px-6 py-4">Taxa Cartão</th>
                                <th className="px-6 py-4">Comissão</th>
                                <th className="px-6 py-4">Margem</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Carregando...</td>
                                </tr>
                            ) : filteredBuques.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Nenhum buquê encontrado.</td>
                                </tr>
                            ) : (
                                filteredBuques.map((buque) => (
                                    <tr
                                        key={buque.id}
                                        onClick={() => handleEditClick(buque)}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-white/5">
                                                {buque.images && buque.images[0] ? (
                                                    <img src={buque.images[0]} alt={buque.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={20} className="text-muted-foreground" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{buque.name}</td>
                                        <td className="px-6 py-4 font-bold">R$ {buque.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">R$ {buque.cost_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">{buque.card_tax}%</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">R$ {buque.fixed_commission?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '7,00'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-accent font-bold">
                                                R$ {(buque.price - buque.cost_price - (buque.price * (buque.card_tax / 100)) - (buque.fixed_commission || 7)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
