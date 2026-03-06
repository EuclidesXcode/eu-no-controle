"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Search, CreditCard, Banknote, QrCode, Percent, Tag } from "lucide-react";
import Link from "next/link";

export default function NovaVendaPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [buques, setBuques] = useState<any[]>([]);
    const [selectedBuque, setSelectedBuque] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("Pix");
    const [discount, setDiscount] = useState<string>(""); // percentage e.g. "10"
    const [basePrice, setBasePrice] = useState(0);       // price × qty before discount
    const [totalPrice, setTotalPrice] = useState(0);     // after discount

    useEffect(() => { fetchBuques(); }, []);

    async function fetchBuques() {
        const { data } = await supabase.from("bouquets").select("*").order("name");
        setBuques(data || []);
    }

    // Recalculate whenever product, quantity or discount changes
    useEffect(() => {
        if (selectedBuque) {
            const base = selectedBuque.price * quantity;
            const pct = parseFloat(discount) || 0;
            const discountedPrice = base * (1 - pct / 100);
            setBasePrice(base);
            setTotalPrice(+discountedPrice.toFixed(2));
        }
    }, [selectedBuque, quantity, discount]);

    const discountPct = parseFloat(discount) || 0;
    const discountValue = basePrice > 0 ? +(basePrice * discountPct / 100).toFixed(2) : 0;

    async function handleSubmit() {
        if (!selectedBuque) return;
        setLoading(true);

        try {
            const taxRate = paymentMethod.includes("Cartão") ? selectedBuque.card_tax : 0;
            const taxValue = (totalPrice * taxRate) / 100;
            const commissionValue = selectedBuque.fixed_commission ?? 7.00;

            const { error } = await supabase.from("sales").insert([
                {
                    bouquet_id: selectedBuque.id,
                    quantity: quantity,
                    total_price: totalPrice,
                    cost_price_at_sale: selectedBuque.cost_price * quantity,
                    tax_value: taxValue,
                    commission_value: commissionValue,
                    payment_method: paymentMethod,
                    discount_pct: discountPct > 0 ? discountPct : null,
                    discount_value: discountPct > 0 ? discountValue : null,
                },
            ]);

            if (error) throw error;
            router.push("/vendas");
        } catch (error) {
            console.error("Erro ao registrar venda:", error);
            alert("Erro ao registrar venda.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/vendas" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Nova Venda</h2>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Step 1: Select Bouquet */}
                <div className="p-6 glass-card rounded-xl space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Search size={20} className="text-secondary" />
                        1. Selecione o Produto
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {buques.map((buque) => (
                            <button
                                key={buque.id}
                                onClick={() => setSelectedBuque(buque)}
                                className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedBuque?.id === buque.id
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                    : 'border-border bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                                    {buque.images && buque.images[0] && (
                                        <img src={buque.images[0]} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{buque.name}</p>
                                    <p className="text-xs text-muted-foreground">R$ {buque.price.toFixed(2)}</p>
                                </div>
                                {selectedBuque?.id === buque.id && <Check size={16} className="ml-auto text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Details */}
                <div className="p-6 glass-card rounded-xl space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard size={20} className="text-primary" />
                        2. Detalhes da Venda
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantidade */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                            <input
                                type="number" min="1"
                                className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        {/* Desconto % */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Percent size={13} className="text-primary" /> Desconto (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number" min="0" max="100" step="1"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 pr-8"
                                    placeholder="0"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Price breakdown */}
                    {selectedBuque && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Preço base ({quantity}x R$ {selectedBuque.price.toFixed(2)})</span>
                                <span>R$ {basePrice.toFixed(2)}</span>
                            </div>
                            {discountPct > 0 && (
                                <div className="flex justify-between text-primary font-medium">
                                    <span className="flex items-center gap-1">
                                        <Tag size={12} /> Desconto {discountPct}%
                                    </span>
                                    <span>− R$ {discountValue.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-accent text-base border-t border-white/10 pt-2 mt-1">
                                <span>Total a cobrar</span>
                                <span>R$ {totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Forma de Pagamento */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <PaymentBtn active={paymentMethod === 'Pix'} onClick={() => setPaymentMethod('Pix')} icon={<QrCode size={16} />} label="Pix" />
                            <PaymentBtn active={paymentMethod === 'Cartão Crédito'} onClick={() => setPaymentMethod('Cartão Crédito')} icon={<CreditCard size={16} />} label="Crédito" />
                            <PaymentBtn active={paymentMethod === 'Cartão Débito'} onClick={() => setPaymentMethod('Cartão Débito')} icon={<CreditCard size={16} />} label="Débito" />
                            <PaymentBtn active={paymentMethod === 'Dinheiro'} onClick={() => setPaymentMethod('Dinheiro')} icon={<Banknote size={16} />} label="Dinheiro" />
                        </div>
                    </div>
                </div>

                <button
                    disabled={!selectedBuque || loading}
                    onClick={handleSubmit}
                    className="w-full py-4 bg-gradient-to-r from-accent to-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? "Registrando..." : `Finalizar Venda — R$ ${totalPrice.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
}

function PaymentBtn({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center py-3 rounded-lg border gap-1 transition-all ${active ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent' : 'border-border bg-white/5 hover:bg-white/10 text-muted-foreground'
                }`}
        >
            {icon}
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </button>
    );
}
