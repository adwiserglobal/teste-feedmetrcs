import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_HOURS = 6;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se existe cache válido (menos de 6 horas)
    const { data: cachedData, error: cacheError } = await supabase
      .from('ai_analysis_cache')
      .select('*')
      .eq('analysis_type', 'insights')
      .maybeSingle();

    if (!cacheError && cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);

      // Se o cache for válido (menos de 6 horas), retorna do cache
      if (cacheAgeHours < CACHE_DURATION_HOURS) {
        console.log('Retornando insights do cache (idade: ' + cacheAgeHours.toFixed(2) + 'h)');
        return new Response(
          JSON.stringify(cachedData.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Cache expirado (idade: ' + cacheAgeHours.toFixed(2) + 'h) - gerando novo insight');
    }

    // Se não há cache válido, gerar novo insight
    const { feedbacks } = await req.json();
    console.log('Gerando novos insights para', feedbacks?.length || 0, 'feedbacks');

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(
        JSON.stringify({ 
          insight: "Nenhum insight relevante encontrado: A quantidade de amostra de dados pode ser muito pequena ou não é suficiente" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Preparar dados dos feedbacks para análise
    const feedbackSummary = feedbacks.map((f: any) => ({
      experience: f.experience_rating,
      ease: f.ease_rating,
      templates: f.templates_rating,
      type: f.feedback_type,
      suggestions: f.improvement_suggestions,
      date: f.created_at
    }));

    const prompt = `Analise os seguintes feedbacks de clientes do Feedmetrics e gere insights CONCISOS e OBJETIVOS:

Dados dos feedbacks dos clientes:
${JSON.stringify(feedbackSummary, null, 2)}

REGRAS IMPORTANTES:
1. Máximo de 3 insights principais
2. Cada insight deve ter no máximo 3-4 linhas
3. Foque APENAS nos comentários escritos pelos clientes
4. Seja EXTREMAMENTE direto e objetivo
5. Evite textos longos e repetitivos
6. Priorize QUALIDADE sobre QUANTIDADE
7. SEMPRE forneça insights com os dados disponíveis, mesmo que sejam poucos
8. Analise padrões de avaliações baixas ou altas
9. Identifique palavras-chave nos comentários

Formato de resposta esperado:
🧠 Insights e oportunidades:

* [Estatística relevante] [Problema/padrão identificado]
    Descrição objetiva (máx 3 linhas)
    Recomendação: Ação específica`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Você é um analista de dados especializado em análise de feedback de usuários. Você gera insights CONCISOS e OBJETIVOS, nunca textos longos. SEMPRE forneça insights com os dados disponíveis, mesmo que a amostra seja pequena."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        }),
      });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedInsight = data.choices[0].message.content;
    console.log('Generated insight:', generatedInsight);

    // Salvar no histórico
    const { error: historyError } = await supabase
      .from('insights_history')
      .insert({
        insight_text: generatedInsight,
        feedback_count: feedbacks.length,
        metadata: {
          generated_at: new Date().toISOString(),
          model: 'google/gemini-2.5-flash'
        }
      });

    if (historyError) {
      console.error('Error saving to history:', historyError);
    }

    // Salvar no cache
    const cachePayload = { insight: generatedInsight };
    const { error: upsertError } = await supabase
      .from('ai_analysis_cache')
      .upsert({
        analysis_type: 'insights',
        data: cachePayload,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'analysis_type'
      });

    if (upsertError) {
      console.error('Error saving to cache:', upsertError);
    }

    return new Response(
      JSON.stringify(cachePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
