
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type TaskType =
  | "follow-up hoje"
  | "follow-up atrasado"
  | "enviar proposta"
  | "marcar follow-up"
  | "manual";

type Task = {
  id?: number;
  type: TaskType;
  name: string;
  days_stalled?: number;
  description?: string;
  created_at?: string;
  lead_id?: number;
  done?: boolean;
};

const TodayPanel = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id);

    const autoTasks: Task[] = [];

    leads?.forEach((lead) => {
      const name = lead.lead_name;
      const status = lead.status;
      const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
      const updatedAt = lead.updated_at ? new Date(lead.updated_at) : null;

      if (followUpDate) {
        const isToday = followUpDate.toDateString() === today.toDateString();
        const isOverdue = followUpDate < today && !isToday;

        if (isToday) autoTasks.push({ type: "follow-up hoje", name, lead_id: lead.id });
        else if (isOverdue) autoTasks.push({ type: "follow-up atrasado", name, lead_id: lead.id });
      }

      const isStalled =
        updatedAt && updatedAt < threeDaysAgo && !["proposal", "won", "lost"].includes(status);

      if (isStalled) {
        const daysStalled = Math.floor(
          (today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        autoTasks.push({
          type: "marcar follow-up",
          name,
          days_stalled: daysStalled,
          lead_id: lead.id,
        });
      }

      if (status === "contacted" && !followUpDate) {
        autoTasks.push({ type: "enviar proposta", name, lead_id: lead.id });
      }
    });

    const { data: manualTasks, error } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("done", false);

    if (error) {
      toast.error("Erro ao buscar tarefas manuais");
      console.error(error);
      return;
    }

    const todayStrDate = today.toISOString().split("T")[0];

    const filteredManualTasks: Task[] =
      manualTasks?.filter((t) => t.created_at?.startsWith(todayStrDate))?.map((t) => ({
        id: t.id,
        name: t.title,
        description: t.details,
        type: "manual",
        created_at: t.created_at,
        done: t.done,
      })) || [];

    setTasks([...autoTasks, ...filteredManualTasks]);
    setCheckedTasks([]);
  };

  const handleSaveManualTask = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    if (editTask) {
      const { error } = await supabase
        .from("user_tasks")
        .update({
          title: newTask.name,
          details: newTask.description,
        })
        .eq("id", editTask.id);

      if (error) {
        toast.error("Erro ao editar tarefa");
        return;
      }

      toast.success("Tarefa atualizada!");
      setEditTask(null);
    } else {
      const { error } = await supabase.from("user_tasks").insert({
        user_id: user.id,
        title: newTask.name,
        details: newTask.description,
        done: false,
      });

      if (error) {
        toast.error("Erro ao salvar tarefa");
        console.error(error);
        return;
      }

      toast.success("Tarefa criada!");
    }

    setIsModalOpen(false);
    setNewTask({ name: "", description: "" });
    fetchTasks();
  };

  const handleCompleteTask = async (taskId: number | undefined) => {
    if (!taskId) return;
    setCheckedTasks((prev) => [...prev, taskId]);
    await supabase.from("user_tasks").update({ done: true }).eq("id", taskId);
    fetchTasks();
  };

  const handleClick = (task: Task) => {
    if (task.type !== "manual" && task.lead_id) {
      window.history.pushState({}, "", `/pipeline?leadId=${task.lead_id}`);
      const event = new CustomEvent("openLeadFromURL");
      window.dispatchEvent(event);
    } else if (task.type === "manual" && task.id) {
      setEditTask(task);
      setNewTask({ name: task.name, description: task.description || "" });
      setIsModalOpen(true);
    }
  };

  const renderTask = (task: Task, index: number) => {
    if (checkedTasks.includes(task.id || -1)) return null;

    const baseStyle =
      "rounded-md shadow p-4 flex items-start gap-3 transition-all duration-300 hover:opacity-90";
    const bgStyle = {
      "follow-up hoje": "bg-blue-100 text-blue-800",
      "follow-up atrasado": "bg-yellow-100 text-yellow-900",
      "enviar proposta": "bg-purple-100 text-purple-900",
      "marcar follow-up": "bg-orange-100 text-orange-900",
      "manual": "bg-white text-black",
    }[task.type];

    let text = "";
    if (task.type === "follow-up hoje") text = `Falar com ${task.name} – follow-up marcado pra hoje`;
    else if (task.type === "follow-up atrasado") text = `Falar com ${task.name} – follow-up em atraso`;
    else if (task.type === "enviar proposta") text = `Enviar proposta para ${task.name}`;
    else if (task.type === "marcar follow-up") text = `Marcar follow-up com ${task.name} – parado há ${task.days_stalled} dias`;
    else if (task.type === "manual") text = `${task.name}${task.description ? " – " + task.description : ""}`;

    return (
      <li key={task.id || index} className={`${baseStyle} ${bgStyle}`}>
        {task.type === "manual" && (
          <input
            type="checkbox"
            className="mt-1"
            onChange={() => handleCompleteTask(task.id)}
          />
        )}
        <div
          className={`flex-1 ${task.type !== "manual" ? "cursor-pointer" : ""}`}
          onClick={() => handleClick(task)}
        >
          {text}
        </div>
      </li>
    );
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Hoje você precisa:</h2>
        <Button size="sm" onClick={() => {
          setEditTask(null);
          setNewTask({ name: "", description: "" });
          setIsModalOpen(true);
        }}>
          + Nova tarefa
        </Button>
      </div>

      {tasks.length > 0 ? (
        <ul className="space-y-3">{tasks.map(renderTask)}</ul>
      ) : (
        <p className="text-leadflow-mid-gray">Nenhuma tarefa pendente para hoje.</p>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? "Editar tarefa" : "Nova tarefa manual"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Título"
            value={newTask.name}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
          />
          <Textarea
            placeholder="Descrição"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <DialogFooter>
            <Button onClick={handleSaveManualTask}>
              {editTask ? "Salvar alterações" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodayPanel;
