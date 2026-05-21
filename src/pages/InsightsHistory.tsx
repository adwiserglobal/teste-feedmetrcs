import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Calendar, Loader2, TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InsightRecord {
  id: string;
  insights_data: Record<string, unknown>;
  created_at: string;
  metadata: Record<string, unknown>;
}

export default function InsightsHistory() {
  const [insights, setInsights] = useState<InsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInsightsHistory();
  }, []);

  const fetchInsightsHistory = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'insights_history'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const records = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        } as InsightRecord;
      });

      setInsights(records);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching insights history:', err);
      toast({
        title: "Erro ao carregar histórico",
        description: err.message || "Não foi possível carregar o histórico de insights.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Histórico de Insights</h1>
          <p className="text-muted-foreground">
            Todas as análises geradas pela IA ao longo do tempo
          </p>
        </div>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">
              Nenhum insight foi gerado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Os insights aparecerão aqui após a primeira análise.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <Card 
              key={insight.id} 
              className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card hover:shadow-lg transition-shadow"
            >
              <CardHeader className="border-b border-border/50">
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Análise #{insights.length - index}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(insight.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </Badge>
                    <Badge variant="secondary">
                      {insight.metadata?.feedback_count ?? 0} feedbacks
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {typeof insight.insights_data === 'string'
                      ? insight.insights_data
                      : insight.insights_data?.insight_text ?? JSON.stringify(insight.insights_data, null, 2)}
                  </p>
                </div>
                {index < insights.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
