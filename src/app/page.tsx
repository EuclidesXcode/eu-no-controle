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
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: salesData } = await supabase
          .from("sales")
          .select("*, bouquets(name)");

        if (salesData) {
          const revenue = salesData.reduce((acc, s) => acc + s.total_price, 0);
          const profit = salesData.reduce((acc, s) => acc + (s.total_price - (s.cost_price_at_sale || 0) - (s.tax_value || 0)), 0);
          setStats({
            revenue,
            salesCount: salesData.length,
            profit,
          });
          setRecentSales(salesData.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Seg', sales: 400 },
    { name: 'Ter', sales: 300 },
    { name: 'Qua', sales: 200 },
    { name: 'Qui', sales: 278 },
    { name: 'Sex', sales: 189 },
    { name: 'Sáb', sales: 239 },
    { name: 'Dom', sales: 349 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Vendas</h2>
        <p className="text-muted-foreground">Bem-vindo ao seu centro de controle de produtos.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita Total" value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} icon={<DollarSign className="text-primary" />} trend="+12%" />
        <StatCard title="Produtos Vendidos" value={stats.salesCount.toString()} icon={<Package className="text-secondary" />} trend="+5%" />
        <StatCard title="Novos Clientes" value="--" icon={<Users className="text-accent" />} trend="+0%" />
        <StatCard title="Lucro Líquido" value={`R$ ${stats.profit.toLocaleString('pt-BR')}`} icon={<TrendingUp className="text-primary" />} trend="+8%" />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Sales Chart */}
        <div className="md:col-span-4 p-6 glass-card rounded-xl border border-white/5">
          <h3 className="text-lg font-semibold mb-6">Desempenho Semanal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                <XAxis dataKey="name" stroke="#bac2de" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#bac2de" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#ec4899" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="md:col-span-3 p-6 glass-card rounded-xl border border-white/5">
          <h3 className="text-lg font-semibold mb-6">Vendas Recentes</h3>
          <div className="space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda recente.</p>
            ) : (
              recentSales.map((sale) => (
                <RecentSale
                  key={sale.id}
                  name={sale.payment_method}
                  item={sale.bouquets?.name}
                  price={`R$ ${sale.total_price.toLocaleString('pt-BR')}`}
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
