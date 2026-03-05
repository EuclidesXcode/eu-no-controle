"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { X, Save, Upload, Loader2, DollarSign, Tag, FileText } from "lucide-react";

interface EditModalProps {
    buque: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function EditBuqueModal({ buque, isOpen, onClose, onSave }: EditModalProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        cost_price: "",
        card_tax: "4.99",
        images: [] as string[],
        fixed_commission: "7.00",
        category: "premium"
    });

    useEffect(() => {
        if (buque) {
            setFormData({
                name: buque.name || "",
                description: buque.description || "",
                price: buque.price?.toString() || "",
                cost_price: buque.cost_price?.toString() || "",
                card_tax: buque.card_tax?.toString() || "4.99",
                images: buque.images || [],
                fixed_commission: buque.fixed_commission?.toString() || "7.00",
                category: buque.category || "premium"
            });
        }
    }, [buque]);

    if (!isOpen || !buque) return null;

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const file = files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('fotos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('fotos')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, publicUrl]
            }));
        } catch (error) {
            console.error("Erro no upload:", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("bouquets")
                .update({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    cost_price: parseFloat(formData.cost_price),
                    card_tax: parseFloat(formData.card_tax),
                    images: formData.images,
                    fixed_commission: parseFloat(formData.fixed_commission),
                    category: formData.category
                })
                .eq('id', buque.id);

            if (error) throw error;
            onSave();
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            alert("Erro ao atualizar produto.");
        } finally {
            setLoading(false);
        }
    }

    const removeImage = (url: string) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }));
    };

    const margin = (parseFloat(formData.price || "0") - parseFloat(formData.cost_price || "0") - (parseFloat(formData.price || "0") * (parseFloat(formData.card_tax || "0") / 100)) - parseFloat(formData.fixed_commission || "7")).toFixed(2);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6"
            style={{ minHeight: '-webkit-fill-available' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative bg-[#181825] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold gradient-text">Editar Produto</h2>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">ID: {buque.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form id="edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Tag size={16} /> Informações
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Nome Comercial</label>
                                    <input
                                        required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="premium">Premium</option>
                                        <option value="Mini Buquês">Mini Buquês</option>
                                        <option value="Flores individuais">Flores individuais</option>
                                        <option value="Cestas">Cestas</option>
                                        <option value="Presentes">Presentes</option>
                                        <option value="Decorativas">Decorativas</option>
                                        <option value="Caixas Surpresa">Caixas Surpresa</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Descrição Detalhada</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
                                    <DollarSign size={16} /> Financeiro
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Venda (R$)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Custo (R$)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            value={formData.cost_price}
                                            onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Taxa Cartão %</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            value={formData.card_tax}
                                            onChange={e => setFormData({ ...formData, card_tax: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Comissão fixa</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            value={formData.fixed_commission}
                                            onChange={e => setFormData({ ...formData, fixed_commission: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                                    <span className="text-sm font-medium">Margem de Lucro:</span>
                                    <span className={`text-lg font-bold ${parseFloat(margin) > 0 ? 'text-accent' : 'text-destructive'}`}>
                                        R$ {margin}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
                                <FileText size={16} /> Galeria de Fotos
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-xl bg-muted overflow-hidden group border border-white/5">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img)}
                                            className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground"
                                >
                                    {uploading ? <Loader2 size={24} className="animate-spin text-primary" /> : <Upload size={24} />}
                                    <span className="text-[10px] font-bold uppercase">Adicionar Foto</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-border rounded-xl hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        form="edit-form"
                        disabled={loading || uploading}
                        className="flex-[2] py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
