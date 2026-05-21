import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
interface InsightsCardProps {
  feedbacks: any[];
}
export function InsightsCard({
  feedbacks
}: InsightsCardProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    generateInsights();
  }, [feedbacks]);
  const generateInsights = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-insights', {
        body: {
          feedbacks
        }
      });
      if (error) {
        console.error('Error generating insights:', error);
        toast({
          title: "Erro ao gerar insights",
          description: "Não foi possível gerar insights no momento.",
          variant: "destructive"
        });
        setInsight("Nenhum insight relevante encontrado: A quantidade de amostra de dados pode ser muito pequena ou não é suficiente");
        return;
      }
      setInsight(data.insight || "Nenhum insight relevante encontrado: A quantidade de amostra de dados pode ser muito pequena ou não é suficiente");
    } catch (error) {
      console.error('Error:', error);
      setInsight("Nenhum insight relevante encontrado: A quantidade de amostra de dados pode ser muito pequena ou não é suficiente");
    } finally {
      setLoading(false);
    }
  };

  // Função para pegar as 3 primeiras linhas
  const getPreviewText = (text: string) => {
    const lines = text.split('\n');
    return lines.slice(0, 3).join('\n');
  };

  const shouldShowReadMore = insight.split('\n').length > 3;

  return <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights e Oportunidades
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/insights-history')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Ver todos os insights
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {isExpanded ? insight : getPreviewText(insight)}
              </p>
              {shouldShowReadMore && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="mt-2 text-primary hover:underline font-medium"
                >
                  Continuar lendo
                </button>
              )}
              {isExpanded && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="mt-2 text-primary hover:underline font-medium"
                >
                  Mostrar menos
                </button>
              )}
            </div>
            <div className="text-xs text-muted-foreground/70">
              A IA da Feedmetrics pode cometer erros embora seja treinada para obter o máximo de precisão possível nas informações.{" "}
              <Dialog>
                <DialogTrigger className="underline hover:text-muted-foreground cursor-pointer">Saiba mais.</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sobre os Insights de IA</DialogTitle>
                    <DialogDescription className="space-y-4 pt-4">
                      <p>Os insights gerados pela IA da Feedmetrics são produzidos por meio de análises automáticas sobre grandes volumes de feedbacks coletados.

Nossos modelos de inteligência artificial utilizam técnicas avançadas de Processamento de Linguagem Natural (NLP) para interpretar o contexto, detectar padrões e revelar tendências e oportunidades ao longo da jornada do cliente.</p>
                      <p>
                        <strong>Precisão e Limitações:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>A qualidade dos insights depende da quantidade e qualidade dos dados disponíveis</li>
                        <li>Amostras pequenas podem não gerar insights relevantes ou precisos</li>
                        <li>A IA pode interpretar contextos de forma diferente do esperado</li>
                        <li>Recomendações devem ser avaliadas considerando o contexto completo do seu negócio</li>
                      </ul>
                      <p className="text-sm text-muted-foreground">Embora a IA seja constantemente aprimorada e treinada para alcançar o máximo de precisão, os resultados podem conter imprecisões ocasionais. Recomendamos utilizá-los como suporte estratégico à tomada de decisão, sempre considerando a interpretação humana como parte essencial do processo.</p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>}
      </CardContent>
    </Card>;
}