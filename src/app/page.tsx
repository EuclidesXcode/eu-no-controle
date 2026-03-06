"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    cancelledCount: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [donutData, setDonutData] = useState<any[]>([
    { name: 'Efetuadas', value: 0 },
    { name: 'Canceladas', value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*, bouquets(name)")
          .order('sale_date', { ascending: false });

        if (salesError) console.error("Erro ao buscar vendas:", salesError);

        // Fetch bouquets for cost fallback
        const { data: bouquetsData, count: productCount } = await supabase
          .from("bouquets")
          .select('id, cost_price, fixed_commission, card_tax', { count: 'exact' });

        const bouquetMap: Record<string, any> = {};
        (bouquetsData || []).forEach((b: any) => { bouquetMap[b.id] = b; });

        const allSales = salesData || [];

        // Split active vs cancelled (null status = treat as active/completed)
        const activeSales = allSales.filter(s => s.status !== 'cancelled');
        const cancelledSales = allSales.filter(s => s.status === 'cancelled');

        // Cost helpers
        const effCost = (s: any) => s.cost_price_at_sale ?? (bouquetMap[s.bouquet_id]?.cost_price || 0);
        const effTax = (s: any) => s.tax_value ?? 0;
        const effComm = (s: any) => s.commission_value ?? (bouquetMap[s.bouquet_id]?.fixed_commission ?? 7);

        // Only count active sales for revenue/profit
        const revenue = activeSales.reduce((acc, s) => acc + (s.total_price || 0), 0);
        const totalCommission = activeSales.reduce((acc, s) => acc + effComm(s), 0);
        const totalCosts = activeSales.reduce((acc, s) => acc + effCost(s) + effTax(s), 0);
        const cancellationLoss = cancelledSales.reduce((acc, s) => acc + (s.cancellation_cost || 0), 0);
        const profit = revenue - totalCosts - totalCommission - cancellationLoss;

        setStats({
          revenue,
          salesCount: allSales.length,
          productCount: productCount || 0,
          totalCommission,
          totalCosts,
          profit,
          cancelledCount: cancelledSales.length,
        });

        setRecentSales(allSales.slice(0, 8));

        // Monthly chart — only active sales
        const monthlyMap: Record<string, { custo: number; comissao: number; taxa: number; lucro: number }> = {};
        activeSales.forEach((s) => {
          const date = new Date(s.sale_date);
          const key = format(date, 'MMM/yy', { locale: ptBR });
          if (!monthlyMap[key]) monthlyMap[key] = { custo: 0, comissao: 0, taxa: 0, lucro: 0 };
          const custo = effCost(s);
          const comissao = effComm(s);
          const taxa = effTax(s);
          const lucro = (s.total_price || 0) - custo - comissao - taxa;
          monthlyMap[key].custo += custo;
          monthlyMap[key].comissao += comissao;
          monthlyMap[key].taxa += taxa;
          monthlyMap[key].lucro += lucro;
        });

        const chart = Object.entries(monthlyMap)
          .slice(-6)
          .map(([name, vals]) => ({
            name,
            Custo: +vals.custo.toFixed(2),
            'Comissão': +vals.comissao.toFixed(2),
            Taxa: +vals.taxa.toFixed(2),
            Lucro: +vals.lucro.toFixed(2),
          }));

        setChartData(chart.length > 0 ? chart : [{ name: 'Sem dados', Custo: 0, 'Comissão': 0, Taxa: 0, Lucro: 0 }]);

        // Donut: always set 2 entries so chart always renders
        setDonutData([
          { name: 'Efetuadas', value: activeSales.length },
          { name: 'Canceladas', value: cancelledSales.length },
        ]);

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
            <h3 className="text-lg font-semibold">Distribuição por Mês</h3>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse pt-10 text-center">Carregando gráfico...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                  <XAxis dataKey="name" stroke="#bac2de" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#bac2de" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]}
                  />
                  <Bar dataKey="Custo" fill="#f38ba8" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Comissão" fill="#fab387" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Taxa" fill="#89b4fa" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Lucro" fill="#a6e3a1" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#f38ba8] inline-block" /> Custo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#fab387] inline-block" /> Comissão</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#89b4fa] inline-block" /> Taxa</span>
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
                  cancelled={sale.status === 'cancelled'}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Donut Chart — Vendas x Cancelamentos */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 glass-card rounded-xl border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Vendas × Cancelamentos</h3>
          <p className="text-xs text-muted-foreground mb-4">Proporção de pedidos efetuados vs cancelados</p>
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse text-center py-10">Carregando...</p>
          ) : (
            <div className="flex items-center gap-8">
              <div className="relative h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData.every(d => d.value === 0) ? [{ name: 'Sem dados', value: 1 }] : donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={donutData.every(d => d.value === 0) ? 0 : 3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.every(d => d.value === 0)
                        ? <Cell fill="#313244" />
                        : donutData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#a6e3a1' : '#f38ba8'} />
                        ))
                      }
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: any, name: any) => [`${value} pedido${value !== 1 ? 's' : ''}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black">{stats.salesCount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">total</span>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#a6e3a1] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Efetuadas</p>
                    <p className="text-xl font-bold text-[#a6e3a1]">{donutData[0]?.value ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#f38ba8] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Canceladas</p>
                    <p className="text-xl font-bold text-[#f38ba8]">{donutData[1]?.value ?? 0}</p>
                  </div>
                </div>
                {stats.salesCount > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                    <p className="text-lg font-bold">{Math.round(((donutData[0]?.value ?? 0) / stats.salesCount) * 100)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}
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

function RecentSale({ buyerName, item, price, method, cancelled }: any) {
  return (
    <div className={`flex items-center justify-between ${cancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${cancelled ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
          {buyerName?.substring(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{item} {cancelled && <span className="text-[9px] text-destructive font-bold uppercase ml-1">cancelado</span>}</p>
          <p className="text-xs text-muted-foreground">{buyerName} · {method || 'Pix'}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${cancelled ? 'line-through text-muted-foreground' : ''}`}>{price}</span>
    </div>
  );
}

