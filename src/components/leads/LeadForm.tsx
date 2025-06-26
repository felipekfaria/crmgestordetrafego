import React from "react";
import { Lead, LeadStatus } from "./LeadCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  lead?: Lead;
}

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, onSave, lead }) => {
  const [formData, setFormData] = React.useState<Partial<Lead & { valueText?: string }>>({
    lead_name: "",
    company: "",
    email: "",
    telefone: "",
    value: 0,
    valueText: "",
    status: "new" as LeadStatus,
    followUpDate: null
  });

  React.useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        valueText: lead.value.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      });
    } else {
      setFormData({
        lead_name: "",
        company: "",
        email: "",
        telefone: "",
        value: 0,
        valueText: "",
        status: "new" as LeadStatus,
        followUpDate: null
      });
    }
  }, [lead, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name === "value") {
      // remove tudo que não for número
      const numericOnly = value.replace(/[^\d]/g, "");
  
      // formata para o estilo brasileiro com vírgula decimal
      const formatted = (Number(numericOnly) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  
      setFormData((prev) => ({
        ...prev,
        valueText: formatted,
        value: Number(numericOnly) / 100
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };  

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, status: value as LeadStatus });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, followUpDate: date || null });
  };

  const handleSave = () => {
    onSave({
      ...formData,
      value: formData.value || 0
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {lead ? `Editar Lead: ${lead.lead_name}` : "Adicionar Novo Lead"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="lead_name">Nome do Lead</Label>
              <Input
                id="lead_name"
                name="lead_name"
                value={formData.lead_name || ""}
                onChange={handleChange}
                placeholder="Nome do contato"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                name="company"
                value={formData.company || ""}
                onChange={handleChange}
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Email do contato"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone || ""}
                onChange={handleChange}
                placeholder="Ex: (11) 98765-4321"
              />
            </div>

            <div>
              <Label htmlFor="value">Valor Potencial</Label>
              <Input
                id="value"
                name="value"
                type="text"
                inputMode="decimal"
                value={formData.valueText || ""}
                onChange={handleChange}
                placeholder="Ex: 1.999,99"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo Lead</SelectItem>
                  <SelectItem value="contacted">Contato Feito</SelectItem>
                  <SelectItem value="proposal">Proposta Enviada</SelectItem>
                  <SelectItem value="won">Fechado</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="followUpDate">Lembrete de Follow-up</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.followUpDate ? (
                      format(new Date(formData.followUpDate), "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.followUpDate
                        ? new Date(formData.followUpDate)
                        : undefined
                    }
                    onSelect={handleDateChange}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadForm;
