import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  feedbackType: string;
  minRating: number;
}

interface FilterPanelProps {
  filters: FeedbackFilters;
  onFiltersChange: (filters: Partial<FeedbackFilters>) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(filters.dateRange.from || undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(filters.dateRange.to || undefined);

  const handleDateRangeChange = () => {
    onFiltersChange({
      dateRange: {
        from: dateFrom || null,
        to: dateTo || null
      }
    });
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.feedbackType !== "all" || 
    filters.minRating > 0;

  return (
    <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Ativo
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-1 h-8"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date);
                      if (date) handleDateRangeChange();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date);
                      if (date) handleDateRangeChange();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Feedback Type */}
          <div className="space-y-2">
            <Label>Tipo de Feedback</Label>
            <Select
              value={filters.feedbackType}
              onValueChange={(value) => onFiltersChange({ feedbackType: value })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="product">Produto</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Rating */}
          <div className="space-y-2">
            <Label>Nota mínima</Label>
            <Select
              value={filters.minRating.toString()}
              onValueChange={(value) => onFiltersChange({ minRating: parseInt(value) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Qualquer nota</SelectItem>
                <SelectItem value="1">1+ estrela</SelectItem>
                <SelectItem value="2">2+ estrelas</SelectItem>
                <SelectItem value="3">3+ estrelas</SelectItem>
                <SelectItem value="4">4+ estrelas</SelectItem>
                <SelectItem value="5">5+ estrelas</SelectItem>
                <SelectItem value="6">6+ estrelas</SelectItem>
                <SelectItem value="7">7+ estrelas</SelectItem>
                <SelectItem value="8">8+ estrelas</SelectItem>
                <SelectItem value="9">9+ estrelas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <Label>Filtros rápidos</Label>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setDateFrom(weekAgo);
                  setDateTo(today);
                  onFiltersChange({
                    dateRange: { from: weekAgo, to: today }
                  });
                }}
              >
                7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  setDateFrom(monthAgo);
                  setDateTo(today);
                  onFiltersChange({
                    dateRange: { from: monthAgo, to: today }
                  });
                }}
              >
                30 dias
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}