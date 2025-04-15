import React, { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  BarChart,
  Hourglass,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface DashboardStatsProps {
  reloadKey: number;
}

const DashboardStats = ({ reloadKey }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    total: 0,
    won: 0,
    lost: 0,
    pendingFollowUps: 0,
    conversionRate: 0,
    totalValue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) return;

      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", userId);

      if (!leads) return;

      const total = leads.length;
      const won = leads.filter((l) => l.status === "won").length;
      const lost = leads.filter((l) => l.status === "lost").length;
      const pendingFollowUps = leads.filter(
        (l) =>
          l.followUpDate &&
          new Date(l.followUpDate) < new Date() &&
          l.status !== "won" &&
          l.status !== "lost"
      ).length;
      const totalValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
      const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

      setStats({
        total,
        won,
        lost,
        pendingFollowUps,
        conversionRate,
        totalValue
      });
    };

    fetchStats();
  }, [reloadKey]);

  const cards = [
    {
      title: "Leads Totais",
      value: stats.total.toString(),
      change: "",
      icon: <Users className="h-4 w-4 text-leadflow-blue" />,
      description: "Total geral"
    },
    {
      title: "Leads Ganhos",
      value: stats.won.toString(),
      change: "",
      icon: <CheckCircle className="h-4 w-4 text-leadflow-green" />,
      description: "Total fechados"
    },
    {
      title: "Leads Perdidos",
      value: stats.lost.toString(),
      change: "",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      description: "Total perdidos"
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversionRate}%`,
      change: "",
      icon: <BarChart className="h-4 w-4 text-purple-500" />,
      description: "Baseado no total de leads"
    },
    {
      title: "Aguardando Follow-up",
      value: stats.pendingFollowUps.toString(),
      change: "",
      icon: <Hourglass className="h-4 w-4 text-amber-500" />,
      description: "Follow-ups vencidos"
    },
    {
      title: "Valor Potencial",
      value: `R$ ${stats.totalValue.toLocaleString("pt-BR")}`,
      change: "",
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      description: "Soma dos valores"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((stat, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="inline-flex mr-1 text-gray-500">{stat.change}</span>
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
