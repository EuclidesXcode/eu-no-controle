"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NovoBuquePage() {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        cost_price: "",
        card_tax: "4.99", // Default tax
        images: [] as string[],
        category: "premium",
    });

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
            alert("Erro ao enviar imagem.");
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("bouquets").insert([
                {
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    cost_price: parseFloat(formData.cost_price),
                    card_tax: parseFloat(formData.card_tax),
                    images: formData.images,
                    category: formData.category,
                },
            ]);

            if (error) throw error;

            router.push("/buques");
        } catch (error) {
            console.error("Erro ao salvar buquê:", error);
            alert("Erro ao salvar buquê. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    }

    function removeImage(url: string) {
        setFormData({ ...formData, images: formData.images.filter((i) => i !== url) });
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/buques" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Novo Buquê</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="p-6 glass-card rounded-xl space-y-4">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Informações Básicas</h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nome do Buquê</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50"
                                placeholder="Ex: Buquê de 12 Rosas Vermelhas"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                            <select
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50"
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
                            <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-primary/50"
                                placeholder="Detalhes sobre as flores, embalagem, etc."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-6 glass-card rounded-xl space-y-4">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Preços e Taxas</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Venda (R$)</label>
                                <input
                                    required
                                    type="number" step="0.01"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50"
                                    placeholder="0,00"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Custo (R$)</label>
                                <input
                                    required
                                    type="number" step="0.01"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50"
                                    placeholder="0,00"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Taxa (%)</label>
                                <input
                                    required
                                    type="number" step="0.01"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50"
                                    placeholder="4.99"
                                    value={formData.card_tax}
                                    onChange={e => setFormData({ ...formData, card_tax: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Comissão (R$)</label>
                                <input
                                    disabled
                                    type="text"
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-muted-foreground cursor-not-allowed"
                                    value="7,00"
                                />
                            </div>
                        </div>

                        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                            <div className="flex justify-between items-center text-sm">
                                <span>Margem Estimada:</span>
                                <span className="font-bold text-primary">
                                    R$ {(parseFloat(formData.price || "0") - parseFloat(formData.cost_price || "0") - (parseFloat(formData.price || "0") * (parseFloat(formData.card_tax || "0") / 100)) - 7).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="space-y-6">
                    <div className="p-6 glass-card rounded-xl space-y-4">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Fotos</h3>

                        <div className="space-y-4">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />

                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
                            >
                                {uploading ? (
                                    <Loader2 className="animate-spin text-primary" size={24} />
                                ) : (
                                    <Upload size={24} />
                                )}
                                <span className="text-xs font-medium">{uploading ? "Enviando..." : "Clique para selecionar foto"}</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg bg-muted overflow-hidden group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img)}
                                            className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading || uploading}
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                        {loading ? "Salvando..." : "Salvar Buquê"}
                    </button>
                </div>
            </form>
        </div>
    );
}
