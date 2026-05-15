import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Filter, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feedback {
  id: string;
  experience_rating: number;
  ease_rating: number;
  templates_rating?: number;
  feedback_type: string;
  improvement_suggestions?: string;
  created_at: string;
}

interface FeedbackListProps {
  feedbacks: Feedback[];
}

export function FeedbackList({ feedbacks }: FeedbackListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "excellent";
    if (rating >= 6) return "good";
    if (rating >= 4) return "average";
    if (rating >= 2) return "poor";
    return "very-poor";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return "Excelente";
    if (rating >= 6) return "Bom";
    if (rating >= 4) return "Médio";
    if (rating >= 2) return "Ruim";
    return "Muito Ruim";
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesFilter = filter === "all" || feedback.feedback_type === filter;
    const matchesSearch = search === "" || 
      feedback.improvement_suggestions?.toLowerCase().includes(search.toLowerCase()) ||
      feedback.feedback_type.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Feedbacks Recentes
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Pesquisar feedbacks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum feedback encontrado</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="border-b border-border/30 p-4 hover:bg-accent/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`border-${getRatingColor(feedback.experience_rating)} text-${getRatingColor(feedback.experience_rating)}`}
                        >
                          {feedback.experience_rating}/10 - {getRatingLabel(feedback.experience_rating)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {feedback.feedback_type}
                        </Badge>
                      </div>
                      
                      {feedback.improvement_suggestions && (
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {feedback.improvement_suggestions}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(feedback.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">Facilidade</div>
                      <div className={`text-lg font-bold text-${getRatingColor(feedback.ease_rating)}`}>
                        {feedback.ease_rating}/10
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}