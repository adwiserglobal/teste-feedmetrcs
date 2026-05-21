import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { google } from "googleapis";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for YouTube Data API
  const getYouTubeData = async (query: string, order = "relevance", publishedAfter?: string, country?: string) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
      const youtube = google.youtube({ version: "v3", auth: apiKey });
      
      const searchParams: {
        part: string[];
        q: string;
        maxResults: number;
        type: string[];
        order: string;
        relevanceLanguage: string;
        publishedAfter?: string;
        regionCode?: string;
      } = {
        part: ["snippet"],
        q: query,
        maxResults: 15,
        type: ["video"],
        order: order,
        relevanceLanguage: "pt"
      };
      
      if (publishedAfter) {
        searchParams.publishedAfter = publishedAfter;
      }
      if (country && country !== "any") {
        searchParams.regionCode = country;
        if (country === "PT") {
          searchParams.q = `${query} Portugal`;
        } else if (country === "BR") {
          searchParams.q = `${query} Brasil`;
        } else if (country === "US") {
          searchParams.q = `${query} USA`;
          searchParams.relevanceLanguage = "en";
        }
      }

      // Search for videos
      const searchRes = await youtube.search.list(searchParams);

      const videos = searchRes.data.items || [];
      const results = [];

      for (const video of videos) {
        const videoId = video.id?.videoId;
        const channelId = video.snippet?.channelId;
        
        if (!videoId || !channelId) continue;

        // Get video stats
        const videoDetailRes = await youtube.videos.list({
          part: ["statistics", "snippet"],
          id: [videoId]
        });

        // Get channel details for better avatar/stats
        const channelRes = await youtube.channels.list({
          part: ["snippet", "statistics"],
          id: [channelId]
        });

        const videoData = videoDetailRes.data.items?.[0];
        const channelData = channelRes.data.items?.[0];

        interface CommentThreadItem {
          snippet?: {
            topLevelComment?: {
              snippet?: {
                textDisplay?: string;
              };
            };
          };
        }

        let topComments: string[] = [];
        try {
          const commentsRes = await youtube.commentThreads.list({
            part: ["snippet"],
            videoId: videoId,
            maxResults: 3
          });
          topComments = commentsRes.data.items?.map((item: CommentThreadItem) => item.snippet?.topLevelComment?.snippet?.textDisplay || "") || [];
        } catch (commentErr) {
          // ignore comments disabled or quota limits gracefully
          topComments = [];
        }

        results.push({
          title: videoData?.snippet?.title || video.snippet?.title,
          description: videoData?.snippet?.description || video.snippet?.description,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          likes: parseInt(videoData?.statistics?.likeCount || "0"),
          comments: parseInt(videoData?.statistics?.commentCount || "0"),
          channelName: channelData?.snippet?.title || video.snippet?.channelTitle,
          channelHandle: channelData?.snippet?.customUrl || `@${channelId}`,
          channelAvatar: channelData?.snippet?.thumbnails?.default?.url,
          publishedAt: video.snippet?.publishedAt,
          topComments
        });
      }

      return results;
    } catch (error) {
      console.error("YouTube API Error:", error);
      return null;
    }
  };

  // Helper for AI Client (Groq/Gemini fallback)
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const getAIClient = () => {
    const groqKey = process.env.GROQ_API_KEY || process.env.FEEDMETRICS_GROQ_GEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    const providers: { client: any; model: string; name: string }[] = [];

    // Prioritize Groq as per user preference (llama-3.1-8b-instant first, then Qwen fallbacks)
    try {
      if (groqKey) {
        const groqClient = new OpenAI({
          apiKey: groqKey,
          baseURL: "https://api.groq.com/openai/v1"
        });
        
        // 1. llama-3.1-8b-instant
        providers.push({
          client: groqClient,
          model: "llama-3.1-8b-instant",
          name: "Groq (Llama 3.1 8B)"
        });

        // 2. qwen-2.5-coder-32b (The official active Qwen 32B coder model on Groq)
        providers.push({
          client: groqClient,
          model: "qwen-2.5-coder-32b",
          name: "Groq (Qwen 2.5 Coder 32B)"
        });

        // 3. llama-3.3-70b-versatile
        providers.push({
          client: groqClient,
          model: "llama-3.3-70b-versatile",
          name: "Groq (Llama 3.3 70B)"
        });
      }
    } catch (e) {
      console.warn("Failed to instantiate Groq client:", e);
    }

    // Initialize Gemini (In Google AI Studio environment, the model 'gemini-3.5-flash' is completely free and stable)
    // Always keep Gemini as a key fallback for ultimate stability and resilience
    let geminiClientInstance: any = null;
    try {
      if (geminiKey) {
        geminiClientInstance = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        providers.push({
          client: geminiClientInstance,
          model: "gemini-3.5-flash",
          name: "Gemini"
        });
      }
    } catch (e) {
      console.warn("Failed to instantiate Gemini client:", e);
    }

    // Return primary client and configurations for maximum backward compatibility
    return {
      providers, // Ordered list of unique fallback providers
      client: providers[0]?.client || null,
      model: providers[0]?.model || "none",
      fallbackClient: providers[1]?.client || providers[0]?.client || null,
      fallbackModel: providers[1]?.model || providers[0]?.model || "none",
      geminiClient: geminiClientInstance || null
    };
  };

  const cleanAndParseJSON = (text: string) => {
    // Remove deepseek think blocks
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // First, try direct parsing of the cleaned text (or after stripping markdown wrappers)
    try {
      const stripped = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      return JSON.parse(stripped);
    } catch (e) {
      // Direct parsing failed, try extracting the first { to last } block
      const startIdx = cleaned.indexOf("{");
      const endIdx = cleaned.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const candidate = cleaned.substring(startIdx, endIdx + 1);
        try {
          return JSON.parse(candidate);
        } catch (innerE) {
          // If it's half truncated, try appending closing curly braces/brackets sequentially to see if it fixes it
          const closures = ["}", "]}", "]} }", "] }"];
          for (const closing of closures) {
            try {
              return JSON.parse(candidate + closing);
            } catch (err) {
              // try next closure
            }
          }
        }
      }
      
      console.error("Failed to parse JSON. Raw text length:", text.length, "Text start:", text.substring(0, 100));
      throw new Error("Não foi possível extrair os dados em formato JSON válido.");
    }
  };

  const safeIsoDate = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString().split('T')[0];
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    } catch (err) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const truncateData = (data: any, maxItems: number) => {
    if (Array.isArray(data)) {
      return data.slice(0, maxItems);
    }
    return data;
  };

  const getGDELTData = async (query: string) => {
    try {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error("GDELT API HTTP non-200");
      const json = await res.json();
      return json.articles || [];
    } catch (e) {
      console.log("GDELT API unavailable (using quiet fallback / RSS channels instead)");
      return [];
    }
  };

  const mapAdToBothSchemas = (item: any, query: string) => {
    const adId = item.adId || item.id || String(Math.floor(Math.random() * 10000000000));
    const pageName = item.pageName || "Anunciante Verificado";
    const bodyText = item.bodyText || (Array.isArray(item.adCreativeBodies) ? item.adCreativeBodies[0] : (item.adCreativeBodies || `Descubra a melhor solução para o segmento de ${query} hoje. Clique para saber mais.`));
    const format = item.format || (item.publisherPlatforms?.includes("instagram") ? "Vídeo / Reels" : "Imagem");
    const headline = item.headline || `Anúncio Oficial - ${pageName}`;
    const cta = item.cta || "Saiba mais";
    const started = item.started || (item.adCreationTime ? new Date(item.adCreationTime).toLocaleDateString("pt-BR") : "Últimos dias");

    return {
      // Schema A (Frontend React)
      adId,
      bodyText,
      format,
      headline,
      cta,
      started,
      pageName,
      
      // Schema B (Backend Internal/AllSettled Legacy)
      id: adId,
      pageId: item.pageId || "",
      adCreationTime: item.adCreationTime || new Date().toISOString(),
      adCreativeBodies: Array.isArray(item.adCreativeBodies) ? item.adCreativeBodies : [bodyText],
      fundingEntity: item.fundingEntity || "",
      publisherPlatforms: item.publisherPlatforms || ["instagram", "facebook"],
      spendRange: item.spendRange || "R$ 100 - R$ 499",
      impressionsRange: item.impressionsRange || "10K - 50K",
      isActive: item.isActive !== undefined ? item.isActive : true
    };
  };

  const getAlgorithmicMetaAdsFallback = (query: string) => {
    const fallbackList = [
      {
        id: "fallback_1",
        pageName: `Especialista Certificado em ${query}`,
        pageId: "fb_110",
        adCreationTime: new Date().toISOString(),
        adCreativeBodies: [
          `Quer decolar no segmento de ${query}? Descubra o método definitivo passo a passo que já foi validado por centenas de pessoas no Brasil. Clique no botão de "Saiba Mais" e comece com desconto único de lançamento!`
        ],
        fundingEntity: `Escola de ${query}`,
        publisherPlatforms: ["instagram", "facebook"],
        spendRange: "R$ 100 - R$ 499",
        impressionsRange: "20k - 80k",
        isActive: true
      },
      {
        id: "fallback_2",
        pageName: `Soluçoes Práticas de ${query}`,
        pageId: "fb_120",
        adCreationTime: new Date().toISOString(),
        adCreativeBodies: [
          `Cansado de errar ao aplicar ${query} no seu dia a dia? Conheça nossa ferramenta automatizada que simplifica todo o processo em menos de 5 minutos diários.`
        ],
        fundingEntity: `Premium ${query} Ltda`,
        publisherPlatforms: ["instagram"],
        spendRange: "R$ 500 - R$ 999",
        impressionsRange: "50k - 150k",
        isActive: true
      }
    ];

    return {
      adsCount: 140,
      activeAdsCount: fallbackList.length,
      nicheAnalysis: `Análise competitiva contingencial para o nicho "${query}" baseada em estimativas consolidadas do mercado digital no Instagram/Facebook Ads.`,
      mainHooks: [
        `Foco na resolução rápida do problema principal de ${query}`,
        "Antes vs Depois ou demonstração direta do benefício",
        "Garantia de satisfação de risco zero ou frete facilitado"
      ],
      topAdvertiserPages: [
        { name: `Agência Especializada em ${query}`, adsCount: 12 },
        { name: `Instituto Nacional de ${query}`, adsCount: 8 }
      ],
      referenceAds: fallbackList.map(item => mapAdToBothSchemas(item, query)),
      isDemo: true
    };
  };

  const getAlgorithmicMarketReportFallback = (query: string, dataCommons: any, isListerUp: boolean) => {
    const pop = Math.round((dataCommons?.population || 214000000) * 0.015);
    const mktSizeVal = Math.round(10 + Math.random() * 20);

    const baseReport: any = {
      aiProviderFailed: true,
      trendingTopics: [
        { topic: `Novas ferramentas para ${query}`, growth: "+180%" },
        { topic: `Como otimizar processos em ${query}`, growth: "+120%" },
        { topic: `Guia definitivo de ${query} 2026`, growth: "+95%" },
        { topic: `Casos de sucesso com ${query}`, growth: "+85%" },
        { topic: `Erros comuns ao aplicar ${query}`, growth: "+70%" }
      ],
      explosiveTopics: [
        { topic: `${query} automatizado com IA`, score: 98 },
        { topic: `Tendência minimalista de ${query}`, score: 87 },
        { topic: `Sustentabilidade em ${query}`, score: 82 },
        { topic: `Formatos híbridos de ${query}`, score: 75 },
        { topic: `${query} para pequenas equipes`, score: 71 }
      ],
      marketInsights: `Análise estruturada de mercado para o segmento de "${query}". Com base em estimativas de dados demográficos do Data Commons consolidadas com canais do YouTube e volumes de busca brasileiras no Trends, o nicho apresenta uma evolução constante com consumidores priorizando soluções rápidas e de alto impacto que unam conveniência e facilidade de adaptação no dia a dia.`,
      mediaInsights: `No YouTube, os formatos que mais performam para "${query}" envolvem reviews rápidos, comparativos táteis diretos e tutoriais informais que retêm o usuário nos primeiros 12 segundos através de ganchos visuais.`,
      topSearches: [
        { keyword: `${query} o que é`, volume: "alta" },
        { keyword: `${query} comprar`, volume: "alta" },
        { keyword: `melhor ${query} do brasil`, volume: "média" },
        { keyword: `${query} passo a passo`, volume: "média" },
        { keyword: `${query} gratuito`, volume: "baixa" }
      ],
      audienceStats: { 
        ageMajority: "25-34", 
        primaryPlatform: "Instagram", 
        engagementRate: "5.2%" 
      },
      audienceInsights: { 
         demographics: `Público predominantemente jovem adulto (25-34 anos), altamente inclinado a transações e serviços via mobile no Brasil.`, 
         lifestyle: ["Conveniência digital", "Consumo consciente e focado", "Preferência por transparência nas marcas"], 
         contentPreferences: ["Vídeos explicativos curtíssimos", "Estudos de caso reais de pessoas comuns", "Formatos dinâmicos nos Stories/Reels"], 
         interests: [`Inovação prática`, `Otimização de rotina`, `Crescimento profissional`], 
         devices: ["Mobile (88%)", "Desktop (12%)"], 
         regions: [
           {"country": "Brazil", "weight": 70}, 
           {"country": "United States", "weight": 15}, 
           {"country": "Portugal", "weight": 15}
         ], 
         whatTheyCareAbout: [`Qualidade imediata do produto / serviço`, `Transparência nos custos e prazos de entrega`, `Suporte ágil e simplificado pós-venda`], 
         buyingTriggers: ["Prova social expressiva de clientes reais", "Ofertas baseadas em senso de exclusividade temporária", "Demonstrações sem complicação"] 
      },
      platformRelevance: [
        { "platform": "Instagram", "score": 95 }, 
        { "platform": "TikTok", "score": 88 },
        { "platform": "YouTube", "score": 82 },
        { "platform": "WhatsApp", "score": 78 }
      ],
      formatPerformance: [
        { "format": "Vídeos Curtos (Reels/Shorts)", "engagement": 95 },
        { "format": "Stories Diários", "engagement": 88 },
        { "format": "Vlogs de Bastidores", "engagement": 74 }
      ],
      sentimentAnalysis: { "positive": 68, "neutral": 22, "negative": 10 },
      engagementEvolution: [
        { "date": "Jan", "value": 50 },
        { "date": "Fev", "value": 55 },
        { "date": "Mar", "value": 68 },
        { "date": "Abr", "value": 72 },
        { "date": "Mai", "value": 88 }
      ],
      wordCloud: [
        { "text": query, "value": 100 },
        { "text": "Inovação", "value": 85 },
        { "text": "Eficiência", "value": 78 },
        { "text": "Sucesso", "value": 72 },
        { "text": "Tecnologia", "value": 68 },
        { "text": "Qualidade", "value": 65 },
        { "text": "Praticidade", "value": 62 },
        { "text": "Guia Prático", "value": 58 },
        { "text": "Método", "value": 55 }
      ],
      contentIdeas: [
        { "title": `Como começar com ${query} hoje mesmo`, "description": "Um roteiro direto focado em iniciantes que reduz barreiras de entrada e desmistifica o assunto.", "type": "Reels / Shorts" },
        { "title": `Minha rotina real aplicando ${query}`, "description": "Conteúdo de bastidores de alta retenção mostrando vitórias e problemas comuns com transparência.", "type": "Vlog / Carousel" }
      ],
      mostRequested: [
        { "request": `Qual o custo real de implementar ${query}?`, "count": 340, "context": "Abordagem de total transparência financeira nos canais de comunicação." }
      ],
      nicheSegment: {
        population: pop,
        marketSize: `R$ ${mktSizeVal}.5B`,
        unemploymentRate: "2.8%",
        avgIncome: 6200,
        education: "45%",
        description: `Estatísticas estimadas para o grupo qualificado e de alto interesse de conversão no produto/serviço no Brasil.`
      },
      gdeltArticles: [
        {
          "title": `Explorando novas fronteiras de negócios no segmento de ${query}`,
          "url": `https://news.google.com/search?q=${encodeURIComponent(query)}`,
          "source": "Mídia Especializada",
          "date": new Date().toISOString().split("T")[0]
        }
      ]
    };

    if (isListerUp) {
      baseReport.listerupCreatorsData = {
        risingCreators: [
          { 
            "name": `@especialista_${query.toLowerCase().replace(/[^a-z]/g, "")}`, 
            "category": "Education / Lifestyle", 
            "growth": "+145%", 
            "style": "Formato tátil, closes macro, som foley, cortes ágeis e explicações funcionais", 
            "campaignFit": "Integração orgânica de ferramentas no cotidiano por meio de indicação direta",
            "followers": "320K",
            "engagementRate": 5.6,
            "recommendedBudget": "R$ 4.800"
          },
          { 
            "name": `@bastidores_${query.toLowerCase().replace(/[^a-z]/g, "")}`, 
            "category": "Daily Vlogger", 
            "growth": "+110%", 
            "style": "Vlogs diários em tom confidencial, foco forte em resolução de dores da comunidade", 
            "campaignFit": "Roteiros de 30 segundos no Reels com chamada de ação clara e cupom personalizado",
            "followers": "150K",
            "engagementRate": 6.8,
            "recommendedBudget": "R$ 2.400"
          }
        ],
        semioticsCampaigns: {
          "aesthetic": `Visual minimalista em tons orgânicos focado no uso diário e sensação tátil de ${query}`,
          "colors": ["Ardósia", "Argila Quente", "Oliva Mate"],
          "colorsHex": ["#334155", "#C2410C", "#3F6212"],
          "emotionalTriggers": ["Acolhimento prático", "Alívio de rotina", "Clareza mental"],
          "storytellingHooks": [
            "Comece com 3 segundos de áudio rico demonstrando o produto",
            "Abra com uma pergunta provocativa focado em uma dor do nicho"
          ]
        },
        creativePerspectives: `As tendências recentes indicam alto desgaste de discursos corporativos ou artificiais de vendas para ${query}. O público-alvo valida criadores que detalham os processos imperfeitos de bastidores, convertendo a um custo de aquisição 32% mais estável comparado ao tráfego direto comum.`,
        audienceInterestsOverlap: [
          { "interest": "Eficiência e Hábitos", "percentage": 78 },
          { "interest": "Tecnologia Prática", "percentage": 52 },
          { "interest": "Design & Estética", "percentage": 42 }
        ],
        campaignPerformanceBenchmarks: [
          { "metricsName": "Custo de Aquisição (CPA)", "localValue": 18.2, "marketAverage": 35.8 },
          { "metricsName": "Taxa de Cliques (CTR)", "localValue": 4.6, "marketAverage": 1.7 },
          { "metricsName": "ROAS Médio de Creators", "localValue": 4.8, "marketAverage": 2.2 }
        ],
        campaignConversionFunnel: [
          { "step": "Vídeo Plays / Views", "value": 120000 },
          { "step": "Retenção Inicial / 3s", "value": 72000 },
          { "step": "Cliques no Link / CTR", "value": 5520 },
          { "step": "Inscrições / Compras", "value": 410 }
        ]
      };
    }

    return baseReport;
  };

  const getMetaAdsLibraryData = async (query: string, token?: string) => {
    const isDemo = !token || token.trim().length === 0 || token === "demo" || token === "DEMO" || token.startsWith("COLAR_") || token.startsWith("CONEXAO_") || token.startsWith("YOUR_");
    
    if (isDemo) {
      try {
        const prompt = `Gere uma análise realista e simulada do Meta Ads Library (Instagram/Facebook Ads) no Brasil para o nicho: "${query}". Retorne APENAS um objeto JSON válido correspondente ao nicho. Não use markdown adicionais (como \`\`\`json) fora do JSON bruto.
REGRAS: 
- referenceAds deve conter de 3 a 4 anúncios verossímeis em português.
- Ad copies em adCreativeBodies devem ser persuasivas, longas e focadas em conversão real do nicho.
- spendRange e impressionsRange devem ser numéricos verossímeis formatados com moeda (R$).
- mainHooks deve ter 3 ganchos exatos em português.
Formato JSON exigido:
{
  "adsCount": 350,
  "activeAdsCount": 165,
  "nicheAnalysis": "Análise profunda detalhando a saturação, formatos ideais e custos de leilão no Facebook/Instagram Ads para o nicho de ${query}.",
  "mainHooks": ["Gancho 1", "Gancho 2", "Gancho 3"],
  "topAdvertiserPages": [
     { "name": "Página Anunciante A", "adsCount": 24 },
     { "name": "Página Anunciante B", "adsCount": 18 }
  ],
  "referenceAds": [
    {
      "id": "1948529582910",
      "pageName": "Anunciante Premium de ${query}",
      "pageId": "8592039",
      "adCreationTime": "2026-05-19T14:32:00Z",
      "adCreativeBodies": ["Cópia do anúncio persuasiva e realista..."],
      "fundingEntity": "Investidor de Mídia",
      "publisherPlatforms": ["instagram", "facebook"],
      "spendRange": "R$ 100 - R$ 499",
      "impressionsRange": "10K - 50K",
      "isActive": true
    }
  ]
}`;
        const aiProvider = getAIClient();
        const completion = await generateWithFallback(aiProvider, {
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1500
        });
        const parsed = cleanAndParseJSON(completion.choices[0].message.content || "{}");
        parsed.isDemo = true;
        
        if (parsed.referenceAds && Array.isArray(parsed.referenceAds)) {
          parsed.referenceAds = parsed.referenceAds.map((ad: any) => mapAdToBothSchemas(ad, query));
        } else {
          parsed.referenceAds = getAlgorithmicMetaAdsFallback(query).referenceAds;
        }
        
        return parsed;
      } catch (err) {
        console.error("Failed executing Meta Ads simulation prompts, formatting algorithmic mock:", err);
        return getAlgorithmicMetaAdsFallback(query);
      }
    }

    try {
      const url = `https://graph.facebook.com/v19.0/ads_archive?` + 
        `access_token=${encodeURIComponent(token!)}` +
        `&search_terms=${encodeURIComponent(query)}` +
        `&ad_reached_countries=${encodeURIComponent('["BR"]')}` +
        `&ad_active_status=ACTIVE` +
        `&fields=id,page_id,page_name,ad_creation_time,ad_creative_bodies,funding_entity,publisher_platforms,spend,impressions` +
        `&limit=8`;
        
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `API HTTP status erro ${response.status}`);
      }
      
      const resData = await response.json();
      const rawAds = resData.data || [];
      
      if (rawAds.length === 0) {
        const fallback = getAlgorithmicMetaAdsFallback(query);
        fallback.isDemo = false;
        fallback.nicheAnalysis = `Nenhum anúncio ativo foi encontrado em tempo real no Meta Ads Library para "${query}". Abaixo exibimos referências de estrutura projetadas para o nicho de forma analítica.`;
        return fallback;
      }

      const referenceAds = rawAds.map((ad: any) => {
        let spendStr = "R$ 0 - 99";
        if (ad.spend) {
          const lower = ad.spend.lower_bound;
          const upper = ad.spend.upper_bound;
          spendStr = upper ? `R$ ${lower} - R$ ${upper}` : `R$ ${lower}+`;
        }
        let impStr = "< 1K";
        if (ad.impressions) {
          const lower = ad.impressions.lower_bound;
          const upper = ad.impressions.upper_bound;
          impStr = upper ? `${(lower/1000).toFixed(0)}k - ${(upper/1000).toFixed(0)}k` : `${(lower/1000).toFixed(0)}k+`;
        }

        const rawAd = {
          id: ad.id || String(Math.floor(Math.random() * 10000000000)),
          pageName: ad.page_name || "Anunciante Verificado",
          pageId: ad.page_id || "",
          adCreationTime: ad.ad_creation_time || new Date().toISOString(),
          adCreativeBodies: Array.isArray(ad.ad_creative_bodies) ? ad.ad_creative_bodies : [ad.ad_creative_bodies || ""],
          fundingEntity: ad.funding_entity || "",
          publisherPlatforms: Array.isArray(ad.publisher_platforms) ? ad.publisher_platforms : ["instagram", "facebook"],
          spendRange: spendStr,
          impressionsRange: impStr,
          isActive: true
        };

        return mapAdToBothSchemas(rawAd, query);
      });

      const pagesMap: Record<string, number> = {};
      referenceAds.forEach((ad: any) => {
        pagesMap[ad.pageName] = (pagesMap[ad.pageName] || 0) + 1;
      });
      const topAdvertiserPages = Object.entries(pagesMap).map(([name, adsCount]) => ({ name, adsCount })).sort((a,b)=> b.adsCount - a.adsCount);

      let nicheAnalysis = `Foram encontrados anúncios reais e ativos na biblioteca de anúncios focados em "${query}". Campanha se concentrando em mídias no Instagram e Facebook com forte teor de marketing direto.`;
      let mainHooks = ["Gatilhos de urgência", "Campanha institucional", "Atrativo de desconto"];
      
      try {
        const copiesText = referenceAds.map((ad: any) => ad.bodyText).filter(Boolean).slice(0, 3).join("\n---\n");
        const prompt = `Analise estes textos reais de anúncios do Facebook Ads sobre o nicho de "${query}":\n\n${copiesText}\n\nExtraia em português brasileiro: 1. Uma breve análise estruturada de saturação e formato de 2 frases. 2. Três ganchos textuais (hooks) mais repetidos de conversão. Retorne estritamente um JSON no formato:\n{ "nicheAnalysis": "sua análise aqui", "mainHooks": ["gancho 1", "gancho 2", "gancho 3"] }`;
        const aiProvider = getAIClient();
        const aiRes = await generateWithFallback(aiProvider, {
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 500
        });
        const parsedSummary = cleanAndParseJSON(aiRes.choices[0].message.content || "{}");
        if (parsedSummary.nicheAnalysis) nicheAnalysis = parsedSummary.nicheAnalysis;
        if (parsedSummary.mainHooks && parsedSummary.mainHooks.length > 0) mainHooks = parsedSummary.mainHooks;
      } catch (sumErr) {
        console.warn("Failed fetching AI summaries of real ads, mapping fallback strings:", sumErr);
      }

      return {
        adsCount: rawAds.length * 12,
        activeAdsCount: rawAds.length,
        nicheAnalysis,
        mainHooks,
        topAdvertiserPages,
        referenceAds,
        isDemo: false
      };
    } catch (realErr: any) {
      console.warn("Meta Ads API Permission/Connection exception occurred:", realErr.message || realErr);
      const isPermissionErr = String(realErr.message || "").toLowerCase().includes("permission") || String(realErr.message || "").toLowerCase().includes("access");
      
      const fallback = getAlgorithmicMetaAdsFallback(query);
      fallback.isDemo = true;
      fallback.isPermissionError = isPermissionErr;
      fallback.errorMessage = realErr?.message || "Erro Desconhecido";
      
      if (isPermissionErr) {
        fallback.nicheAnalysis = `Aviso de Integração: O token do Meta Ads fornecido não possui permissões completas (erro: "Application does not have permission for this action"). Como contingência imediata, ativamos o modelo preditivo sintético para projetar ganchos e criativos de alto desempenho para "${query}".`;
      } else {
        fallback.nicheAnalysis = `Conexão Contingencial: Falha ao carregar anúncios em tempo real (${realErr?.message || "Serviço Indisponível"}). Ativamos o modo inteligente de referência local para o nicho "${query}".`;
      }
      return fallback;
    }
  };

  const getDataCommonsData = async () => {
    const dcKey = process.env.DATA_COMMONS_API_KEY || process.env.DATA_COMMONS_KEY;
    const dcHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (dcKey) {
      dcHeaders["x-api-key"] = dcKey;
    }
    try {
      const variables = [
        "Count_Person",
        "Amount_EconomicActivity_GrossDomesticProduct_Nominal_Value",
        "Count_Person_Unemployed",
        "Median_Income_Person",
        "Percent_Person_WithHigherEducation"
      ];
      const url = `https://api.datacommons.org/v1/bulk/point/value?entities=country/BRA&${variables.map(v => `variables=${v}`).join("&")}`;
      const res = await fetch(url, { headers: dcHeaders, signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        // Quiet fallback, avoids loud errors
        return null;
      }
      const json = await res.json();
      return json;
    } catch (e) {
      // Quiet fallback, avoids loud errors
      return null;
    }
  };

  const parseDataCommonsData = (raw: any) => {
    const parseValue = (variable: string, fallback: any) => {
      if (!raw) return fallback;
      const observation = raw.observations?.find((o: any) => o.variable === variable) || 
                          raw.data?.find((d: any) => d.variable === variable) ||
                          raw.values?.[variable] ||
                          raw.data?.[variable];
      if (observation) {
        if (typeof observation === 'object') {
          return observation.value !== undefined ? observation.value : (observation.scalar?.value !== undefined ? observation.scalar.value : fallback);
        }
        return observation;
      }
      return fallback;
    };

    const population = Number(parseValue("Count_Person", 215313498));
    const gdp = Number(parseValue("Amount_EconomicActivity_GrossDomesticProduct_Nominal_Value", 1920000000000));
    const unemployment = Number(parseValue("Count_Person_Unemployed", 8500000));
    const avgIncome = Number(parseValue("Median_Income_Person", 2600));
    const education = parseValue("Percent_Person_WithHigherEducation", "21%");

    const unemploymentRateStr = ((unemployment / population) * 100).toFixed(1) + "%";

    return {
      population,
      gdp,
      unemploymentRate: unemploymentRateStr !== "0.0%" ? unemploymentRateStr : "8.3%",
      avgIncome: avgIncome || 2600,
      education: education || "21%",
      source: "Data Commons API (IBGE, World Bank)"
    };
  };

  const generateWithFallback = async (aiProvider: any, options: any) => {
    // Helper to run prompt using Gemini client
    const runGemini = async (client: any, modelName: string) => {
      const messages = options.messages || [];
      const systemInstruction = messages.filter((m: any) => m.role === "system").map((m: any) => m.content).join("\n\n");
      const userContent = messages.filter((m: any) => m.role === "user").map((m: any) => m.content).join("\n\n");
      
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (options.response_format && (options.response_format.type === "json_object" || options.response_format === "json_object")) {
        config.responseMimeType = "application/json";
      }
      
      const response = await client.models.generateContent({
        model: modelName || "gemini-3.5-flash",
        contents: userContent || "Hello",
        config: config
      });
      
      return {
        choices: [
          {
            message: {
              content: response.text || "",
              role: "assistant"
            }
          }
        ]
      };
    };

    const tryClient = async (client: any, model: string, currentOptions: any): Promise<any> => {
      // Check if this is a GoogleGenAI/Gemini instance
      if (client instanceof GoogleGenAI || (client && typeof client.models?.generateContent === 'function')) {
        return await runGemini(client, model);
      }
      
      try {
        return await client.chat.completions.create({
          ...currentOptions,
          model: model
        });
      } catch (error: any) {
        const msg = error?.message || "";
        const isTokenLimitError = error?.status === 402 || msg.includes("credits") || msg.includes("max_tokens") || msg.includes("afford") || msg.includes("limit exceeded");
        
        if (isTokenLimitError) {
          const match = msg.match(/can only afford (\d+)/i);
          const affordable = match && match[1] ? parseInt(match[1], 10) : null;
          
          if (affordable && affordable >= 100) {
            const adjustedMax = Math.max(100, affordable - 30);
            console.warn(`Self-healing retry: reduced max_tokens from ${currentOptions.max_tokens} to ${adjustedMax}`);
            const fallbackOptions = { ...currentOptions, max_tokens: adjustedMax };
            return await client.chat.completions.create({
              ...fallbackOptions,
              model: model
            });
          } else {
            // Re-try with safe very low token count
            const lowMax = Math.min(250, currentOptions.max_tokens || 250);
            if (lowMax < (currentOptions.max_tokens || 1000)) {
              console.warn(`Self-healing retry: ultra-low max_tokens ${lowMax}`);
              const fallbackOptions = { ...currentOptions, max_tokens: lowMax };
              return await client.chat.completions.create({
                ...fallbackOptions,
                model: model
              });
            }
          }
        }
        
        // Handle response_format unsupported
        if (currentOptions.response_format && (error?.status === 400 || msg.includes("response_format") || msg.includes("not implement"))) {
          const { response_format, ...restOptions } = currentOptions;
          return await client.chat.completions.create({
            ...restOptions,
            model: model
          });
        }
        
        throw error;
      }
    };

    // Construct unified list of providers to try in sequence
    let listToTry: { client: any; model: string; name: string }[] = [];
    if (aiProvider.providers && Array.isArray(aiProvider.providers)) {
      listToTry = [...aiProvider.providers];
    } else {
      // Fallback for backward compatibility
      if (aiProvider.client) {
        listToTry.push({ client: aiProvider.client, model: aiProvider.model, name: "Primary" });
      }
      if (aiProvider.fallbackClient && aiProvider.fallbackClient !== aiProvider.client) {
        listToTry.push({ client: aiProvider.fallbackClient, model: aiProvider.fallbackModel, name: "Fallback" });
      }
      if (aiProvider.geminiClient && aiProvider.geminiClient !== aiProvider.client && aiProvider.geminiClient !== aiProvider.fallbackClient) {
        listToTry.push({ client: aiProvider.geminiClient, model: "gemini-3.5-flash", name: "Gemini" });
      }
    }

    let lastError: any = new Error("Nenhum provedor de IA disponível.");
    const errorsLog: string[] = [];
    for (let i = 0; i < listToTry.length; i++) {
      const provider = listToTry[i];
      try {
        console.log(`Trying LLM provider: ${provider.name} (model: ${provider.model})`);
        return await tryClient(provider.client, provider.model, options);
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || JSON.stringify(err);
        console.warn(`Provedor de LLM ${provider.name} falhou: ${errMsg}. Tentando próximo na fila...`);
        errorsLog.push(`[${new Date().toISOString()}] Provider: ${provider.name}, Model: ${provider.model}, Error: ${errMsg}`);
      }
    }

    if (errorsLog.length > 0) {
      try {
        fs.appendFileSync(path.join(process.cwd(), "ai_diagnostics.log"), errorsLog.join("\n") + "\n");
      } catch (logErr) {
        // Safe ignore
      }
      throw new Error(`Falha nos provedores: ${errorsLog.join("; ")}`);
    }

    throw lastError;
  };

  const generateHighQualityContent = async (aiProvider: any, prompt: string) => {
    try {
      const response = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt + "\n\nResponda apenas em JSON." }],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });
      return cleanAndParseJSON(response.choices[0].message.content || "{}");
    } catch (error: any) {
      console.error("Content generation failed:", error.message);
      return { error: "Erro ao gerar conteúdo. Tente novamente mais tarde." };
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // API Route for Word Cloud
  app.post("/api/generate-word-cloud", async (req, res) => {
    try {
      const { feedbacks } = req.body;
      const limitedFeedbacks = truncateData(feedbacks, 15);
      
      const textToAnalyze = limitedFeedbacks && Array.isArray(limitedFeedbacks) 
        ? limitedFeedbacks.map(f => Object.values(f).join(" ")).join(" ")
        : "";

      if (!textToAnalyze || textToAnalyze.length < 10) {
        return res.json({ words: [] });
      }

      const prompt = `Analise os seguintes feedbacks de clientes e extraia as principais palavras-chave (máximo 15). 
Para cada palavra ou expressão curta (máx 2 palavras), forneça um valor numérico de relevância ou quão frequentemente elas parecem aparecer no contexto, de 1 a 10.
Devolve APENAS um JSON no formato: { "words": [{ "text": "palavra", "value": numero }] }
Feedbacks:
${textToAnalyze}
`;

      const aiProvider = getAIClient();
      const completion = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });
      const json = cleanAndParseJSON(completion.choices[0].message.content || "{}");
      
      res.json(json);
    } catch (error) {
      console.warn('Error generating word cloud, falling back programmatically:', error);
      const fallbackWords = [
        { text: "Inovação", value: 10 },
        { text: "Praticidade", value: 9 },
        { text: "Eficiência", value: 8 },
        { text: "Demanda", value: 8 },
        { text: "Qualidade", value: 7 },
        { text: "Tecnologia", value: 7 },
        { text: "Crescimento", value: 6 }
      ];
      res.json({ words: fallbackWords, aiProviderFailed: true });
    }
  });

  // API Route for Insights
  app.post("/api/generate-insights", async (req, res) => {
    try {
      const { feedbacks } = req.body;
      if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
        return res.json({ insight: "Nenhum feedback disponível para análise." });
      }

      const prompt = `Atue como um analista de Sucesso do Cliente sênior. 
Analise a seguinte lista de feedbacks (dados JSON) fornecidos pelos clientes.
Sintetize os problemas, sentimentos recorrentes e oportunidades de melhoria.
Seja conciso, direto, profissional e gere insights valiosos em português do Brasil. Escreva a resposta em Markdown claro, com subtítulos e bullet points, se apropriado.

Dados de feedbacks (apenas uma amostra para análise):
${JSON.stringify(truncateData(feedbacks, 15), null, 2)}
`;

      const aiProvider = getAIClient();
      const completion = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500
      });
      const insight = completion.choices[0].message.content || "";
      res.json({ insight });
    } catch (error) {
      console.warn('Error generating insights, falling back programmatically:', error);
      const fallbackInsight = `### 📋 Relatório de Análise e Insights de Feedback (Mapeamento de Suporte)

* **Sentimento Geral**: Observamos uma busca clara por agilidade e clareza no entendimento da solução.
* **Pontos de Atenção**:
  * Prazos de entrega de valor imediato e suporte.
  * Facilidade de uso inicial para novos integradores.
* **Oportunidades**:
  * Criação de tutoriais de "iniciação rápida" (quick-start).
  * Comunicação transparente de custos e benefícios técnicos.
  
*Nota: Provedores de IA principais indisponíveis ou saturados no momento. Insights calculados através de heurísticas integradas de contingência do servidor.*`;
      res.json({ insight: fallbackInsight, aiProviderFailed: true });
    }
  });

  // API Route for Market Data Suggestions
  app.get("/api/market-suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({ suggestions: [] });
      }

      const prompt = `Gere uma lista simples (apenas texto, um por linha) de 5 sugestões de termos de busca que sejam muito pesquisados no mercado e que completem ou sejam relacionados ao termo digitado: "${query}". Responda apenas com a lista em JSON no formato: { "suggestions": ["termo 1", "termo 2", ...] }. NUNCA use emojis e evite icones na resposta.`;
      
      const aiProvider = getAIClient();
      const completion = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 800
      });
      const json = cleanAndParseJSON(completion.choices[0].message.content || "{}");
      
      res.json(json);
    } catch (error) {
      console.warn('Error generating suggestions, falling back programmatically:', error);
      res.json({ 
        suggestions: [
          `${query} profissional`,
          `${query} preço`,
          `melhor ${query}`,
          `${query} online`,
          `${query} como funciona`
        ],
        aiProviderFailed: true 
      });
    }
  });

  // API Route for Market Data Studio
  app.post("/api/market-data", async (req, res) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-require-imports */
    try {
      const { query, listerupCreators, metaAdsActive } = req.body;
      const metaAdsToken = req.body.metaAdsToken || process.env.META_ADS_TOKEN;
      if (!query || query.trim().length === 0) {
        return res.json({ error: "Query não fornecida." });
      }

      // Translate query to English for better GDELT search
      let englishQuery = query;
      try {
        const aiProviderForTranslation = getAIClient();
        const translationPrompt = `Translate this Brazilian Portuguese market niche or search query to English. Return ONLY the translated English search terms (no quotes, no punctuation, no extra text). Query: "${query}"`;
        const translationRes = await generateWithFallback(aiProviderForTranslation, {
          messages: [{ role: "user", content: translationPrompt }],
          max_tokens: 30
        });
        const translatedText = translationRes.choices[0].message.content?.trim();
        if (translatedText && translatedText.length > 0) {
          englishQuery = translatedText;
        }
      } catch (e) {
        console.warn("Translation failed, using original query:", e);
      }

      // Parallel fetching of rich data sources
      const [youtubeData, autocompleteData, newsData, newsGlobalData, redditData, gdeltData, dataCommonsData, metaAdsResult] = await Promise.allSettled([
        getYouTubeData(query),
        fetch(`http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`).then(res => res.json()).then(data => data[1] || []),
        new Promise<any[]>((resolve) => {
          try {
             const Parser = require('rss-parser');
             const parser = new Parser();
             parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`)
               .then((feed: any) => {
                 resolve(feed.items.slice(0, 7).map((item: any) => ({
                   title: item.title,
                   date: item.pubDate,
                   url: item.link || item.guid,
                   source: item.source?.text || item.title.split(" - ").pop()?.trim() || "Google News"
                 })));
               })
               .catch(() => resolve([]));
          } catch(e) { resolve([]); }
        }),
        new Promise<any[]>((resolve) => {
          try {
             const Parser = require('rss-parser');
             const parser = new Parser();
             parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(englishQuery)}&hl=en-US&gl=US&ceid=US:en`)
               .then((feed: any) => {
                 resolve(feed.items.slice(0, 7).map((item: any) => ({
                   title: item.title,
                   date: item.pubDate,
                   url: item.link || item.guid,
                   source: item.source?.text || item.title.split(" - ").pop()?.trim() || "Google News Global"
                 })));
               })
               .catch(() => resolve([]));
          } catch(e) { resolve([]); }
        }),
        fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=month&limit=5`).then(res => res.json()).then(data => data.data?.children?.map((c: any) => ({ title: c.data.title, subreddit: c.data.subreddit, upvotes: c.data.ups, comments: c.data.num_comments })) || []),
        getGDELTData(englishQuery),
        getDataCommonsData(),
        getMetaAdsLibraryData(query, metaAdsToken)
      ]);

      const yt = youtubeData.status === 'fulfilled' && youtubeData.value ? youtubeData.value : [];
      const autocompletes = autocompleteData.status === 'fulfilled' ? autocompleteData.value : [];
      const news = newsData.status === 'fulfilled' ? newsData.value : [];
      const newsGlobal = newsGlobalData.status === 'fulfilled' ? newsGlobalData.value : [];
      const reddit = redditData.status === 'fulfilled' ? redditData.value : [];
      const gdelt = gdeltData.status === 'fulfilled' && gdeltData.value ? gdeltData.value : [];
      const dcRaw = dataCommonsData.status === 'fulfilled' ? dataCommonsData.value : null;
      const metaAdsData = metaAdsResult.status === 'fulfilled' ? metaAdsResult.value : null;

      const dataCommons = parseDataCommonsData(dcRaw);

      let googleTrendsContext = "";
      try {
        const googleTrends = require('google-trends-api');
        const relatedQueriesRaw = await googleTrends.relatedQueries({keyword: query, geo: 'BR'});
        const relatedQueriesJSON = JSON.parse(relatedQueriesRaw);
        const topQueries = relatedQueriesJSON?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10).map((k:any) => `${k.query} (${k.value})`) || [];
        const risingQueries = relatedQueriesJSON?.default?.rankedList?.[1]?.rankedKeyword?.slice(0, 10).map((k:any) => `${k.query} (Crescimento: ${k.value}%)`) || [];
        
        googleTrendsContext = `Google Trends Queries em Alta (BR):\n${risingQueries.join(", ")}\nTop Queries:\n${topQueries.join(", ")}`;
      } catch (e) {
        googleTrendsContext = "Google Trends Indisponível no momento.";
      }

      let metaAdsContext = "";
      if (metaAdsData) {
        metaAdsContext = `
- SINAIS DE ANÚNCIOS ATIVOS (Meta Ads Library):
  * Total estimado de anúncios ativos em circulação no nicho: ${metaAdsData.adsCount} anúncios.
  * Principais ganchos criativos comuns observados: ${metaAdsData.mainHooks ? metaAdsData.mainHooks.join(", ") : "Nenhum gancho específico."}
  * Principais perfis anunciantes: ${metaAdsData.topAdvertiserPages ? metaAdsData.topAdvertiserPages.map((p: any) => `${p.name} (${p.adsCount} anúncios)`).join(", ") : "Nenhum anunciado específico."}
  * Resumo analítico rápido da concorrência: ${metaAdsData.nicheAnalysis || "Nenhuma análise específica fornecida."}
        `;
      }

      const realDataContext = `
DADOS REAIS CAPTURADOS (SEU TRABALHO APENAS SINTETIZA SOBRE ESSES SINAIS, PROIBIDO INVENTAR OU DEDUZIR FATOS FORA DELES):
- Google Autocomplete (Perguntas, dores e termos em tempo real): ${autocompletes.join(", ")}
- YouTube (Vídeos, estatísticas e comentários): ${JSON.stringify(truncateData(yt, 4).map((v: any) => ({ titulo: v.title, canal: v.channelName, curtidas: v.likes, comentarios: v.comments, comentariosExtrapolados: v.topComments })), null, 2)}
- Notícias Recentes (Google News RSS BR): ${JSON.stringify(news, null, 2)}
- Notícias Recentes Globais (Google News RSS Global): ${JSON.stringify(newsGlobal, null, 2)}
- Discussões no Reddit (Comunidade e Pains): ${JSON.stringify(reddit, null, 2)}
- GDELT Global Web Index (Notícias globais e atenção da mídia): ${JSON.stringify(gdelt.map((g: any) => ({ title: g.title, source: g.sourcecountry, date: g.seendate, url: g.url })), null, 2)}
- Data Commons Estatísticas Oficiais do Censo (BR):
  * População: ${dataCommons.population.toLocaleString('pt-BR')} pessoas
  * PIB Nominal Estimado: R$ ${(dataCommons.gdp / 1e12).toFixed(2)} Trilhões de Reais
  * Renda Média Mensal por Pessoa: R$ ${dataCommons.avgIncome.toLocaleString('pt-BR')}
  * Taxa de Desocupação (Desemprego): ${dataCommons.unemploymentRate}
  * Educação Superior: ${dataCommons.education}
  * Fonte: ${dataCommons.source}
- ${googleTrendsContext}
${metaAdsContext}
      `;

      const isListerUp = listerupCreators === true;

      const prompt = `Você é um Analista de Inteligência de Mercado Sênior. 
Seu trabalho é SINTETIZAR, EXCLUIR RUIDO E ESTRUTURAR as informações exatas sob o nicho "${query}" fornecido nas fontes de "DADOS REAIS CAPTURADOS".
IMPORTANTE: Não invente nem deduza fatos fora do contexto real, mas utilize os dados brutos e os sinais de mídias para modelar e projetar estimativas inteligentes específicas para este nicho de mercado.

${realDataContext}

REGRAS ESTRITAS (Siga à risca):
1. "trendingTopics": OBRIGATÓRIO preencher com NO MÍNIMO 5 tópicos densos e reais mesclando Google Trends, GDELT e Autocomplete. O "growth" deve representar o ganho de interesse (ex: "+270%").
2. "explosiveTopics": OBRIGATÓRIO retornar um array com no MÍNIMO 5 tópicos emergentes do Reddit/News/GDELT. O radar de potencial explosivo mede novas ideias embrionárias (ex: "vinho azul", "tampas ecológicas"). Score de 0 a 100.
3. Não restrinja as redes ao Reddit e Youtube. Classifique a relevância real do nicho em plataformas como Instagram, TikTok, Pinterest, LinkedIn e WhatsApp se aplicável, com "platformRelevance" (Mínimo 4 plataformas reais).
4. O campo "marketInsights" deve conter NO MÍNIMO um parágrafo longo e denso de 4-5 frases analíticas integrando os indicadores demográficos, econômicos de renda do Data Commons com os sinais de mídias mundiais do GDELT.
5. "mediaInsights" deve conter dicas avançadas e acionáveis sobre os melhores formatos visuais e ganchos baseados nos vídeos de alto engajamento capturados do YouTube.
6. O campo "audienceInsights" de análises do público ("demographics", "whatTheyCareAbout", etc.) deve ser diretamente abastecido e moldado pelas estatísticas econômicas e sociais reais fornecidas pelo Data Commons (população nacional, renda média, desemprego e nível superior de referência). Contudo, você DEVE segmentar, contrastar e estimar o perfil específico do nicho solicitado. Exemplo: se o nicho for "Roupas de Luxo", mostre que o público representa uma fração seleta (classes A/B representam ~1.5% da população de 215M) e que o rendimento e nível educacional do público-alvo deste nicho estão muito acima das médias nacionais fornecidas (média de R$ 2.600 e superior de 21%). Explicite estritamente esses cruzamentos de dados dentro das descrições para tornar as estimativas cientificamente fundamentadas no país.
7. O campo "wordCloud" deve conter OBRIGATORIAMENTE entre 15 e 25 palavras-chave e termos do nicho altamente relevantes (incluindo marcas populares, produtos específicos, dores, jargões técnicos) gerados dinamicamente a partir do autocomplete, YouTube, Reddit e notícias. Cada termo deve ter um valor de relevância variando de 10 a 100. NUNCA insira apenas o termo de busca genérico ou poucas palavras.
8. ATENÇÃO CRÍTICA PARA "nicheSegment": Você DEVE gerar números e valores econômicos dinâmicos que façam absoluto sentido lógico e de mercado para o nicho pesquisado (${query}), mudando de acordo com as características do público. NUNCA use valores genéricos, estáticos ou iguais aos exemplos.
   - População Foco ("population"): estime o grupo de interesse real no Brasil (ex: if popular, 5M a 15M; if super-premium, 500k a 1.5M).
   - Mercado Anual em Reais ("marketSize"): projete o TAM do nicho (ex: "R$ 4.5B", "R$ 22.8B").
   - Desemprego Alvo ("unemploymentRate"): represente a média do perfil comprador do nicho (ex: "1.2%", "4.5%").
   - Renda Média Mensal ("avgIncome"): renda média real de quem compra esse produto/serviço no Brasil (ex: 3500, 18500).
   - Educação Superior ("education"): percentual do grupo foco com diploma (ex: "45%", "85%").
   - Escreva descrições detalhadas e realistas no "description" justificando matematicamente porque ele difere das médias gerais nacionais do Data Commons.
9. ATENÇÃO CRÍTICA PARA "gdeltArticles" e "url": Você DEVE listar de 3 a 5 artigos de notícias. Use prioritariamente as notícias do GDELT ou do 'Notícias Recentes (Google News RSS)' fornecidas nos dados capturados, preservando rigorosamente suas URLs originais completas e reais. Se não houver notícias capturadas, elabore títulos lógicos de fontes confiáveis (Valor Econômico, Forbes Brasil, exame, G1, Bloomberg, etc.) e use caminhos de pesquisa seguros como "https://news.google.com/search?q=TERMO_CONVENIENTE" no campo URL. NUNCA, hipótese alguma, forneça strings como "https://valor.globo.com/empresas/noticia/placeholder" ou caminhos fictícios quebrados, pois eles geram erro 404 e arruinam a experiência do usuário.
10. O campo "regions" dentro de "audienceInsights" deve listar de 3 a 5 países onde este nicho de busca ${query} tem altíssimo consumo ou relevância global (utilizando nomes corretos em inglês para coincidir com o mapa-múndi GeoJSON, como "Brazil", "United States", "France", "Japan", "South Korea", "United Kingdom", "Germany", "Italy") e as respectivas porcentagens estimadas de representatividade que somem 100% no total. Evite reter 100% de peso apenas em "Brazil" para nichos amplamente globais.
11. O campo "engagementEvolution" OBRIGATORIAMENTE deve ser um array com no mínimo 5 pontos de dados cronológicos e lógicos dos últimos 5 meses (ex: "Jan", "Fev", "Mar", "Abr", "Mai") com valores de engajamento flutuando entre 30 e 100 para demonstrar um gráfico de linha progressivo e altamente informativo. Nunca retorne apenas um único ponto de dados.
${isListerUp ? `12. ADICIONAL CRÍTICO DA EXTENSÃO LISTERUP FOR CREATORS:
Como a extensão do ListerUp está ativa, você DEVE preencher um campo adicional no JSON chamado "listerupCreatorsData".
AVISO: NUNCA retorne nomes genéricos de exemplo como "Gabriel Tech" ou "Dicas de Estúdio". Gere nomes, estilos, categorias, canais e mídias inovadores em português que façam absoluto sentido para o nicho de "${query}" de forma brilhante e ultra-realística.
Retorne um objeto no formato exato:
{
  "risingCreators": [
    { 
      "name": "Nome/Handle de um Creator real ou plausível focado no nicho de ${query}", 
      "category": "Categoria específica (ex. Lifestyle, Reviewer tátil, Técnico focado)", 
      "growth": "porcentual de aceleração mensal (ex: +145%)", 
      "style": "Estilo estético e formato do roteiro focado no nicho de ${query}", 
      "campaignFit": "Como usar este criador para converter ou ativar vendas de ${query}",
      "followers": "Contagem de seguidores estimada (ex: 280k)",
      "engagementRate": 4.8, // taxa de engajamento decimal entre 1.0 e 15.0
      "recommendedBudget": "Valor estimado de investimento por post (ex: R$ 3.500)"
    }
  ],
  "semioticsCampaigns": {
    "aesthetic": "Foco visual recomendado de produção para ${query} (ex: iluminação quente de estúdio, closes macro táteis)",
    "colors": ["Nome de Cor 1", "Nome de Cor 2", "Nome de Cor 3"], // cores sugestivas 
    "colorsHex": ["#HEX1", "#HEX2", "#HEX3"], // códigos hex reais correspondentes às cores para usarmos na paleta de interface
    "emotionalTriggers": ["Gatilho 1", "Gatilho 2", "Gatilho 3"],
    "storytellingHooks": ["Roteiro de 15 segundos", "Gancho tátil", "Vlog narrado focado em problemas do nicho"]
  },
  "creativePerspectives": "Análise profunda detalhando as perspectivas semióticas e de roteirização para campanhas integrando criadores nativos no nicho de ${query}.",
  "audienceInterestsOverlap": [
    { "interest": "Tópico de interesse relacionado 1", "percentage": 85 },
    { "interest": "Tópico de interesse relacionado 2", "percentage": 62 },
    { "interest": "Tópico de interesse relacionado 3", "percentage": 48 },
    { "interest": "Tópico de interesse relacionado 4", "percentage": 25 }
  ],
  "campaignPerformanceBenchmarks": [
    { "metricsName": "Custo de Aquisição (CPA)", "localValue": 14.5, "marketAverage": 32.2 },
    { "metricsName": "Taxa de Cliques (CTR)", "localValue": 4.8, "marketAverage": 1.9 },
    { "metricsName": "Retorno de Roas Médio", "localValue": 5.4, "marketAverage": 2.8 }
  ],
  "campaignConversionFunnel": [
    { "step": "Vídeo Plays / Views", "value": 150000 },
    { "step": "Ganchos Retidos / 3s", "value": 84000 },
    { "step": "Visitas ao Link / CTR", "value": 9200 },
    { "step": "Conversões Concluídas", "value": 720 }
  ]
}` : ''}

Formato JSON EXIGIDO:
{
  "trendingTopics": [{ "topic": "nome do tópico real", "growth": "+120%" }],
  "explosiveTopics": [{ "topic": "nova tendência tendência", "score": 90 }],
  "marketInsights": "Um parágrafo de análise de mercado aprofundada baseada nos dados e cenário econômico.",
  "mediaInsights": "Um parágrafo de análise estratégica de mídia baseada nos formatos mais consumidos no YouTube.",
  "topSearches": [{ "keyword": "expressão de busca", "volume": "alta" }],
  "audienceStats": { "ageMajority": "18-34", "primaryPlatform": "Instagram", "engagementRate": "4.8%" },
  "audienceInsights": { 
     "demographics": "informações demográficas ricas", 
     "lifestyle": ["estilo 1", "estilo 2"], 
     "contentPreferences": ["preferência 1"], 
     "interests": ["interesse 1", "interesse 2"], 
     "devices": ["Mobile (85%)", "Desktop (15%)"], 
     "regions": [{"country": "Brazil", "weight": 40}, {"country": "United States", "weight": 35}, {"country": "France", "weight": 25}], 
     "whatTheyCareAbout": ["preocupação crucial real mapeada nos feeds"], 
     "buyingTriggers": ["gatilho psicológico ou financeiro real"] 
  },
  "platformRelevance": [{ "platform": "Instagram", "score": 92 }, {"platform": "TikTok", "score": 88}],
  "formatPerformance": [{ "format": "Vídeos Curtis (Reels/Shorts)", "engagement": 94 }],
  "sentimentAnalysis": { "positive": 65, "neutral": 25, "negative": 10 },
  "engagementEvolution": [
    { "date": "Jan", "value": 45 },
    { "date": "Fev", "value": 52 },
    { "date": "Mar", "value": 68 },
    { "date": "Abr", "value": 74 },
    { "date": "Mai", "value": 85 }
  ],
  "wordCloud": [{ "text": "termo especializado", "value": 90 }],
  "contentIdeas": [{ "title": "Título do Conteúdo Recomendado", "description": "Descrição baseada nas dores reais do público", "type": "Formatado" }],
  "mostRequested": [{ "request": "Dúvida exata identificada", "count": 280, "context": "Estratégia recomendada" }],
  "nicheSegment": {
    "population": 3800000,
    "marketSize": "R$ 18.2B",
    "unemploymentRate": "2.4%",
    "avgIncome": 5400,
    "education": "48%",
    "description": "Consumidores qualificados no país voltados para este segmento que mostram alto interesse de recompra."
  },
  "gdeltArticles": [
    {
      "title": "Análise profunda de tendências de negócios para o segmento nas capitais",
      "url": "https://news.google.com/search?q=sua_keyword_aqui",
      "source": "Valor Econômico",
      "date": "2026-05-18"
    }
  ]${isListerUp ? `,
  "listerupCreatorsData": {
    "risingCreators": [
      { 
        "name": "@canal_exemplo_fitness", 
        "category": "Reviews / Unboxing", 
        "growth": "+125%", 
        "style": "Formato intimista, cortes rápidos", 
        "campaignFit": "Parceria e cuponagem",
        "followers": "280K",
        "engagementRate": 5.4,
        "recommendedBudget": "R$ 4.500"
      }
    ],
    "semioticsCampaigns": {
      "aesthetic": "Foco visual recomendado de produção para ${query}",
      "colors": ["Terracota", "Areia", "Verde Musgo"],
      "colorsHex": ["#C2410C", "#F59E0B", "#15803D"],
      "emotionalTriggers": ["Acolhimento", "Maturidade", "Foco"],
      "storytellingHooks": ["Comece com 3 segundos de foley agradável", "Foque na sensação tátil do objeto"]
    },
    "creativePerspectives": "Parágrafo detalhado descrevendo as perspectivas semióticas e de campanhas com inteligência artificial.",
    "audienceInterestsOverlap": [
      { "interest": "Estilo de Vida", "percentage": 68 },
      { "interest": "Tecnologia", "percentage": 42 }
    ],
    "campaignPerformanceBenchmarks": [
      { "metricsName": "CTR", "localValue": 4.5, "marketAverage": 1.8 }
    ],
    "campaignConversionFunnel": [
      { "step": "Visualizações", "value": 100000 },
      { "step": "Cliques", "value": 8500 }
    ]
  }` : ''}
}
`;

      const aiProvider = getAIClient();
      let json = await generateHighQualityContent(aiProvider, prompt);

      const isInvalidReport = !json || json.error || !json.trendingTopics || !Array.isArray(json.trendingTopics) || json.trendingTopics.length === 0;

      if (isInvalidReport) {
        console.warn("AI Generation failed or returned incomplete schema. Swapping to highly optimized programmatic recovery model...");
        json = getAlgorithmicMarketReportFallback(query, dataCommons, isListerUp);
      } else {
        json.aiProviderFailed = false;
      }

      const cleanNumber = (val: any, fallback: number): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const cleaned = val.replace(/[^\d]/g, "");
          return cleaned ? parseInt(cleaned, 10) : fallback;
        }
        return fallback;
      };

      // Extract, validate and safely cast LLM generated demographic metrics
      const parsedNicheSegment = json.nicheSegment ? {
        population: cleanNumber(json.nicheSegment.population, Math.round(dataCommons.population * 0.015)),
        marketSize: json.nicheSegment.marketSize ? String(json.nicheSegment.marketSize) : "R$ 12.0B",
        unemploymentRate: json.nicheSegment.unemploymentRate ? String(json.nicheSegment.unemploymentRate) : "1.5%",
        avgIncome: cleanNumber(json.nicheSegment.avgIncome, 4500),
        education: json.nicheSegment.education ? String(json.nicheSegment.education) : "80%",
        description: json.nicheSegment.description ? String(json.nicheSegment.description) : "Projeção de público-alvo focada neste nicho de mercado para o Brasil."
      } : {
        population: Math.round(dataCommons.population * 0.015),
        marketSize: "R$ 12.0B",
        unemploymentRate: "1.5%",
        avgIncome: 12000,
        education: "80%",
        description: "Projeção de público-alvo focada neste nicho de mercado para o Brasil."
      };

      // Attach raw statistical sources to response with dyn niche calculations
      json.dataCommons = {
        ...dataCommons,
        nicheSegment: parsedNicheSegment
      };

      // Build 100% real, scraped/fetched articles to prevent hallucinations and 404s
      const allFetchedArticles: any[] = [];

      // 1. Add GDELT articles
      if (Array.isArray(gdelt)) {
        gdelt.forEach((g: any) => {
          if (g && g.title && g.url) {
            allFetchedArticles.push({
              title: g.title,
              url: g.url,
              source: g.sourcecountry || "GDELT Index",
              date: safeIsoDate(g.seendate)
            });
          }
        });
      }

      // 2. Add news BR (Portuguese RSS)
      if (Array.isArray(news)) {
        news.forEach((n: any) => {
          if (n && n.title && n.url) {
            allFetchedArticles.push({
              title: n.title,
              url: n.url,
              source: n.source || "Google News BR",
              date: safeIsoDate(n.date)
            });
          }
        });
      }

      // 3. Add news Global (English RSS)
      if (Array.isArray(newsGlobal)) {
        newsGlobal.forEach((n: any) => {
          if (n && n.title && n.url) {
            allFetchedArticles.push({
              title: n.title,
              url: n.url,
              source: n.source || "Google News Global",
              date: safeIsoDate(n.date)
            });
          }
        });
      }

      // De-duplicate by URL and title similarity
      const finalRealArticles: any[] = [];
      const seenUrls = new Set<string>();
      const seenTitles = new Set<string>();

      for (const article of allFetchedArticles) {
        const cleanUrl = article.url.trim().toLowerCase();
        // Skip placeholders
        if (cleanUrl.includes("placeholder") || cleanUrl.includes("link-inexistente") || !cleanUrl.startsWith("http")) {
          continue;
        }
        const cleanTitle = article.title.trim().toLowerCase().substring(0, 45);
        if (!seenUrls.has(cleanUrl) && !seenTitles.has(cleanTitle)) {
          seenUrls.add(cleanUrl);
          seenTitles.add(cleanTitle);
          finalRealArticles.push(article);
        }
      }

      // If we yielded absolutely zero search articles, inject search link as safe fallback
      if (finalRealArticles.length === 0) {
        finalRealArticles.push({
          title: `Veja análises e tendências de mercado para "${query}"`,
          url: `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`,
          source: "Google News",
          date: safeIsoDate(null)
        });
      }

      // Assign the clean real articles (cap at 5 items)
      json.gdeltArticles = finalRealArticles.slice(0, 5);

      if (yt && yt.length > 0) {
        json.influencers = yt.map(v => ({
          name: v.channelName,
          handle: v.channelHandle,
          platform: "YouTube",
          avatarUrl: v.channelAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(v.channelName),
          latestPost: {
             text: v.title,
             postUrl: v.videoUrl,
             likes: v.likes,
             comments: v.comments,
             date: safeIsoDate(v.publishedAt)
          }
        })).filter((v,i,a)=>a.findIndex(t=>(t.handle === v.handle))===i).slice(0, 5);
      }
      
      if (metaAdsData) {
        json.metaAdsData = metaAdsData;
      }
      
      res.json(json);
    } catch (error) {
      console.error('Error generating market data:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/market-influencers", async (req, res) => {
    try {
      const { query, order = "relevance", publishedAfter, country = "BR" } = req.body;
      
      const ytData = await getYouTubeData(query, order, publishedAfter, country);

      if (ytData && ytData.length > 0) {
        const topInfluencers = ytData.map(v => ({
          name: v.channelName,
          handle: v.channelHandle,
          platform: "YouTube",
          avatarUrl: v.channelAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(v.channelName),
          latestPost: {
             text: v.title,
             postUrl: v.videoUrl,
             likes: v.likes,
             comments: v.comments,
             date: safeIsoDate(v.publishedAt)
          }
        })).filter((v,i,a)=>a.findIndex(t=>(t.handle === v.handle))===i).slice(0, 5); // unique handles mostly

        return res.json({ influencers: topInfluencers });
      }

      // Fallback to AI generation for influencers if YouTube search fails
      const prompt = `Analista de mercado. Gere 5 grandes influenciadores REAIS do nicho: "${query}".
Eles devem ser de YouTube. Procure os mais conhecidos. Retorne apenas JSON com a propriedade "influencers".
Use dados plausíveis. O postUrl DEVE iniciar exatamente com "https://www.youtube.com/watch?v=" seguido por exatos 11 caracteres (um ID falso verossímil se não souber um real, ex: aBcD1eFgH2i).
Formato JSON esperado:
{
  "influencers": [
    {
      "name": "Nome", "handle": "@handle", "platform": "YouTube", "avatarUrl": "https://ui-avatars.com/api/?name=Nome",
      "latestPost": { "text": "Título do vídeo", "postUrl": "https://www.youtube.com/watch?v=11CHRandomI", "likes": 5000, "comments": 100, "date": "2023-01-01" }
    }
  ]
}`;
      const aiProvider = getAIClient();
      const aiResponse = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });
      const aiJson = cleanAndParseJSON(aiResponse.choices[0].message.content || '{"influencers": []}');
      res.json({ influencers: aiJson.influencers || [] });
    } catch (error) {
      console.error('Error in /api/market-influencers:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Insights History handled on client side via Firebase SDK

  // API Route for Trends Monitor
  app.get("/api/trends/monitor", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const prompt = `Gere um relatório abrangente de tendências diárias de mercado para HOJE (${today}).
Analise os nichos: IA & Tech, SaaS, E-commerce, Health, Education, Entertainment.
Para cada nicho, forneça:
1. Top 3 assuntos em alta.
2. Pontuação de tendência (0-100).
3. Breve previsão para amanhã.
4. Gráfico de "evolução" fictício mas baseado na realidade (6 pontos de dados).

Responda APENAS em JSON no seguinte formato:
{
  "lastUpdate": "${today}",
  "niches": [
    {
      "name": "IA & Tech",
      "trendingScore": 95,
      "topics": ["Agentes Autônomos", "Chip shortage", "Web4"],
      "prediction": "Crescimento explosivo em infraestrutura",
      "chartData": [
        { "time": "08:00", "value": 40 },
        { "time": "12:00", "value": 65 },
        { "time": "16:00", "value": 85 },
        { "time": "20:00", "value": 95 }
      ]
    }
  ],
  "globalHighlights": ["Assunto 1", "Assunto 2"]
}
`;

      const aiProvider = getAIClient();
      const completion = await generateWithFallback(aiProvider, {
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });
      const trendsData = cleanAndParseJSON(completion.choices[0].message.content || "{}");
      if (!trendsData || !trendsData.niches || !Array.isArray(trendsData.niches)) {
        throw new Error("Invalid or empty trends schema returned.");
      }

      res.json(trendsData);
    } catch (error) {
      console.warn("Error in Trends Monitor, falling back programmatically:", error);
      const todayStr = new Date().toLocaleDateString("pt-BR");
      res.json({
        lastUpdate: todayStr,
        niches: [
          {
            name: "IA & Automação",
            trendingScore: 92,
            topics: ["Agentes Autônomos", "Modelos de Voz", "Vídeo Generativo"],
            prediction: "Crescimento de integrações corporativas esta semana.",
            chartData: [
              { "time": "08:00", "value": 60 },
              { "time": "12:00", "value": 75 },
              { "time": "16:00", "value": 85 },
              { "time": "20:00", "value": 92 }
            ]
          },
          {
            name: "E-commerce & Ads",
            trendingScore: 84,
            topics: ["Creator Economy", "Vendas em Vídeo", "CPA Otimizado"],
            prediction: "Forte migração para canais táteis e narrados.",
            chartData: [
              { "time": "08:00", "value": 50 },
              { "time": "12:00", "value": 68 },
              { "time": "16:00", "value": 79 },
              { "time": "20:00", "value": 84 }
            ]
          }
        ],
        globalHighlights: ["Tráfego Pago Orgânico", "Marketing Semiológico", "Inteligência Artificial de Negócios"],
        aiProviderFailed: true
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
