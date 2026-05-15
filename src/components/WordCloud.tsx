import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WordData {
  text: string;
  value: number;
}

export function WordCloud() {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWordCloud();
  }, []);

  const loadWordCloud = async (retryCount = 0) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-word-cloud');
      
      if (error) {
        // Verificar se é erro de rate limit
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          if (retryCount < 2) {
            // Tentar novamente após alguns segundos
            const delay = (retryCount + 1) * 3000; // 3s, 6s
            console.log(`Rate limited, retrying in ${delay}ms...`);
            setTimeout(() => loadWordCloud(retryCount + 1), delay);
            return;
          }
          toast({
            title: "Limite de uso excedido",
            description: "Muitos usuários estão usando a API gratuitamente. Tente novamente em alguns minutos.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw error;
      }

      setWords(data.words || []);
    } catch (error: any) {
      console.error("Error loading word cloud:", error);
      toast({
        title: "Erro ao carregar nuvem de palavras",
        description: error.message || "Ocorreu um erro ao processar os feedbacks.",
        variant: "destructive",
      });
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Nuvem de Palavras dos Feedbacks</h3>
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  if (words.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Nuvem de Palavras dos Feedbacks</h3>
        <p className="text-muted-foreground text-center py-12">
          Nenhum feedback com sugestões encontrado ainda.
        </p>
      </Card>
    );
  }

  // Normalizar valores para tamanhos de fonte (12px a 48px)
  const maxValue = Math.max(...words.map(w => w.value));
  const minValue = Math.min(...words.map(w => w.value));
  const range = maxValue - minValue || 1;

  const getFontSize = (value: number) => {
    const normalized = (value - minValue) / range;
    return 12 + normalized * 36; // 12px a 48px
  };

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    if (normalized > 0.7) return "hsl(var(--primary))";
    if (normalized > 0.4) return "hsl(var(--accent))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Nuvem de Palavras dos Feedbacks</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Palavras-chave mais relevantes extraídas pela IA dos feedbacks recebidos
      </p>
      <div className="flex flex-wrap gap-4 justify-center items-center min-h-[200px] py-4">
        {words.map((word, index) => (
          <span
            key={index}
            style={{
              fontSize: `${getFontSize(word.value)}px`,
              color: getColor(word.value),
            }}
            className="font-bold transition-all hover:scale-110 cursor-default"
            title={`Relevância: ${word.value}`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </Card>
  );
}
