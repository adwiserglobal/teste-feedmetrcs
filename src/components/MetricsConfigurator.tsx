import { useState } from "react";
import { MoreVertical, Download, Settings2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CustomMetricBuilder, CustomMetric } from "./CustomMetricBuilder";

interface MetricsConfiguratorProps {
  onExport?: () => void;
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
}

const availableMetrics = [
  { id: "csat", label: "CSAT (Customer Satisfaction)", description: "Satisfação geral do cliente" },
  { id: "nps", label: "NPS (Net Promoter Score)", description: "Probabilidade de recomendação" },
  { id: "ces", label: "CES (Customer Effort Score)", description: "Facilidade de uso" },
  { id: "experience", label: "Experiência Geral", description: "Avaliação da experiência" },
  { id: "ease", label: "Facilidade de Uso", description: "Facilidade em realizar tarefas" },
  { id: "templates", label: "Avaliação de Templates", description: "Qualidade dos templates" },
];

export function MetricsConfigurator({ 
  onExport, 
  selectedMetrics, 
  onMetricsChange 
}: MetricsConfiguratorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customMetricDialogOpen, setCustomMetricDialogOpen] = useState(false);
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);

  const handleMetricToggle = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(m => m !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const handleSaveCustomMetric = (metric: CustomMetric) => {
    setCustomMetrics([...customMetrics, metric]);
    // Automatically select the new custom metric
    onMetricsChange([...selectedMetrics, metric.id]);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Escolher Indicadores
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Indicadores</DialogTitle>
            <DialogDescription>
              Selecione quais métricas de performance deseja visualizar no dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableMetrics.map((metric) => (
              <div key={metric.id} className="flex items-start space-x-3">
                <Checkbox
                  id={metric.id}
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => handleMetricToggle(metric.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={metric.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {metric.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
            
            {customMetrics.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">Métricas Personalizadas</p>
                  {customMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-start space-x-3 mb-3">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => handleMetricToggle(metric.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={metric.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {metric.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-between items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogOpen(false);
                setCustomMetricDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Métrica Personalizada
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Salvar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CustomMetricBuilder
        open={customMetricDialogOpen}
        onOpenChange={setCustomMetricDialogOpen}
        onSave={handleSaveCustomMetric}
      />
    </>
  );
}