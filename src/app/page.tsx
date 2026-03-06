"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    salesCount: 0,
    profit: 0,
    productCount: 0,
    totalCommission: 0,
    totalCosts: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Sales — use sale_date (not created_at)
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*, bouquets(name)")
          .order('sale_date', { ascending: false });

        if (salesError) throw salesError;

        // Fetch Products Count
        const { count: productCount } = await supabase
          .from("bouquets")
          .select('*', { count: 'exact', head: true });

        const sales = salesData || [];

        const revenue = sales.reduce((acc, s) => acc + (s.total_price || 0), 0);
        const totalCommission = sales.reduce((acc, s) => acc + (s.commission_value ?? 7), 0);
        const totalCosts = sales.reduce((acc, s) => acc + (s.cost_price_at_sale || 0) + (s.tax_value || 0), 0);
        const profit = revenue - totalCosts - totalCommission;

        setStats({
          revenue,
          salesCount: sales.length,
          productCount: productCount || 0,
          totalCommission,
          totalCosts,
          profit,
        });

        setRecentSales(sales.slice(0, 8));

        // Build monthly chart data (last 6 months)
        const monthlyMap: Record<string, { revenue: number; lucro: number }> = {};
        sales.forEach((s) => {
          const date = new Date(s.sale_date);
          const key = format(date, 'MMM/yy', { locale: ptBR });
          if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, lucro: 0 };
          monthlyMap[key].revenue += s.total_price || 0;
          const saleProfit = (s.total_price || 0) - (s.cost_price_at_sale || 0) - (s.tax_value || 0) - (s.commission_value ?? 7);
          monthlyMap[key].lucro += saleProfit;
        });

        const chart = Object.entries(monthlyMap)
          .slice(-6)
          .map(([name, vals]) => ({ name, Receita: +vals.revenue.toFixed(2), Lucro: +vals.lucro.toFixed(2) }));

        setChartData(chart.length > 0 ? chart : [{ name: 'Sem dados', Receita: 0, Lucro: 0 }]);

      } catch (err) {
        console.error("Erro no dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Produtos</h2>
        <p className="text-muted-foreground">Visão geral do desempenho do seu negócio.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Operacional"
          value={`R$ ${stats.revenue.toFixed(2)}`}
          icon={<DollarSign className="text-primary" />}
          trend="+Vendas"
          positive
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.productCount.toString()}
          icon={<Package className="text-secondary" />}
          trend="Ativos"
          positive
        />
        <StatCard
          title="Total Comissões"
          value={`R$ ${stats.totalCommission.toFixed(2)}`}
          icon={<Users className="text-accent" />}
          trend="Fixa R$ 7.00"
          positive={false}
        />
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${stats.profit.toFixed(2)}`}
          icon={<TrendingUp className="text-primary" />}
          trend="Realizado"
          positive={stats.profit >= 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-1 lg:col-span-2">
          <StatCard
            title="Gastos (Custo + Taxas)"
            value={`R$ ${stats.totalCosts.toFixed(2)}`}
            icon={<ArrowDownRight className="text-destructive" />}
            trend="Total"
            positive={false}
          />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <StatCard
            title="Vendas Realizadas"
            value={stats.salesCount.toString()}
            icon={<ArrowUpRight className="text-accent" />}
            trend="Pedidos"
            positive
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Sales Chart */}
        <div className="md:col-span-4 p-6 glass-card rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Receita vs Lucro por Mês</h3>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse pt-10 text-center">Carregando gráfico...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                  <XAxis dataKey="name" stroke="#bac2de" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#bac2de" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]}
                  />
                  <Bar dataKey="Receita" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="Lucro" fill="#a6e3a1" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#ec4899] inline-block" /> Receita</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#a6e3a1] inline-block" /> Lucro</span>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="md:col-span-3 p-6 glass-card rounded-xl border border-white/5">
          <h3 className="text-lg font-semibold mb-6">Últimas Atividades</h3>
          <div className="space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Consultando banco de dados...</p>
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aguardando primeira venda.</p>
            ) : (
              recentSales.map((sale) => (
                <RecentSale
                  key={sale.id}
                  buyerName={sale.buyer_name || sale.payment_method || 'Cliente'}
                  item={sale.bouquets?.name || 'Produto'}
                  price={`R$ ${sale.total_price.toFixed(2)}`}
                  method={sale.payment_method}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, positive }: any) {
  return (
    <div className="p-6 glass-card rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <div className={`flex items-center text-xs font-medium ${positive ? 'text-accent' : 'text-destructive'}`}>
          {positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function RecentSale({ buyerName, item, price, method }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs uppercase text-primary">
          {buyerName?.substring(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{item}</p>
          <p className="text-xs text-muted-foreground">{buyerName} · {method || 'Pix'}</p>
        </div>
      </div>
      <span className="text-sm font-semibold">{price}</span>
    </div>
  );
}

