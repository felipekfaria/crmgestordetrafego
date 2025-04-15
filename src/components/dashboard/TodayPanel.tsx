import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Task = {
  id: number;
  name: string;
} & (
  | { type: "follow-up hoje" }
  | { type: "follow-up atrasado" }
  | { type: "enviar proposta" }
  | { type: "marcar follow-up"; days_stalled: number }
);

const TodayPanel = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);

      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .not("user_id", "is", null);

      if (error) {
        console.error("Erro ao buscar leads:", error);
        return;
      }

      const tasksList: Task[] = [];

      leads.forEach((lead) => {
        const { id, lead_name: name, status } = lead;
        const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
        const updatedAt = lead.updated_at ? new Date(lead.updated_at) : null;

        if (followUpDate) {
          const isToday = followUpDate.toDateString() === today.toDateString();
          const isOverdue = followUpDate < today && !isToday;

          if (isToday) {
            tasksList.push({ type: "follow-up hoje", name, id });
          } else if (isOverdue) {
            tasksList.push({ type: "follow-up atrasado", name, id });
          }
        }

        const isStalled =
          updatedAt &&
          updatedAt < threeDaysAgo &&
          !["proposal", "won", "lost"].includes(status);

        if (isStalled) {
          const daysStalled = Math.floor(
            (today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          tasksList.push({ type: "marcar follow-up", name, days_stalled: daysStalled, id });
        }

        if (status === "contacted" && !followUpDate) {
          tasksList.push({ type: "enviar proposta", name, id });
        }
      });

      setTasks(tasksList);
    };

    fetchTasks();
  }, []);

  const handleClick = (id: number) => {
    navigate(`/pipeline?leadId=${id}`);
  };

  const renderTask = (task: Task, index: number) => {
    const baseClass = "rounded-md shadow p-4 cursor-pointer transition-colors";
    const hover = "hover:bg-leadflow-light-gray";

    switch (task.type) {
      case "follow-up hoje":
        return (
          <li
            key={index}
            className={`bg-white ${baseClass} ${hover}`}
            onClick={() => handleClick(task.id)}
          >
            <strong>Falar com {task.name}</strong> – follow-up marcado pra hoje
          </li>
        );
      case "follow-up atrasado":
        return (
          <li
            key={index}
            className={`bg-yellow-100 text-yellow-900 ${baseClass} ${hover}`}
            onClick={() => handleClick(task.id)}
          >
            <strong>Falar com {task.name}</strong> – follow-up em atraso
          </li>
        );
      case "enviar proposta":
        return (
          <li
            key={index}
            className={`bg-white ${baseClass} ${hover}`}
            onClick={() => handleClick(task.id)}
          >
            <strong>Enviar proposta para {task.name}</strong>
          </li>
        );
      case "marcar follow-up":
        return (
          <li
            key={index}
            className={`bg-white ${baseClass} ${hover}`}
            onClick={() => handleClick(task.id)}
          >
            <strong>Marcar follow-up com {task.name}</strong> – está parado há {task.days_stalled} dias
          </li>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Hoje você precisa:</h2>
      {tasks.length > 0 ? (
        <ul className="space-y-3">{tasks.map(renderTask)}</ul>
      ) : (
        <p className="text-leadflow-mid-gray">Nenhuma tarefa pendente para hoje.</p>
      )}
    </div>
  );
};

export default TodayPanel;
