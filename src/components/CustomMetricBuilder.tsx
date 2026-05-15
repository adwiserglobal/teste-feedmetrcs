import { useState } from "react";
import { Plus, Minus, X, Divide } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CustomMetricBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (metric: CustomMetric) => void;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: FormulaElement[];
  format: "number" | "percentage";
  visibility: "private" | "team" | "public";
}

interface FormulaElement {
  type: "metric" | "operator" | "number";
  value: string;
}

const availableMetrics = [
  { id: "total_responses", label: "Total de Respostas" },
  { id: "average_rating", label: "Média de Avaliação" },
  { id: "csat", label: "CSAT" },
  { id: "nps", label: "NPS" },
  { id: "ces", label: "CES" },
  { id: "positive_feedback", label: "Feedbacks Positivos" },
  { id: "negative_feedback", label: "Feedbacks Negativos" },
];

const operators = [
  { value: "+", label: "Adição (+)", icon: Plus },
  { value: "-", label: "Subtração (-)", icon: Minus },
  { value: "*", label: "Multiplicação (×)", icon: X },
  { value: "/", label: "Divisão (÷)", icon: Divide },
];

export function CustomMetricBuilder({ open, onOpenChange, onSave }: CustomMetricBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState<FormulaElement[]>([]);
  const [format, setFormat] = useState<"number" | "percentage">("number");
  const [visibility, setVisibility] = useState<"private" | "team" | "public">("private");
  const [currentInput, setCurrentInput] = useState("");

  const addToFormula = (type: FormulaElement["type"], value: string) => {
    setFormula([...formula, { type, value }]);
  };

  const removeLastFromFormula = () => {
    setFormula(formula.slice(0, -1));
  };

  const addNumber = () => {
    if (currentInput) {
      addToFormula("number", currentInput);
      setCurrentInput("");
    }
  };

  const handleSave = () => {
    if (name && formula.length > 0) {
      const metric: CustomMetric = {
        id: `custom_${Date.now()}`,
        name,
        description,
        formula,
        format,
        visibility,
      };
      onSave(metric);
      // Reset form
      setName("");
      setDescription("");
      setFormula([]);
      setFormat("number");
      setVisibility("private");
      setCurrentInput("");
      onOpenChange(false);
    }
  };

  const getFormulaDisplay = () => {
    return formula.map((el, idx) => {
      if (el.type === "metric") {
        const metric = availableMetrics.find(m => m.id === el.value);
        return metric?.label || el.value;
      }
      return el.value;
    }).join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Métrica Personalizada</DialogTitle>
          <DialogDescription>
            Crie métricas personalizadas para ter informações mais detalhadas sobre o desempenho da campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Dê um nome para esta métrica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{name.length}/100</p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição • Opcional</Label>
            <Textarea
              id="description"
              placeholder="Descreva esta métrica"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={350}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{description.length}/350</p>
          </div>

          {/* Fórmula */}
          <div className="space-y-3">
            <Label>Fórmula</Label>
            <div className="border border-input rounded-lg p-4 min-h-[60px] bg-muted/20">
              <p className="text-sm font-mono">
                {formula.length > 0 ? getFormulaDisplay() : "Para combinar as métricas em uma fórmula, selecione métricas no menu suspenso acima ou comece a digitar aqui."}
              </p>
            </div>
            
            {/* Selector de Métricas */}
            <div className="space-y-2">
              <Label className="text-xs">Selecione a métrica</Label>
              <Select onValueChange={(value) => addToFormula("metric", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar métrica" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operadores */}
            <div className="flex gap-2">
              {operators.map((op) => (
                <Button
                  key={op.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addToFormula("operator", op.value)}
                  title={op.label}
                >
                  <op.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Input de Número */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Digite um número"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNumber()}
              />
              <Button onClick={addNumber} variant="outline">
                Adicionar
              </Button>
              <Button 
                onClick={removeLastFromFormula} 
                variant="outline"
                disabled={formula.length === 0}
              >
                Desfazer
              </Button>
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onValueChange={(value: "number" | "percentage") => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Numérico (123)</SelectItem>
                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibilidade */}
          <div className="space-y-3">
            <Label>Quem pode acessar isto?</Label>
            <RadioGroup value={visibility} onValueChange={(value: any) => setVisibility(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  Somente você
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="font-normal cursor-pointer">
                  Sua equipe
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer">
                  Todos da organização
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name || formula.length === 0}>
            Criar métrica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
