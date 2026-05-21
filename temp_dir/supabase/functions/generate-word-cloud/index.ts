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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar se existe cache válido (menos de 6 horas)
    const { data: cachedData, error: cacheError } = await supabase
      .from('ai_analysis_cache')
      .select('*')
      .eq('analysis_type', 'word_cloud')
      .maybeSingle();

    if (!cacheError && cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);
      const isEmpty = !cachedData.data?.words || cachedData.data.words.length === 0;

      if (cacheAgeHours < CACHE_DURATION_HOURS && !isEmpty) {
        console.log('Retornando word cloud do cache (idade: ' + cacheAgeHours.toFixed(2) + 'h)');
        return new Response(
          JSON.stringify(cachedData.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Gerando novo word cloud...');

    // Buscar todos os feedbacks com sugestões
    const { data: feedbacks, error: fetchError } = await supabase
      .from('feedback')
      .select('improvement_suggestions, feedback_type')
      .not('improvement_suggestions', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching feedbacks:", fetchError);
      throw fetchError;
    }

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(
        JSON.stringify({ words: [] }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Concatenar todas as sugestões
    const allSuggestions = feedbacks
      .map(f => f.improvement_suggestions)
      .join(' | ');

    // Chamar o Gemini para extrair palavras-chave relevantes
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
            content: "Você é um especialista em análise de feedback. Extraia as palavras-chave mais relevantes e significativas dos feedbacks fornecidos. Retorne apenas palavras únicas e importantes, ignorando palavras comuns e irrelevantes."
          },
          {
            role: "user",
            content: `Analise estes feedbacks e extraia as 20-30 palavras-chave mais relevantes e suas frequências aproximadas. Retorne APENAS um JSON válido no formato: {"words": [{"text": "palavra", "value": frequência}]}. Não inclua explicações, apenas o JSON.\n\nFeedbacks:\n${allSuggestions}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_keywords",
              description: "Extrai palavras-chave relevantes e suas frequências dos feedbacks",
              parameters: {
                type: "object",
                properties: {
                  words: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "A palavra-chave" },
                        value: { type: "number", description: "Frequência ou relevância (1-100)" }
                      },
                      required: ["text", "value"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["words"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_keywords" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), 
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extrair as palavras-chave do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let words = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        words = parsed.words || [];
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    // Salvar no cache
    const cachePayload = { words };
    const { error: upsertError } = await supabase
      .from('ai_analysis_cache')
      .upsert({
        analysis_type: 'word_cloud',
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
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in generate-word-cloud function:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
