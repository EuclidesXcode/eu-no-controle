"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Sales
        const { data: salesData } = await supabase
          .from("sales")
          .select("*, bouquets(name)")
          .order('created_at', { ascending: false });

        // Fetch Products Count
        const { count: productCount } = await supabase
          .from("bouquets")
          .select('*', { count: 'exact', head: true });

        if (salesData) {
          const revenue = salesData.reduce((acc, s) => acc + (s.total_price || 0), 0);
          const totalCommission = salesData.reduce((acc, s) => acc + (s.commission_value || 0), 0);
          const totalCosts = salesData.reduce((acc, s) => acc + (s.cost_price_at_sale || 0) + (s.tax_value || 0), 0);
          const profit = revenue - totalCosts - totalCommission;

          setStats({
            revenue,
            salesCount: salesData.length,
            productCount: productCount || 0,
            totalCommission,
            totalCosts,
            profit,
          });
          setRecentSales(salesData.slice(0, 8));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Use real data or a dynamic placeholder for the chart
  const chartData = [
    { name: 'Total', sales: stats.revenue },
    { name: 'Custos', sales: stats.totalCosts },
    { name: 'Comissão', sales: stats.totalCommission },
    { name: 'Lucro', sales: stats.profit },
  ];

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
          trend="+0%"
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.productCount.toString()}
          icon={<Package className="text-secondary" />}
          trend="Ativos"
        />
        <StatCard
          title="Total Comissões"
          value={`R$ ${stats.totalCommission.toFixed(2)}`}
          icon={<Users className="text-accent" />}
          trend="Fixa R$ 7.00"
        />
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${stats.profit.toFixed(2)}`}
          icon={<TrendingUp className="text-primary" />}
          trend="Realizado"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-1 lg:col-span-2">
          <StatCard
            title="Gastos (Custo + Taxas)"
            value={`R$ ${stats.totalCosts.toFixed(2)}`}
            icon={<ArrowDownRight className="text-destructive" />}
            trend="Total"
          />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <StatCard
            title="Vendas Realizadas"
            value={stats.salesCount.toString()}
            icon={<ArrowUpRight className="text-accent" />}
            trend="Pedidos"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Sales Chart */}
        <div className="md:col-span-4 p-6 glass-card rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Distribuição Financeira</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                <XAxis dataKey="name" stroke="#bac2de" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#bac2de" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="sales" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
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
                  name={sale.payment_method}
                  item={sale.bouquets?.name}
                  price={`R$ ${sale.total_price.toFixed(2)}`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
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
        <div className={`flex items-center text-xs font-medium ${trend.startsWith('+') ? 'text-accent' : 'text-destructive'}`}>
          {trend.startsWith('+') ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function RecentSale({ name, item, price }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs uppercase text-primary">
          {name?.substring(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{item}</p>
          <p className="text-xs text-muted-foreground">{name}</p>
        </div>
      </div>
      <span className="text-sm font-semibold">{price}</span>
    </div>
  );
}
