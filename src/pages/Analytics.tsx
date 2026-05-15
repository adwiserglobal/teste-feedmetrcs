import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GaugeChart } from "@/components/GaugeChart";
import { FilterPanel } from "@/components/FilterPanel";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { InsightsCharts } from "@/components/charts/InsightsCharts";
import { WordCloud } from "@/components/WordCloud";
import { InsightsCard } from "@/components/InsightsCard";
import { MetricsConfigurator } from "@/components/MetricsConfigurator";
import { useFeedbacks } from "@/hooks/useFeedbacks";
import { BarChart3, TrendingUp, Users, Clock, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const METRICS_STORAGE_KEY = 'feedmetrics_selected_metrics';

export default function Analytics() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    stats,
    loading,
    filters,
    applyFilters,
    clearFilters,
    refresh
  } = useFeedbacks();
  
  // Load saved metrics from localStorage
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(METRICS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ["experience", "ease", "templates"];
    } catch {
      return ["experience", "ease", "templates"];
    }
  });

  // Save metrics to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(selectedMetrics));
  }, [selectedMetrics]);

  const handleExport = () => {
    // Export logic would go here
    toast({
      title: "Exportando dados",
      description: "Seus dados estão sendo preparados para download.",
    });
  };
  if (loading) {
    return <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({
          length: 3
        }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>;
  }
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName?.split(' ')[0] || "Usuário";
    if (hour >= 5 && hour < 12) {
      return `Bom dia, ${name}`;
    } else if (hour >= 12 && hour < 18) {
      return `Boa tarde, ${name}`;
    } else {
      return `Boa noite, ${name}`;
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
          <p className="text-muted-foreground mt-1">Acompanhe suas métricas em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            Ao vivo
          </Badge>
          <Button onClick={() => refresh()} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden backdrop-blur-xl bg-card/40 dark:bg-card/20 border border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span>Período selecionado</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden backdrop-blur-xl bg-card/40 dark:bg-card/20 border border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-3xl font-bold">
                  {stats.total > 0 ? ((stats.averageExperience + stats.averageEase) / 2).toFixed(1) : '0.0'}
                </p>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span>Experiência + Facilidade</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden backdrop-blur-xl bg-card/40 dark:bg-card/20 border border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Último</p>
                <p className="text-3xl font-bold">
                  {stats.recentFeedbacks.length > 0 ? new Date(stats.recentFeedbacks[0].created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '--:--'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Atualizado agora</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden backdrop-blur-xl bg-card/40 dark:bg-card/20 border border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Tendência</p>
                <p className={`text-3xl font-bold ${stats.trend >= 0 ? 'text-excellent' : 'text-destructive'}`}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>vs 7 dias anteriores</span>
                </div>
              </div>
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stats.trend >= 0 ? 'bg-excellent/10 dark:bg-excellent/20' : 'bg-destructive/10 dark:bg-destructive/20'}`}>
                <TrendingUp className={`h-6 w-6 ${stats.trend >= 0 ? 'text-excellent' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={applyFilters} onClearFilters={clearFilters} />

      {/* Gauge Charts */}
      <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Métricas de Performance
            </CardTitle>
            <MetricsConfigurator 
              onExport={handleExport}
              selectedMetrics={selectedMetrics}
              onMetricsChange={setSelectedMetrics}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {selectedMetrics.includes("experience") && (
              <GaugeChart 
                value={stats.averageExperience} 
                max={10} 
                size={200} 
                title="Experiência Geral" 
                subtitle={`Média de ${stats.total} avaliações`} 
              />
            )}
            {selectedMetrics.includes("ease") && (
              <GaugeChart 
                value={stats.averageEase} 
                max={10} 
                size={200} 
                title="Facilidade de Uso" 
                subtitle={`Média de ${stats.total} avaliações`} 
              />
            )}
            {selectedMetrics.includes("templates") && stats.averageTemplates > 0 && (
              <GaugeChart 
                value={stats.averageTemplates} 
                max={10} 
                size={200} 
                title="Templates" 
                subtitle="Quando aplicável" 
              />
            )}
            {selectedMetrics.includes("csat") && (
              <GaugeChart 
                value={(stats.averageExperience + stats.averageEase) / 2} 
                max={10} 
                size={200} 
                title="CSAT Score" 
                subtitle="Satisfação do Cliente" 
              />
            )}
            {selectedMetrics.includes("nps") && (
              <GaugeChart 
                value={stats.averageExperience} 
                max={10} 
                size={200} 
                title="NPS Score" 
                subtitle="Net Promoter Score" 
              />
            )}
            {selectedMetrics.includes("ces") && (
              <GaugeChart 
                value={stats.averageEase} 
                max={10} 
                size={200} 
                title="CES Score" 
                subtitle="Customer Effort Score" 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <InsightsCard feedbacks={stats.recentFeedbacks} />

      {/* Insights Avançados */}
      <InsightsCharts feedbacks={stats.recentFeedbacks} />

      {/* Time Series Charts */}
      <TimeSeriesChart feedbacks={stats.recentFeedbacks} />

      {/* Word Cloud */}
      <WordCloud />
    </div>;
}