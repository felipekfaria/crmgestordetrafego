import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import DashboardStats from "../components/dashboard/DashboardStats";
import TodayPanel from "@/components/dashboard/TodayPanel";

const Dashboard = () => {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="min-h-screen bg-leadflow-light-gray">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-leadflow-mid-gray">
            Bem-vindo ao LeadFlow, acompanhe seus leads e vendas aqui.
          </p>
        </div>

        <div className="space-y-6">
          <TodayPanel /> {/* ✅ agora está no local certo */}
          <DashboardStats reloadKey={reloadKey} />
        </div>

        {/* Você pode adicionar mais componentes futuramente aqui */}
      </div>
    </div>
  );
};

export default Dashboard;