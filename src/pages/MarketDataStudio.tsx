import React, { useState, useEffect, useCallback } from "react";
import { WorldMap } from "@/components/WorldMap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Users, Search as SearchIcon, LineChart, Globe, ArrowRight, Image as ImageIcon, Plus, Filter, Calendar, Youtube, Twitter, Twitch, X, Database, Instagram, Link2, DollarSign, Briefcase, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query as firestoreQuery, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { LoadingAnimation } from '@/components/LoadingAnimation';

interface MarketData {
  trendingTopics: { topic: string; growth: string }[];
  explosiveTopics: { topic: string; score: number }[];
  marketInsights: string;
  mediaInsights: string;
  topSearches: { keyword: string; volume: string }[];
  audienceStats: {
    ageMajority: string;
    primaryPlatform: string;
    engagementRate: string;
  };
  audienceInsights?: {
    demographics: string;
    lifestyle: string[];
    contentPreferences: string[];
    interests: string[];
    devices: string[];
    regions: { country: string; weight: number }[];
    whatTheyCareAbout?: string[];
    buyingTriggers?: string[];
  };
  platformRelevance: { platform: string; score: number }[];
  formatPerformance: { format: string; engagement: number }[];
  sentimentAnalysis: { positive: number; neutral: number; negative: number; };
  engagementEvolution: { date: string; value: number }[];
  wordCloud: { text: string; value: number }[];
  contentIdeas: { title: string; description: string; type: string }[];
  mostRequested: { request: string; count: number; context: string }[];
  listerupCreatorsData?: {
    risingCreators: {
      name: string;
      category: string;
      growth: string;
      style: string;
      campaignFit: string;
      followers?: string;
      engagementRate?: number;
      recommendedBudget?: string;
    }[];
    semioticsCampaigns?: {
      aesthetic: string;
      colors: string[];
      colorsHex?: string[];
      emotionalTriggers: string[];
      storytellingHooks: string[];
    };
    creativePerspectives: string;
    audienceInterestsOverlap?: { interest: string; percentage: number }[];
    campaignPerformanceBenchmarks?: { metricsName: string; localValue: number; marketAverage: number }[];
    campaignConversionFunnel?: { step: string; value: number }[];
  };
  influencers: {
    name: string;
    handle: string;
    platform: string;
    avatarUrl?: string;
    latestPost: {
      text: string;
      imageUrl?: string;
      postUrl?: string;
      likes: number;
      comments: number;
      date: string;
    };
  }[];
  dataCommons?: {
    population: number;
    gdp: number;
    unemploymentRate: string;
    avgIncome: number;
    education: string;
    source: string;
    nicheSegment?: {
      population: number;
      marketSize: string;
      unemploymentRate: string;
      avgIncome: number;
      education: string;
      description: string;
    };
  };
  gdeltArticles?: {
    title: string;
    url: string;
    source: string;
    date: string;
  }[];
}

function EmbedSocial({ url }: { url: string }) {
  let platform = "Post Original";
  let bgColor = "bg-muted";
  let hoverColor = "hover:bg-muted/80";
  let textColor = "text-foreground";
  let icon = <Link2 className="w-4 h-4" />;
  
  if (url.includes('instagram.com')) {
    platform = "Instagram";
    bgColor = "bg-gradient-to-r from-purple-500 to-pink-500";
    hoverColor = "hover:opacity-90";
    textColor = "text-white";
    icon = <Instagram className="w-4 h-4" />;
  } else if (url.includes('tiktok.com')) {
    platform = "TikTok";
    bgColor = "bg-black dark:bg-zinc-800";
    hoverColor = "hover:bg-black/80 dark:hover:bg-zinc-800/80";
    textColor = "text-white";
    icon = <X className="w-4 h-4" />;
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    platform = "YouTube";
    bgColor = "bg-red-600";
    hoverColor = "hover:bg-red-700";
    textColor = "text-white";
    icon = <Youtube className="w-4 h-4" />;

    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*[?&]v=|youtube\.com\/(?:embed\/|v\/))([^&]{11})/);
    const videoId = match ? match[1] : null;

    if (videoId) {
      return (
        <div className="w-full flex-col gap-2 flex">
          <div className="w-full aspect-video rounded-lg overflow-hidden border border-border/40 bg-black shadow-sm relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen>
            </iframe>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" 
             className={`w-full inline-flex items-center justify-center rounded-md font-bold transition-all h-10 px-6 py-2 ${bgColor} ${hoverColor} ${textColor} gap-2 shadow-sm active:scale-95`}>
            {icon} Assistir Original
          </a>
        </div>
      );
    }
  }

  return (
    <div className="w-full flex flex-col gap-3">
       {/* Preview Iframe (Tentativo) */}
       {platform !== "Post Original" && (
         <div className="w-full aspect-video rounded-lg overflow-hidden border border-border/40 bg-zinc-900/50 flex items-center justify-center relative group">
           <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-full">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
           </div>
           {/* Fallback visual state if embed fails or for better UX */}
           <div className="text-center p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Conteúdo Externo</p>
              <h4 className="text-sm font-bold text-white px-4">Este post contém dados reais extraídos de {platform}</h4>
           </div>
         </div>
       )}

       <a href={url} target="_blank" rel="noopener noreferrer" 
          className={`w-full inline-flex items-center justify-center rounded-md font-bold transition-all h-10 px-6 py-2 ${bgColor} ${hoverColor} ${textColor} gap-2 shadow-sm active:scale-95`}>
         {icon} Assistir Original
       </a>
    </div>
  );
}

interface LibraryInsight {
  id: string;
  query: string;
  insights_data: MarketData;
  created_at: string | Date;
  metadata?: Record<string, unknown>;
}

interface TrendNiche {
  name: string;
  trendingScore: number;
  topics: string[];
  prediction: string;
  chartData: { time: string; value: number }[];
}

interface TrendsData {
  lastUpdate: string;
  niches: TrendNiche[];
  globalHighlights: string[];
}

const DataSourceFooter = ({ source = "Análise Integrada de IA e Dados Web" }: { source?: string }) => (
  <div className="px-6 pb-4 border-t border-border/10 mt-4 pt-3 flex justify-end">
    <p className="text-[10px] text-muted-foreground/50 font-medium">Fonte: {source}</p>
  </div>
);

const ListerupLogo = ({ className = "h-8 w-8" }: { className?: string }) => {
  const [imgSrc, setImgSrc] = useState("/Design sem nome (23).png");
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {!hasError ? (
        <img 
          src={imgSrc} 
          alt="ListerUp" 
          className="w-full h-full object-contain" 
          onError={() => {
            if (imgSrc === "/Design sem nome (23).png") {
              setImgSrc("/listerup.png");
            } else if (imgSrc === "/listerup.png") {
              setImgSrc("/listerup-logo.png");
            } else {
              setHasError(true);
            }
          }} 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full rounded bg-teal-950 border border-teal-900/40 flex items-center justify-center">
          <span className="text-teal-200 text-[10px] font-black tracking-widest uppercase">Li</span>
        </div>
      )}
    </div>
  );
};

let hasInitializedStudio = false;

export default function MarketDataStudio() {
  const [isInitializing, setIsInitializing] = useState(!hasInitializedStudio);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketData | null>(null);
  const [dataCommonsMode, setDataCommonsMode] = useState<'segment' | 'baseline'>('segment');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [isListerupActive, setIsListerupActive] = useState(() => {
    return localStorage.getItem("listerup_creators_active") === "true";
  });
  const [isMetaAdsActive, setIsMetaAdsActive] = useState(() => {
    return localStorage.getItem("meta_ads_active") === "true";
  });
  const [metaAdsToken, setMetaAdsToken] = useState(() => {
    return localStorage.getItem("meta_ads_token") || "";
  });
  const [isMetaAdsConfirming, setIsMetaAdsConfirming] = useState(false);
  const [metaTokenInput, setMetaTokenInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(() => {
    return localStorage.getItem("listerup_uploaded_file") || null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeSourceTab, setActiveSourceTab] = useState<'connect' | 'sources'>('connect');
  const [searchSourceQuery, setSearchSourceQuery] = useState("");
  const [isListerupConfirming, setIsListerupConfirming] = useState(false);
  const [showAllInfluencers, setShowAllInfluencers] = useState(false);
  const [infOrder, setInfOrder] = useState('relevance');
  const [infDate, setInfDate] = useState('any');
  const [infCountry, setInfCountry] = useState('BR');
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  
  // Library State
  const [libraryHistory, setLibraryHistory] = useState<LibraryInsight[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Trends State
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  
  const [isAudiencePanelOpen, setIsAudiencePanelOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!hasInitializedStudio) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
        hasInitializedStudio = true;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchLibraryHistory = async () => {
    setLoadingHistory(true);
    try {
      const q = firestoreQuery(
        collection(db, "insights_history"), 
        orderBy("created_at", "desc"), 
        limit(20)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          created_at: docData.created_at instanceof Timestamp ? docData.created_at.toDate().toISOString() : docData.created_at
        };
      }) as LibraryInsight[];
      setLibraryHistory(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchTrendsMonitor = async () => {
    if (trendsData) return;
    setLoadingTrends(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `trends_${today}`;
      
      try {
        const cacheDoc = await getDoc(doc(db, "ai_analysis_cache", cacheKey));
        if (cacheDoc.exists()) {
          setTrendsData(cacheDoc.data()?.data);
          setLoadingTrends(false);
          return;
        }
      } catch (e) {
        console.warn("Could not read cache, will fetch fresh:", e);
      }

      const res = await fetch("/api/trends/monitor");
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await res.json();
        setTrendsData(result);
        
        try {
          await setDoc(doc(db, "ai_analysis_cache", cacheKey), {
            account_id: "system",
            analysis_type: "trends_monitor",
            cache_key: cacheKey,
            data: result,
            created_at: serverTimestamp(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        } catch (e) {
          console.warn("Could not save to cache (maybe not admin, which is fine):", e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  };

  const saveToLibrary = async (q: string, resData: MarketData) => {
    try {
      console.log("Attempting to save to library:", { query: q, dataExists: !!resData });
      const docRef = await addDoc(collection(db, "insights_history"), {
        account_id: user?.id || "anonymous",
        query: q,
        insights_data: resData,
        metadata: {},
        created_at: serverTimestamp()
      });
      console.log("Document successfully written with ID: ", docRef.id);
      
      // Refresh history if we are in library tab or just background
      fetchLibraryHistory();
      toast({
        title: "Sucesso",
        description: "Insight salvo na biblioteca automaticamente.",
      });
    } catch (e) {
      console.error("Save to library failed:", e);
      toast({
        title: "Erro ao salvar na biblioteca",
        description: e instanceof Error ? e.message : "Erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  const loadFromLibrary = (insight: LibraryInsight) => {
    setQuery(insight.query);
    setData(insight.insights_data);
    toast({
      title: "Insight Carregado",
      description: `Restaurando relatório para: ${insight.query}`,
    });
    // Find the studio tab trigger and click it or just use state if I had a state for the main tabs
    // Since researchers use Tabs from shadcn, I might need to manage activeTab for the main tabs too.
    // I'll add a state for the main tabs.
  };

  const [activeMainTab, setActiveMainTab] = useState("studio");

  const handleVerTodos = () => {
    setShowAllInfluencers(true);
  };

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/market-suggestions?q=${encodeURIComponent(q)}`);
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const { suggestions: APIOpts } = await res.json();
        if (APIOpts) setSuggestions(APIOpts);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    if (activeMainTab === "library") fetchLibraryHistory();
    if (activeMainTab === "trends") fetchTrendsMonitor();
  }, [activeMainTab]);

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = directQuery || query;
    if (!activeQuery.trim()) return;

    setShowSuggestions(false);
    setQuery(activeQuery);
    setLoading(true);
    try {
      const response = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: activeQuery, 
          listerupCreators: isListerupActive,
          metaAdsActive: isMetaAdsActive,
          metaAdsToken: metaAdsToken
        }),
      });
      let result: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const textFallback = await response.text();
        throw new Error("O servidor demorou muito para responder ou retornou um formato inválido.");
      }
      
      if (!response.ok || result.error) {
        throw new Error(result.error || "Erro ao buscar dados");
      }
      
      setData(result);
      // Auto-save to library
      saveToLibrary(activeQuery, result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      let title = "Erro na extração de dados";
      let desc = "#15463 Erro ao gerar o relatorio de insights. Tente novamente mais tarde";
      
      if (errMsg.toLowerCase().includes("falha") || errMsg.toLowerCase().includes("format")) {
        desc = "#15562 Erro ao carregar a fonte de dados. Os dados carregados podem nao atender aos formatos ou tivemos um erro ao usar uma integracao. Pedimos desculpas pelo transtorno.";
      } else if (errMsg.toLowerCase().includes("network") || errMsg.toLowerCase().includes("fetch")) {
        desc = "Sua conexao esta lenta ou conexao com a internet foi perdida. Tente novamente e se persistir, tente usar outra rede";
      }

      toast({
        title,
        description: desc,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInfluencers = async (orderArg = infOrder, dateArg = infDate, countryArg = infCountry) => {
    if (!query.trim()) return;
    
    setLoadingInfluencers(true);
    try {
      let publishedAfter;
      if (dateArg !== 'any') {
        const d = new Date();
        if (dateArg === 'month') d.setMonth(d.getMonth() - 1);
        if (dateArg === 'year') d.setFullYear(d.getFullYear() - 1);
        publishedAfter = d.toISOString();
      }

      const response = await fetch("/api/market-influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           query, 
           order: orderArg, 
           publishedAfter,
           country: countryArg
        }),
      });
      let result: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const textFallback = await response.text();
        throw new Error("Falha na formatação da resposta.");
      }
      
      if (!response.ok || result.error) {
        throw new Error(result.error || "Erro as buscar influenciadores");
      }
      
      if (result.influencers && data) {
         setData({
           ...data,
           influencers: result.influencers
         });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      let desc = "#15463 Erro ao gerar o relatorio de insights. Tente novamente mais tarde";
      if (errMsg.toLowerCase().includes("network") || errMsg.toLowerCase().includes("fetch")) {
        desc = "Sua conexao esta lenta ou conexao com a internet foi perdida. Tente novamente e se persistir, tente usar outra rede";
      } else if (errMsg.toLowerCase().includes("format") || errMsg.toLowerCase().includes("falha")) {
        desc = "#15562 Erro ao carregar a fonte de dados. Os dados carregados podem nao atender aos formatos ou tivemos um erro ao usar uma integracao. Pedimos desculpas pelo transtorno.";
      }
      toast({
        title: "Erro ao atualizar influenciadores",
        description: desc,
        variant: "destructive",
      });
    } finally {
      setLoadingInfluencers(false);
    }
  };

  const getFontSize = (value: number, min: number, max: number) => {
    const minFont = 14;
    const maxFont = 36;
    if (max === min) return minFont;
    return minFont + ((value - min) / (max - min)) * (maxFont - minFont);
  };

  const handleConnectSource = (platform: string) => {
    if (connectedSources.includes(platform)) {
      setConnectedSources(prev => prev.filter(p => p !== platform));
      toast({
        title: "Fonte Desconectada",
        description: `A sincronização com ${platform} foi interrompida.`,
      });
    } else {
      setConnectedSources(prev => [...prev, platform]);
      toast({
        title: "Fonte Conectada com Sucesso",
        description: `Agora extraindo dados em tempo real de ${platform}.`,
      });
    }
  };

  if (isInitializing) {
    return (
      <div className="w-full flex-col min-h-[80vh] flex items-center justify-center p-6 text-center">
        <LoadingAnimation title="Market Data Studio" subtitle="Configurando ambiente de pesquisa..." />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Search Bar Refined */}
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="18" width="10" height="22" rx="5" fill="url(#paint0_linear)" />
            <rect x="15" y="4" width="10" height="36" rx="5" fill="#1e1b4b" />
            <rect x="28" y="10" width="10" height="30" rx="5" fill="url(#paint1_linear)" />
            <defs>
              <linearGradient id="paint0_linear" x1="7" y1="18" x2="7" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="33" y1="10" x2="33" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Market Data Studio</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Extração de dados e insights de mercado</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="gap-2 h-9 text-sm bg-primary text-primary-foreground border-primary hover:bg-primary/90"
          onClick={() => {
            setIsConnecting(true);
            setIsListerupConfirming(false);
          }}
        >
          Conectar Fonte de Dados
        </Button>
      </div>
         {/* Bottom Connection Panel (Covers 1/3 of the interface, without affecting sidebar) */}
      <AnimatePresence>
        {isConnecting && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnecting(false)}
              className="fixed inset-0 bg-background/50 backdrop-blur-xs z-40"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="fixed bottom-0 right-0 left-0 md:left-64 h-[65vh] min-h-[500px] bg-card border-t border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Adicionar nova fonte de dados ao relatório de Insights</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Faça upload da sua fonte de dados local ou selecione uma integração para aprimorar os dados de pesquisa</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => setIsConnecting(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Subheader: Tabs & Search (Adicionar dados ao relatório style) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-6 py-2.5 border-b border-border/50 bg-muted/5 gap-3 shrink-0">
                {/* Tabs */}
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSourceTab('connect');
                    }}
                    className={`pb-1.5 text-xs font-bold transition-all relative ${
                      activeSourceTab === 'connect' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Conectar aos dados
                    {activeSourceTab === 'connect' && (
                      <motion.div layoutId="activeSourceTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSourceTab('sources');
                    }}
                    className={`pb-1.5 text-xs font-bold transition-all relative ${
                      activeSourceTab === 'sources' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Minhas fontes de dados
                    {activeSourceTab === 'sources' && (
                      <motion.div layoutId="activeSourceTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                </div>

                {/* Pesquisa */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Pesquisa"
                    value={searchSourceQuery}
                    onChange={(e) => setSearchSourceQuery(e.target.value)}
                    className="w-full text-[11px] bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-muted-foreground/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Scrollable Connector Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeSourceTab === 'connect' ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold text-muted-foreground/80 tracking-wider uppercase flex items-center justify-between">
                      <span>Conector do Data Studio (1 disponível)</span>
                      {searchSourceQuery && <span className="text-blue-500 lowercase normal-case">Filtrando por "{searchSourceQuery}"</span>}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Card 1: ListerUp for Creators */}
                      {("ListerUp for Creators".toLowerCase().includes(searchSourceQuery.toLowerCase())) && (
                        <div 
                          onClick={() => {
                            if (!isListerupActive && !isListerupConfirming) {
                              setIsListerupConfirming(true);
                            }
                          }}
                          className={`p-4 border rounded-xl bg-card shadow-xs relative flex flex-col justify-between transition-all duration-300 min-h-[125px] ${
                            isListerupActive 
                              ? 'border-emerald-500/30 bg-emerald-500/[0.01]' 
                              : isListerupConfirming 
                                ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-500/[0.01]' 
                                : 'border-border/80 hover:border-blue-500/40 hover:bg-muted/10 cursor-pointer'
                          }`}
                        >
                          {!isListerupConfirming ? (
                            <>
                              <div className="flex gap-4 items-center">
                                {/* ListerUp Logo Icon Left */}
                                <img 
                                  src="/Design sem nome (23).png" 
                                  alt="ListerUp" 
                                  className="h-10 w-auto max-w-[125px] object-contain shrink-0 bg-transparent" 
                                />
                                
                                {/* Meta Right */}
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-xs text-foreground truncate">ListerUp for Creators</h4>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground block -mt-0.5">Por ListerUp</span>
                                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                    Adiciona painéis detalhados de semiótica estética, roteiros de campanha, creators em ascensão e gráficos adicionais.
                                  </p>
                                </div>
                              </div>

                              {isListerupActive && (
                                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsListerupActive(false);
                                      localStorage.removeItem("listerup_creators_active");
                                      toast({
                                        title: "ListerUp Desativado",
                                        description: "Módulo avançado de creators desligado.",
                                      });
                                    }}
                                    className="h-6 px-2 text-[10px] text-red-500 hover:text-red-900 hover:bg-red-500/10"
                                  >
                                    Remover Conexão
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            /* Confirm state layout */
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">
                                  Deseja conectar Listerup ao seu relatorio?
                                </span>
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                  Ative o mapeamento inteligente de creators, análises semióticas e gráficos de crescimento integrados ao Market Data.
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mt-3">
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsListerupActive(true);
                                    setIsListerupConfirming(false);
                                    localStorage.setItem("listerup_creators_active", "true");
                                    toast({
                                      title: "ListerUp Conectado",
                                      description: "Autorização de extensão de dados concluída!",
                                    });
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] py-1 h-7 px-3.5 rounded-lg font-bold shadow-xs flex-1 transition-colors"
                                >
                                  Autorizar e conectar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsListerupConfirming(false);
                                  }}
                                  className="h-7 text-[10px] py-1 px-2 text-muted-foreground hover:bg-muted/10"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* activeSourceTab === 'sources' */
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold text-muted-foreground/80 tracking-wider uppercase">
                      Arquivos e Planilhas Carregados
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-5 border rounded-xl bg-card shadow-xs relative flex flex-col justify-between min-h-[140px] ${
                        uploadedFile ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : 'border-border/80 hover:border-blue-500/30'
                      }`}>
                        <div className="flex gap-4 items-start">
                          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                              <path d="M12 18v-6" />
                              <path d="m9 15 3-3 3 3" />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-semibold text-xs text-foreground truncate">Upload de Fonte Local</h4>
                            
                            {isUploading ? (
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-medium animate-pulse text-amber-500">Fazendo upload do arquivo...</span>
                                  <span className="font-mono text-muted-foreground">{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              </div>
                            ) : uploadedFile ? (
                              <div className="mt-3 text-[11px] text-muted-foreground font-medium bg-muted/30 p-2 rounded-lg border border-border/50">
                                <span className="block text-[10px] text-emerald-600 font-bold mb-0.5">Sincronizado:</span>
                                <strong className="font-bold truncate max-w-full block text-foreground/90">{uploadedFile}</strong>
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                Formatos suportados: CSV, XLSX, PDF, TXT, DOCX ou imagens de relatórios.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end">
                          {uploadedFile ? (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-3 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.removeItem("listerup_uploaded_file");
                                setUploadedFile(null);
                                toast({
                                  title: "Dataset Desconectado",
                                  description: "A fonte local de dados foi removida do relatório.",
                                });
                              }}
                            >
                              Descarta Arquivo
                            </Button>
                          ) : (
                            <label className="cursor-pointer">
                              <span className="h-7 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 font-bold text-[10px] text-white transition-colors flex items-center justify-center">
                                Selecionar arquivo
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".csv,.xlsx,.xls,.pdf,.txt,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setIsUploading(true);
                                    setUploadProgress(0);
                                    const interval = setInterval(() => {
                                      setUploadProgress((prev) => {
                                        if (prev >= 100) {
                                          clearInterval(interval);
                                          setTimeout(() => {
                                            setIsUploading(false);
                                            setUploadedFile(file.name);
                                            localStorage.setItem("listerup_uploaded_file", file.name);
                                            toast({
                                              title: "Arquivo Carregado",
                                              description: `Arquivo de mercado "${file.name}" importado no relátorio.`,
                                            });
                                          }, 400);
                                          return 100;
                                        }
                                        return prev + 25;
                                      });
                                    }, 120);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex w-full overflow-x-auto pb-4">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="mb-6 h-12 bg-background border border-border px-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="studio" className="flex-1 max-w-[200px] h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Studio</TabsTrigger>
            <TabsTrigger value="library" className="flex-1 max-w-[200px] h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Biblioteca de Insights</TabsTrigger>
            <TabsTrigger value="trends" className="flex-1 max-w-[200px] h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Trends Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="studio" className="space-y-6 mt-0">
            {/* Busca e Filtros - Estilo Clean */}
            <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Input de Busca */}
          <div className="relative flex-1 min-w-[280px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquise por nichos, mercados, temas ou marcas..." 
              className="w-full pl-9 h-10 bg-background border-border"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!showSuggestions) setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') handleSearch();
              }}
            />
            
            {/* Sugestões Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card rounded-md border border-border shadow-lg z-50 overflow-hidden">
                {suggestions.map((sug, idx) => (
                  <div 
                    key={idx} 
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSearch(undefined, sug)}
                  >
                    <span className="text-sm font-medium">{sug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={(e) => handleSearch(e)} disabled={loading || !query.trim()} className="h-10 px-6 font-medium">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extraindo
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Extrair
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-lg font-semibold">Dashboard Vazio</h3>
            <p className="text-sm text-muted-foreground">Faça uma busca acima ou conecte uma fonte de dados para extrair insights do mercado.</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
         <div className="py-32 flex flex-col items-center justify-center">
            <LoadingAnimation 
              title="Analisando Inteligência de Mercado" 
              subtitle="Extraindo dados e métricas em tempo real..." 
            />
         </div>
      )}

      {/* Bento Grid Dashboard */}
      {data && !loading && (
        <div className="flex flex-col w-full gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {data.aiProviderFailed && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center gap-3 text-xs md:text-sm">
              <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-bold block">Modo de Contingência Ativo:</span>
                Os provedores de IA integrados estão indisponíveis ou saturados no momento. Ativamos o modelo preditivo e estruturado local do servidor para analisar "{query}" com base em estimativas qualificadas para evitar interrupções de serviço.
              </div>
            </div>
          )}

          <div className="relative flex w-full gap-6 items-start">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-w-0 transition-all duration-300">
          
          {/* Main Insights (Span 8) */}
          <Card className="col-span-1 md:col-span-8 bg-card shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Inteligência de Mercado
              </CardTitle>
              <CardDescription>Resumo extraído pela IA para o nicho pesquisado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-foreground opacity-90 font-medium">
                {data.marketInsights}
              </p>
            </CardContent>
            <DataSourceFooter source="IA Market Analyzer" />
          </Card>

          {/* Audience Stats (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                Público Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Idade Foco</p>
                  <p className="font-semibold text-lg">{data.audienceStats?.ageMajority}</p>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plataforma</p>
                  <p className="font-semibold text-lg">{data.audienceStats?.primaryPlatform}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl border border-border/45 text-center flex items-center justify-between mb-4">
                 <p className="font-semibold text-muted-foreground text-sm">Engajamento Médio</p>
                 <span className="text-xl font-bold text-primary">{data.audienceStats?.engagementRate}</span>
              </div>
              <Button 
                variant="default" 
                className="w-full gap-2"
                onClick={() => setIsAudiencePanelOpen(!isAudiencePanelOpen)}
              >
                <Users className="w-4 h-4" />
                {isAudiencePanelOpen ? "Ocultar Audience Insights" : "Ver Audience Insights"}
              </Button>
            </CardContent>
            <DataSourceFooter source="Múltiplas Plataformas & IA" />
          </Card>

          {/* Radial Chart - Format Relevance (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-0">
               <CardTitle className="text-lg">
                 Relevância por Plataforma
               </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.platformRelevance}>
                     <PolarGrid stroke="currentColor" className="opacity-20 text-muted-foreground" />
                     <PolarAngleAxis dataKey="platform" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground font-medium" />
                     <Radar name="Relevância" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                     <Tooltip />
                  </RadarChart>
               </ResponsiveContainer>
            </CardContent>
            <DataSourceFooter source="Social Media APIs" />
          </Card>

          {/* Word Cloud (Span 8) */}
          <Card className="col-span-1 md:col-span-8 bg-card shadow-sm border-border">
             <CardHeader className="pb-0 border-b border-transparent">
                 <CardTitle className="flex items-center gap-2 text-lg">
                    Palavras Chave em Alta
                 </CardTitle>
             </CardHeader>
             <CardContent className="h-64 flex flex-wrap items-center justify-center p-6 gap-3 content-center text-center">
                 {data.wordCloud && (() => {
                     const vals = data.wordCloud.map(w => w.value);
                     const min = Math.min(...vals);
                     const max = Math.max(...vals);
                     return data.wordCloud.map((w, i) => (
                         <span 
                            key={i} 
                            style={{ 
                               fontSize: `${getFontSize(w.value, min, max)}px`,
                               opacity: 0.5 + (w.value / max) * 0.5,
                               fontWeight: w.value > (max+min)/2 ? 700 : 500,
                            }}
                            className="inline-block transition-transform hover:scale-110 cursor-default text-primary"
                          >
                           {w.text}
                         </span>
                     ));
                 })()}
             </CardContent>
             <DataSourceFooter source="Processamento de Linguagem Natural (IA)" />
          </Card>

          {/* Trending Topics (Span 4) */}
          <Card className="col-span-1 md:col-span-4 shadow-sm border-border">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">
                Tópicos Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {data.trendingTopics?.length > 0 ? data.trendingTopics.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <span className="font-medium text-sm">{item.topic}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {item.growth}
                    </span>
                  </div>
                )) : (
                  <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>IA expandindo análise para este tópico.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <DataSourceFooter source="Google Trends & IA" />
          </Card>

          {/* Explosive Potential (Span 4) */}
          <Card className="col-span-1 md:col-span-4 shadow-sm border-border relative overflow-hidden group">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">
                Radar: Potencial Explosivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {data.explosiveTopics?.length > 0 ? data.explosiveTopics.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <span className="font-medium text-sm truncate pr-2">{item.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{item.score}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>IA expandindo análise para este tópico.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <DataSourceFooter source="Predição AI e Monitoramento" />
          </Card>

          {/* Top Searches / Micro-Trends (Span 4) */}
          <Card className="col-span-1 md:col-span-4 shadow-sm border-border">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">
                Buscas e Micro-Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {data.topSearches?.length > 0 ? data.topSearches.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <span className="font-medium text-sm">{item.keyword}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded w-[60px] text-center
                        ${item.volume.toLowerCase().includes('alta') ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                    `}>
                      {item.volume}
                    </span>
                  </div>
                )) : (
                  <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>IA expandindo buscas sugeridas para este tópico.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <DataSourceFooter source="Volume de Buscas Web" />
          </Card>
          
          {/* Format Performance (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-0">
               <CardTitle className="text-lg">
                 Engajamento por Formato
               </CardTitle>
            </CardHeader>
            <CardContent className="h-64 mt-4">
               {data.formatPerformance && (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.formatPerformance} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="format" type="category" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" width={80} />
                       <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.2}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                       <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </CardContent>
            <DataSourceFooter source="Métricas de Engajamento" />
          </Card>

          {/* Sentiment Analysis (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-0">
               <CardTitle className="text-lg">
                 Análise de Sentimento
               </CardTitle>
            </CardHeader>
            <CardContent className="h-64 mt-4 flex flex-col justify-center gap-4">
               {data.sentimentAnalysis && (() => {
                 const sentimentData = [
                   { name: 'Positivo', value: data.sentimentAnalysis.positive, color: 'bg-primary' },
                   { name: 'Neutro', value: data.sentimentAnalysis.neutral, color: 'bg-slate-400' },
                   { name: 'Negativo', value: data.sentimentAnalysis.negative, color: 'bg-red-500' }
                 ];
                 return (
                   <div className="w-full space-y-4">
                     {sentimentData.map((item, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden border border-border/40">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${item.value}%` }}
                               transition={{ duration: 1, delay: index * 0.1 }}
                               className={`h-full rounded-full ${item.color}`}
                             />
                          </div>
                        </div>
                     ))}
                   </div>
                 );
               })()}
            </CardContent>
            <DataSourceFooter source="Análise de Sentimento de Comentários" />
          </Card>

          {/* Engagement Evolution (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-0">
               <CardTitle className="text-lg">
                 Evolução do Engajamento
               </CardTitle>
            </CardHeader>
            <CardContent className="h-64 mt-4">
               {data.engagementEvolution && (() => {
                 const engagementData = (() => {
                   if (!data.engagementEvolution || data.engagementEvolution.length === 0) return [];
                   if (data.engagementEvolution.length === 1) {
                     const single = data.engagementEvolution[0];
                     const val = single.value || 70;
                     return [
                       { date: "Jan", value: Math.round(val * 0.7) },
                       { date: "Fev", value: Math.round(val * 0.8) },
                       { date: "Mar", value: Math.round(val * 0.85) },
                       { date: "Abr", value: Math.round(val * 0.95) },
                       { date: single.date || "Mai", value: val }
                     ];
                   }
                   return data.engagementEvolution;
                 })();
                 return (
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                         <YAxis axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                         <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                         <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                      </AreaChart>
                   </ResponsiveContainer>
                 );
               })()}
            </CardContent>
            <DataSourceFooter source="Histórico Analítico" />
          </Card>

          {/* Content Ideas (Span 8) */}
          <Card className="col-span-1 md:col-span-8 bg-card shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Ideias de Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.contentIdeas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.contentIdeas.map((idea, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start">
                         <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                           {idea.type}
                         </span>
                      </div>
                      <h4 className="font-semibold">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                         {idea.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <DataSourceFooter source="Gerador de Conteúdo IA" />
          </Card>

          {/* Most Requested (Span 4) */}
          <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex-wrap">
                O que + pedem nos Comentários
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/40">
                  {data.mostRequested && data.mostRequested.map((req, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                       <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">"{req.request}"</span>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{req.count} refs</span>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                         {req.context}
                       </p>
                    </div>
                  ))}
               </div>
            </CardContent>
            <DataSourceFooter source="Busca de Palavras-Chave" />
          </Card>

          {/* Dataset Integrado: Fontes de Validação Científica (Data Commons & GDELT) (Span 12) */}
          <Card className="col-span-1 md:col-span-12 bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                   <CardTitle className="text-lg flex items-center gap-2">
                     Dados demográficos oficiais e Mídia Global
                   </CardTitle>
                   <CardDescription className="text-xs">
                     Data Commons e GDELT
                   </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Data Commons Stats */}
               <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2">
                    <h3 className="font-semibold text-sm text-foreground">Sinais Econômicos & Sociais</h3>
                    <div className="flex bg-muted p-0.5 rounded-lg border border-border/45 text-[10px] self-start sm:self-auto shrink-0 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setDataCommonsMode('segment')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          dataCommonsMode === 'segment' 
                            ? 'bg-card text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Público do Nicho (Estimado)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataCommonsMode('baseline')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          dataCommonsMode === 'baseline' 
                            ? 'bg-card text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Referência Nacional (Brasil)
                      </button>
                    </div>
                  </div>

                  {data.dataCommons ? (
                    (() => {
                      const isSegment = dataCommonsMode === 'segment' && data.dataCommons.nicheSegment;
                      const stats = isSegment ? {
                        population: data.dataCommons.nicheSegment!.population.toLocaleString('pt-BR'),
                        populationLabel: "Público Foco Estimado",
                        populationSub: "Grupo qualificado no Brasil p/ este nicho",
                        gdp: data.dataCommons.nicheSegment!.marketSize,
                        gdpLabel: "Tamanho de Mercado (TAM Estimado)",
                        gdpSub: "Gasto anual total projetado neste nicho",
                        unemployment: data.dataCommons.nicheSegment!.unemploymentRate,
                        unemploymentLabel: "Taxa Desocupação no Foco",
                        unemploymentSub: "Desocupação estimada no perfil de interesse",
                        income: `R$ ${data.dataCommons.nicheSegment!.avgIncome.toLocaleString('pt-BR')}`,
                        incomeLabel: "Rendimento Médio Foco",
                        incomeSub: "Renda média mensal do consumidor alvo",
                        education: data.dataCommons.nicheSegment!.education,
                        educationSub: "Percentual estimado com diploma superior",
                        desc: data.dataCommons.nicheSegment!.description,
                        source: `${data.dataCommons.source} + Modelagem de Nicho MDS`
                      } : {
                        population: data.dataCommons.population.toLocaleString('pt-BR'),
                        populationLabel: "População Estimada Geral",
                        populationSub: "Brasil (IBGE / Censo Recente)",
                        gdp: `R$ ${(data.dataCommons.gdp / 1e12).toFixed(2)}T`,
                        gdpLabel: "PIB Nominal Nacional",
                        gdpSub: "Valores macroeconômicos do país",
                        unemployment: data.dataCommons.unemploymentRate,
                        unemploymentLabel: "Taxa de Desemprego Geral",
                        unemploymentSub: "Desocupação ativa brasileira",
                        income: `R$ ${data.dataCommons.avgIncome.toLocaleString('pt-BR')}`,
                        incomeLabel: "Rendimento Médio Geral BR",
                        incomeSub: "Renda média mensal nacional do trabalho",
                        education: data.dataCommons.education,
                        educationSub: "Escolaridade oficial (ensino superior)",
                        desc: "",
                        source: data.dataCommons.source
                      };

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/40 rounded-lg border border-border/45 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>{stats.populationLabel}</span>
                              </div>
                              <p className="text-base font-bold text-foreground">
                                {stats.population}
                              </p>
                              <span className="text-[10px] text-muted-foreground block leading-normal">{stats.populationSub}</span>
                            </div>

                            <div className="p-3 bg-muted/40 rounded-lg border border-border/45 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>{stats.gdpLabel}</span>
                              </div>
                              <p className="text-base font-bold text-foreground">
                                {stats.gdp}
                              </p>
                              <span className="text-[10px] text-muted-foreground block leading-normal">{stats.gdpSub}</span>
                            </div>

                            <div className="p-3 bg-muted/40 rounded-lg border border-border/45 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>{stats.unemploymentLabel}</span>
                              </div>
                              <p className="text-base font-bold text-foreground">
                                {stats.unemployment}
                              </p>
                              <span className="text-[10px] text-muted-foreground block leading-normal">{stats.unemploymentSub}</span>
                            </div>

                            <div className="p-3 bg-muted/40 rounded-lg border border-border/45 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>{stats.incomeLabel}</span>
                              </div>
                              <p className="text-base font-bold text-foreground">
                                {stats.income}
                              </p>
                              <span className="text-[10px] text-muted-foreground block leading-normal">{stats.incomeSub}</span>
                            </div>

                            <div className="p-3 bg-muted/40 rounded-lg border border-border/45 col-span-1 sm:col-span-2 space-y-1 pb-2">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>Instrução de Educação Superior</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-semibold text-foreground mt-1">
                                <span>Ensino Superior Completo:</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{stats.education}</span>
                              </div>
                              <div className="w-full bg-muted-foreground/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full transition-all duration-500" 
                                  style={{ width: stats.education.includes('%') ? stats.education : '21%' }} 
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground block mt-1">{stats.educationSub}</span>
                            </div>
                          </div>


                          <div className="text-[9px] text-muted-foreground/80 font-mono text-right pb-1 border-t border-border/10 pt-2 mt-2">
                            Fonte: {stats.source}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                      Nenhum sinal demográfico capturado do Data Commons.
                    </div>
                  )}
               </div>

               {/* GDELT API Web Media Tracker */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">Atenção no Diário Global & Notícias (GDELT Index)</h3>
                  </div>

                  {data.gdeltArticles && data.gdeltArticles.length > 0 ? (
                    <div className="space-y-2">
                      {data.gdeltArticles.map((art, idx) => (
                        <a 
                          key={idx} 
                          href={art.url || "#"} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/10 border border-border/30 hover:bg-muted/40 transition-colors text-xs text-muted-foreground cursor-pointer group"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase font-mono">
                              {art.source}
                            </span>
                            <p className="font-medium text-foreground leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 transition-colors">
                              {art.title}
                            </p>
                            <span className="text-[9px] text-muted-foreground/85">{art.date}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                      Nenhum sinal de web-media global capturado do GDELT para esta pesquisa.
                    </div>
                  )}
               </div>

            </CardContent>
            <DataSourceFooter source={data.dataCommons?.source || "Data Commons API + GDELT Global Monitoring v2"} />
          </Card>

          {/* Media Insights (Span 12) */}
          <Card className="col-span-1 md:col-span-12 bg-card shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg">
                    Insight Estratégico de Mídia
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <p className="text-sm font-medium text-muted-foreground leading-relaxed">{data.mediaInsights}</p>
            </CardContent>
            <DataSourceFooter source="Sintese Estratégica AI" />
          </Card>

          {/* ListerUp for Creators Extension (Span 12) */}
          {isListerupActive && (
            <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-dashed border-primary/25 mt-4">
              <div className="col-span-1 md:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-primary/20 bg-primary/[0.03] p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <ListerupLogo className="h-6 w-6 mr-1" />
                    ListerUp for Creators — Painel Avançado de Campanhas & Semiótica
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Análise criativa e mapeamento de influenciadores em ascensão com foco semiótico gerado por Groq Cloud AI.
                  </p>
                </div>
                {uploadedFile && (
                  <span className="self-start md:self-auto bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-xs flex items-center gap-1.5 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Dataset Conectado: <strong>{uploadedFile}</strong>
                  </span>
                )}
              </div>

              {/* Card 1: Creators em Ascensão (Rising Creators) (Span 7) */}
              <Card className="col-span-1 md:col-span-7 bg-card shadow-sm border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardHeader className="pb-3 bg-muted/10">
                  <div className="flex justify-between items-start">
                     <div>
                        <CardTitle className="text-sm flex items-center gap-1.5 text-foreground font-semibold">
                           Creators em Ascensão (Rising)
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                           Novos influenciadores com aceleração rápida de engajamento no nicho de "{query}"
                        </CardDescription>
                     </div>
                     <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono font-bold leading-none">
                        Top 3 Encontrados
                     </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 divide-y divide-border/50">
                  {((data.listerupCreatorsData?.risingCreators) || [
                    { name: `@${query.toLowerCase().replace(/[^a-z0-9]/g, '') || "nicho"}_reviews`, category: "Análises & Reviews", growth: "+145%", style: "Estilo estético minimalista com cortes rápidos, unboxings táteis e roteiro em primeira pessoa (vlog).", campaignFit: "Ideal para patrocínios de produtos físicos premium e cupons de ativação rápida." },
                    { name: `@canal_${query.toLowerCase().replace(/[^a-z0-9]/g, '') || "nicho"}_criativo`, category: "Tutoriais & Lifestyle", growth: "+112%", style: "Tutoriais dinâmicos de 45s, close-ups detalhados de texturas e paletas de cores frias.", campaignFit: "Foco total em ganchos de vídeo orgânicos e reviews empáticas no Reels/Shorts." },
                    { name: `@cyber_${query.toLowerCase().replace(/[^a-z0-9]/g, '') || "nicho"}_lab`, category: "Educacional / Didático", growth: "+98%", style: "Explicações técnicas didáticas com tela dividida, animações vetorizadas leves e iluminação indireta.", campaignFit: "Perfeito para infoprodutos, cupons de desconto e assinaturas de plataformas SaaS." }
                  ]).map((creator, i) => (
                    <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">{creator.name}</span>
                          <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">
                            {creator.category}
                          </span>
                        </div>
                        {/* Interactive dynamic indicators for follower stats, engagement and budget */}
                        <div className="flex flex-wrap gap-1.5 py-0.5">
                          {creator.followers && (
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.2 rounded-sm">
                              📬 {creator.followers} segs
                            </span>
                          )}
                          {creator.engagementRate && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.2 rounded-sm">
                              ⚡ {creator.engagementRate}% engaj.
                            </span>
                          )}
                          {creator.recommendedBudget && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.2 rounded-sm">
                              💎 {creator.recommendedBudget}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          <strong className="text-foreground/80 font-medium font-bold">Estilo:</strong> {creator.style}
                        </p>
                        <p className="text-[11px] text-primary leading-relaxed">
                          <strong className="font-medium font-bold text-amber-600 dark:text-amber-400">Fit de Campanha:</strong> {creator.campaignFit}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md leading-none">
                          {creator.growth} MoM
                        </span>
                        <div className="h-6 w-16 hidden sm:block">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={[
                             { v: 10 + i * 5 },
                             { v: 25 + i * 12 },
                             { v: 45 + i * 8 },
                             { v: 80 + i * 15 }
                           ]}>
                             <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                           </AreaChart>
                         </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <DataSourceFooter source="Mapeamento de Criadores via ListerUp" />
              </Card>

              {/* Card 2: Semiótica & Estética (Span 5) */}
              <Card className="col-span-1 md:col-span-5 bg-card shadow-sm border-primary/20 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                <CardHeader className="pb-3 bg-muted/10">
                   <CardTitle className="text-sm flex items-center gap-1.5 text-foreground font-semibold">
                      Semiótica & Estética de Campanha
                   </CardTitle>
                   <CardDescription className="text-[11px]">
                      Ativos psicológicos, cores e abordagens estéticas do nicho
                   </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-1">
                   {/* Aesthetic details */}
                   <div className="space-y-1">
                     <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest block">Estética de Imagem</span>
                     <p className="text-[11px] text-foreground font-semibold leading-relaxed">
                       {data.listerupCreatorsData?.semioticsCampaigns?.aesthetic || `Design conceitual com iluminação lateral natural, closes macro táteis focado na textura orgânica das matérias-primas de "${query}".`}
                     </p>
                   </div>

                   {/* Recommended Color Palette circles */}
                   <div className="space-y-2 pt-1">
                     <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest block">Paleta de Cores Recomendada</span>
                     <div className="flex items-center gap-3">
                       {(data.listerupCreatorsData?.semioticsCampaigns?.colors || ["Off-White", "Carvão Clínico", "Oliva Deep"]).map((color, idx) => {
                         const dummyHex = data.listerupCreatorsData?.semioticsCampaigns?.colorsHex?.[idx] || ["#FAFAF9", "#1E293B", "#3F6212"][idx] || "#6366f1";
                         return (
                           <div key={idx} className="flex items-center gap-1" title={color}>
                             <div className="h-4 w-4 rounded-full border border-border shadow-xs shrink-0" style={{ backgroundColor: dummyHex }} />
                             <span className="text-[10px] font-bold text-muted-foreground ml-1">{color}</span>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   {/* Semiotics / Emotional triggers indicators */}
                   <div className="space-y-1.5 pt-1">
                     <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest block">Gatilhos Semióticos</span>
                     <div className="flex flex-wrap gap-1.5">
                       {(data.listerupCreatorsData?.semioticsCampaigns?.emotionalTriggers || ["Autenticidade Crua", "Bem-Estar Silencioso", "Exclusividade Pragmática"]).map((trig, idx) => (
                         <span key={idx} className="text-[9px] bg-pink-500/10 text-pink-700 dark:text-pink-300 font-bold px-2 py-0.5 rounded-full">
                           #{trig}
                         </span>
                       ))}
                     </div>
                   </div>

                   {/* Storytelling hooks */}
                   <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/80">
                     <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mb-1">Cortes & Storytelling Recomendados</span>
                     <ul className="text-[11px] text-muted-foreground space-y-1.5 pl-3 list-disc">
                       {(data.listerupCreatorsData?.semioticsCampaigns?.storytellingHooks || [
                         "Contraste do Silêncio: inicie o vídeo com 3s de puro foley focado no objeto antes do primeiro texto de áudio.",
                         "Narrativa de 'dia comum': mostre o produto funcionando de forma sutil e invisível integrando em um hábito matinal.",
                         "Gancho do Contra-Efeito: compartilhe um erro comum cometido no nicho para gerar empatia antes de revelar a solução."
                       ]).map((hook, idx) => (
                         <li key={idx} className="leading-relaxed">
                           {hook}
                         </li>
                       ))}
                     </ul>
                   </div>
                </CardContent>
                <DataSourceFooter source="Análise Semiótica Avançada" />
              </Card>

              {/* Card 3: Perspectivas Criativas & Tendências (Span 12) */}
              <Card className="col-span-1 md:col-span-12 bg-card shadow-sm border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                <CardHeader className="pb-3 bg-muted/10">
                   <CardTitle className="text-sm flex items-center gap-1.5 text-foreground font-semibold">
                      Perspectivas para Criadores e Tendências de Campaign Scripting
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                   <p className="text-[11px] text-foreground/90 leading-relaxed font-semibold">
                      {data.listerupCreatorsData?.creativePerspectives || `A semiótica de consumo para "${query}" indica que a saturação por discursos puramente comerciais é altíssima neste trimestre. Os criadores que mostram o "trabalho de bastidores", detalhando processos minuciosos de fabricação ou dores hiper-focalizadas da sua audiência, obtêm taxas de engajamento 47% maiores comparados à média. A atenção do usuário está se voltando para micro-comunidades estéticas. Em campanhas de conversão de infoprodutos ou SaaS, o formato recomendado de roteiro foca em ganchos visuais nos primeiros 8 segundos e na demonstração empática que estimula a validação social discreta.`}
                   </p>
                </CardContent>
                <DataSourceFooter source="Parágrafo de Perspectivas via Groq AI" />
              </Card>

              {/* Seção Nova: Ativos e Gráficos Analíticos de Campanha (ListerUp Campaign Metrics Dashboard) */}
              <div className="col-span-1 md:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-6 border-t border-dashed border-primary/20 mt-4">
                <div>
                  <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <LineChart className="w-4 h-4 text-primary" />
                    Ativos e Gráficos Analíticos de Campanha — ListerUp Premium
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Enriquecimento quantitativo de funis, performance comparativa e sobreposições de interesse do público.
                  </p>
                </div>
              </div>

              {/* Card 4: Distribuição de Interesses Cruzados da Audiência (Audiência Overlap) */}
              <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-primary/10 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                  <CardHeader className="pb-2 bg-muted/10">
                    <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                      Sobreposição de Interesses da Audiência
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Afinidades de engajamento do público de creators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.listerupCreatorsData?.audienceInterestsOverlap || [
                          { interest: "Estilo de Vida", percentage: 74 },
                          { interest: "Tecnologia / Apps", percentage: 58 },
                          { interest: "Sustentabilidade", percentage: 46 },
                          { interest: "Estética / Design", percentage: 38 }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: -5, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 100]} fontSize={8} tickLine={false} stroke="#888888" />
                        <YAxis type="category" dataKey="interest" fontSize={8} width={80} tickLine={false} axisLine={false} stroke="#888888" />
                        <Tooltip 
                          contentStyle={{ fontSize: '10px', background: '#09090b', borderColor: '#27272a', borderRadius: '6px' }} 
                        />
                        <Bar dataKey="percentage" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                          {(data.listerupCreatorsData?.audienceInterestsOverlap || [
                            { interest: "Estilo de Vida", percentage: 74 },
                            { interest: "Tecnologia / Apps", percentage: 58 },
                            { interest: "Sustentabilidade", percentage: 46 },
                            { interest: "Estética / Design", percentage: 38 }
                          ]).map((entry, index) => {
                             const colors = ["#8b5cf6", "#a78bfa", "#c084fc", "#ddd6fe"];
                             return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </div>
                <DataSourceFooter source="Dispersão Comportamental ListerUp" />
              </Card>

              {/* Card 5: Funil de Conversão Projetado por Campanha */}
              <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-primary/10 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <CardHeader className="pb-2 bg-muted/10">
                    <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                      Funil de Performance Projetado
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Transição e perdas estimadas por etapa da campanha
                    </CardDescription>
                  </CardHeader>
                   <CardContent className="pt-4 h-[180px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart
                         data={data.listerupCreatorsData?.campaignConversionFunnel || [
                           { step: "Views", value: 120000 },
                           { step: "Retidos", value: 68000 },
                           { step: "Cliques", value: 7200 },
                           { step: "Vendas", value: 540 }
                         ]}
                         margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                       >
                         <defs>
                           <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                           </linearGradient>
                         </defs>
                         <XAxis dataKey="step" fontSize={8} tickLine={false} stroke="#888888" />
                         <YAxis fontSize={8} axisLine={false} tickLine={false} stroke="#888888" />
                         <Tooltip 
                           contentStyle={{ fontSize: '10px', background: '#09090b', borderColor: '#27272a', borderRadius: '6px' }} 
                         />
                         <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFunnel)" />
                       </AreaChart>
                     </ResponsiveContainer>
                   </CardContent>
                 </div>
                 <DataSourceFooter source="Benchmarks ListerUp v2" />
               </Card>

               {/* Card 6: Benchmarks de Impacto ListerUp vs Média do Mercado */}
               <Card className="col-span-1 md:col-span-4 bg-card shadow-sm border-primary/10 relative overflow-hidden flex flex-col justify-between">
                 <div>
                   <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                   <CardHeader className="pb-2 bg-muted/10">
                     <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                       ListerUp vs Média do Mercado
                     </CardTitle>
                     <CardDescription className="text-[10px]">
                       Comparativo de métricas de eficiência (Maior = Melhor)
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="pt-4 h-[180px] flex flex-col justify-between">
                     <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                       {(data.listerupCreatorsData?.campaignPerformanceBenchmarks || [
                         { metricsName: "Taxa de Engajamento", localValue: 5.8, marketAverage: 2.1 },
                         { metricsName: "Taxa de Cliques (CTR)", localValue: 4.2, marketAverage: 1.6 },
                         { metricsName: "Retorno de ROAS", localValue: 4.8, marketAverage: 2.2 }
                       ]).map((bench, idx) => {
                         const pctGain = ((bench.localValue / bench.marketAverage) * 100 - 100).toFixed(0);
                         return (
                           <div key={idx} className="space-y-1">
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] font-medium text-foreground">{bench.metricsName}</span>
                               <span className="text-[9px] font-mono text-emerald-500 font-bold">+{pctGain}%</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold leading-none">
                               <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-1 rounded-sm flex justify-between">
                                 <span>ListerUp:</span>
                                 <span>{bench.localValue}x</span>
                               </div>
                               <div className="bg-muted text-muted-foreground p-1 rounded-sm flex justify-between">
                                 <span>Mercado:</span>
                                 <span>{bench.marketAverage}x</span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </CardContent>
                 </div>
                 <DataSourceFooter source="Estudo de Caso Comparado" />
                </Card>
              </div>
           )}

          {/* Meta Ads Library Dashboard Row (Span 12) */}
          {isMetaAdsActive && data.metaAdsData && (
            <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-dashed border-indigo-500/25 mt-4">
              {/* Header Card */}
              <div className="col-span-1 md:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-indigo-500/20 bg-indigo-500/[0.03] p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Meta Ads Library Dashboard — Inteligência de Tráfego Concorrente
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Visão de anúncios em veiculação ativa no Facebook, Instagram e Messenger para as dores e ganchos do segmento de "{query}".
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium text-[11px] px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shadow-xs">
                    📊 Ativos Estimados: <strong>{data.metaAdsData.adsCount}+ anúncios</strong>
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
                    ⚡ {metaAdsToken ? "API Ativa" : "Modo Showcase Ativo"}
                  </span>
                </div>
              </div>

              {/* Card 1: Resumo Geral e Ganchos de Conversão (Span 5) */}
              <Card className="col-span-1 md:col-span-5 bg-card shadow-sm border-indigo-500/20 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <CardHeader className="pb-3 bg-muted/10">
                    <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                      Análise do Nicho de Anúncios
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Ativos analíticos estratégicos baseados na concorrência
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 flex-1">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-sans">Análise de IA & Concorrência</span>
                      <p className="text-[11px] text-foreground font-semibold leading-relaxed">
                        {data.metaAdsData.nicheAnalysis}
                      </p>
                    </div>

                    <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/80">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1 font-sans">Ganchos Criativos Dominantes (Hooks)</span>
                      <ul className="text-[11px] text-muted-foreground space-y-2 pl-3 list-disc">
                        {data.metaAdsData.mainHooks?.map((hook: string, idx: number) => (
                          <li key={idx} className="leading-relaxed font-semibold">
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>
                <DataSourceFooter source="Análise de Hooks Meta Ads" />
              </Card>

              {/* Card 2: Principais Páginas Anunciantes (Span 7) */}
              <Card className="col-span-1 md:col-span-7 bg-card shadow-sm border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                <CardHeader className="pb-3 bg-muted/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                      Páginas & Marcas Relevantes Anunciando
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Maiores players identificados em circulação ativa de anúncios
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 divide-y divide-border/50">
                  {data.metaAdsData.topAdvertiserPages?.map((page: { name: string; pageId: string; category?: string; adsCount: number }, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">{page.name}</span>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.2 rounded font-mono">
                            ID: {page.pageId}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Categorias: {page.category || "Marca / Negócios / Serviços"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/5 px-2 py-1 rounded-full border border-indigo-500/10">
                        🔥 {page.adsCount} anúncios ativos
                      </span>
                    </div>
                  ))}
                </CardContent>
                <DataSourceFooter source="Lideranças de Tráfego Meta" />
              </Card>

              {/* Card 3: Galeria de Criativos & Anúncios de Referência (Span 12) */}
              <Card className="col-span-1 md:col-span-12 bg-card shadow-sm border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                <CardHeader className="pb-3 bg-muted/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xs flex items-center gap-1.5 font-bold text-foreground">
                        Galeria de Anúncios Espionados & Referências do Nicho
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Exemplos reais e modelados em veiculação ativa na plataforma
                      </CardDescription>
                    </div>
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">
                      Biblioteca Ao Vivo
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 bg-muted/5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.metaAdsData.referenceAds?.map((ad: { started?: string; pageName?: string; adId: string; bodyText: string; format?: string; headline?: string; cta?: string }, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-card rounded-xl border border-border bg-card shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                      >
                        {/* Status bar */}
                        <div className="p-3 bg-muted/40 border-b border-border/40 flex items-center justify-between text-[9px] font-bold">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                          <span className="text-muted-foreground/80 font-mono">
                            Desde {ad.started || "Últimos dias"}
                          </span>
                        </div>

                        {/* Advertiser page details */}
                        <div className="p-3 pb-2 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-[10px] text-indigo-600 border border-indigo-500/20">
                            {ad.pageName ? ad.pageName.substring(0, 2).toUpperCase() : "Ad"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-bold text-foreground truncate">{ad.pageName || "Anunciante Premium"}</h5>
                            <p className="text-[9px] text-muted-foreground tracking-tight">ID de anúncio: {ad.adId}</p>
                          </div>
                        </div>

                        {/* Body text copies */}
                        <div className="px-3 py-1 space-y-1">
                          <p className="text-[11px] text-foreground font-semibold leading-relaxed line-clamp-4">
                            {ad.bodyText}
                          </p>
                        </div>

                        {/* Media Thumbnail Mock */}
                        <div className="m-3 h-32 rounded-lg bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 flex flex-col items-center justify-center p-4 text-center transition-colors relative group overflow-hidden">
                          <div className="absolute top-2 right-2 bg-indigo-600/90 text-white font-mono text-[8px] font-black px-1 rounded uppercase tracking-widest z-10">
                            {ad.format || "Vídeo"}
                          </div>
                          
                          {/* Visual representations of Ad formatting */}
                          {ad.format === "Imagem" ? (
                            <svg className="w-8 h-8 text-orange-600 opacity-60 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          ) : (
                            <div className="relative">
                              <div className="h-8 w-8 rounded-full bg-orange-600/10 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-orange-700/90 mt-2">Mockup de Criativo Ativo</span>
                          <span className="text-[9.5px] text-muted-foreground leading-snug line-clamp-1 mt-0.5 font-mono">{ad.headline || "Ver detalhes adicionais"}</span>
                        </div>

                        {/* CTA button section */}
                        <div className="p-3 pt-0 border-t border-border/30 mt-1 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 rounded px-1.5 py-0.2">
                            {ad.cta || "Saiba mais"}
                          </span>
                          <a 
                            href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=${encodeURIComponent(query)}&search_type=keyword`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9.5px] font-bold text-muted-foreground hover:text-indigo-600 flex items-center gap-0.5 hover:underline"
                          >
                            Ir para Biblioteca
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <DataSourceFooter source="Meta Ads Library Crawler (Production)" />
              </Card>
            </div>
          )}

          {/* Influencers Preview (Span 12) */}
          <div className="col-span-1 md:col-span-12 space-y-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold">Influenciadores Destacados do Nicho</h3>
                
                <div className="flex items-center flex-wrap gap-2">
                  <Select value={infOrder} onValueChange={(val) => { setInfOrder(val); fetchInfluencers(val, infDate, infCountry); }}>
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="date">Mais Recente</SelectItem>
                      <SelectItem value="viewCount">Em Ascensão</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={infDate} onValueChange={(val) => { setInfDate(val); fetchInfluencers(infOrder, val, infCountry); }}>
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue placeholder="Filtro de data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer data</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="year">Último ano</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={infCountry} onValueChange={(val) => { setInfCountry(val); fetchInfluencers(infOrder, infDate, val); }}>
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Global (Todos)</SelectItem>
                      <SelectItem value="BR">Brasil</SelectItem>
                      <SelectItem value="US">Estados Unidos</SelectItem>
                      <SelectItem value="PT">Portugal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="sm" onClick={handleVerTodos} className="text-primary h-8 text-xs font-semibold hover:bg-primary/10">Ver todos <ArrowRight className="w-3 h-3 ml-1"/></Button>
                </div>
             </div>
             
             {loadingInfluencers ? (
               <div className="py-12 flex items-center justify-center">
                 <div className="animate-pulse flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
                   <span className="text-sm font-medium text-muted-foreground">Buscando influenciadores...</span>
                 </div>
               </div>
             ) : (
               <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
               {data.influencers && data.influencers.map((inf, idx) => (
                 <Card key={idx} className="min-w-[320px] max-w-[320px] snap-center flex-shrink-0 bg-card border-border shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                   {/* Header User */}
                   <div className="p-4 border-b border-border/40 flex items-center gap-3 relative">
                      <img src={inf.avatarUrl} alt={inf.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                      <div>
                         <div className="font-bold text-sm leading-tight flex items-center gap-1">{inf.name} <div className="w-1.5 h-1.5 rounded-full bg-blue-500"/></div>
                         <div className="text-xs text-muted-foreground">{inf.handle} • {inf.platform}</div>
                      </div>
                   </div>
                   {/* Content */}
                   <div className="p-4 space-y-3 relative overflow-hidden">
                      <p className="text-xs font-medium text-foreground line-clamp-3 leading-relaxed">
                        {inf.latestPost.text}
                      </p>
                      
                      {inf.latestPost.postUrl ? (
                         <div className="w-full mt-2 rounded-lg overflow-hidden border border-border/60">
                            <EmbedSocial url={inf.latestPost.postUrl} />
                         </div>
                      ) : inf.latestPost.imageUrl ? (
                         <div className="w-full h-32 mt-2 rounded-lg bg-muted flex flex-col justify-center items-center border border-border/60 overflow-hidden relative group">
                           <img src={inf.latestPost.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="post preview" />
                         </div>
                      ) : null}
                      
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-3">
                   <div className="flex items-center gap-4">
                     {inf.latestPost.likes > 0 && <span className="flex items-center gap-1.5">Likes: {(inf.latestPost.likes > 1000 ? (inf.latestPost.likes/1000).toFixed(1) + 'k' : inf.latestPost.likes)}</span>}
                     {inf.latestPost.comments > 0 && <span className="flex items-center gap-1.5">Comments: {inf.latestPost.comments}</span>}
                   </div>
                   <p className="text-[10px] text-muted-foreground/70 uppercase font-semibold">{inf.latestPost.date}</p>
                </div>
                   </div>
                 </Card>
               ))}
             </div>
             )}
             <DataSourceFooter source="YouTube Data API & Extrator Web" />
          </div>

        </div> {/* Closes the flex-1 grid wrapper */}

          {/* Lateral Audience Panel */}
          <AnimatePresence>
            {isAudiencePanelOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0, x: 20 }}
                animate={{ opacity: 1, width: 380, x: 0 }}
                exit={{ opacity: 0, width: 0, x: 20 }}
                className="hidden md:block shrink-0 h-full max-h-[85vh] overflow-y-auto w-full max-w-[380px] bg-card rounded-xl border border-border shadow-md sticky top-6 custom-scrollbar"
              >
                <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg">Audience Insights</h3>
                     <Button variant="ghost" size="icon" onClick={() => setIsAudiencePanelOpen(false)}>
                       <X className="w-4 h-4 text-muted-foreground" />
                     </Button>
                   </div>
                   
                   {data.audienceInsights ? (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Demografia Foco</p>
                           <p className="text-sm font-medium">{data.audienceInsights.demographics}</p>
                        </div>

                        {data.dataCommons && (
                          <div className="p-4 bg-muted/40 rounded-lg border border-border/45 space-y-3">
                            <div className="flex justify-between items-center border-b border-border/30 pb-2">
                              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                  ? "Indicadores do Perfil do Foco"
                                  : "Indicadores Macroeconômicos"}
                              </p>
                              <div className="flex bg-muted p-0.5 rounded border border-border/45 text-[9px] shrink-0 shadow-sm ml-1 select-none">
                                <button
                                  type="button"
                                  onClick={() => setDataCommonsMode('segment')}
                                  className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                                    dataCommonsMode === 'segment' 
                                      ? 'bg-card text-foreground shadow-xs' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Nicho
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDataCommonsMode('baseline')}
                                  className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                                    dataCommonsMode === 'baseline' 
                                      ? 'bg-card text-foreground shadow-xs' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Brasil
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-border/30 pb-1">
                                <span className="text-muted-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? "Público Foco Estimado:"
                                    : "População Estimada:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? data.dataCommons.nicheSegment.population.toLocaleString('pt-BR')
                                    : data.dataCommons.population.toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-border/30 pb-1">
                                <span className="text-muted-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? "Tamanho de Mercado (TAM):"
                                    : "PIB Nominal Anual:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? data.dataCommons.nicheSegment.marketSize
                                    : `R$ ${(data.dataCommons.gdp / 1e12).toFixed(2)}T`}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-border/30 pb-1">
                                <span className="text-muted-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? "Taxa Desocupação Foco:"
                                    : "Taxa de Desemprego:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? data.dataCommons.nicheSegment.unemploymentRate
                                    : data.dataCommons.unemploymentRate}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-border/30 pb-1">
                                <span className="text-muted-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? "Rendimento Médio Foco:"
                                    : "Rendimento Médio:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  R$ {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? data.dataCommons.nicheSegment.avgIncome.toLocaleString('pt-BR')
                                    : data.dataCommons.avgIncome.toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? "Ensino Superior Foco:"
                                    : "Ensino Superior Completo:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {dataCommonsMode === 'segment' && data.dataCommons.nicheSegment
                                    ? data.dataCommons.nicheSegment.education
                                    : data.dataCommons.education}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {data.audienceInsights.regions && data.audienceInsights.regions.length > 0 && (
                           <div className="space-y-4">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Regiões</p>
                             <div className="w-full">
                               <WorldMap highlightedRegions={data.audienceInsights.regions} />
                             </div>
                             <div className="flex items-center gap-2 flex-wrap mt-2">
                              {data.audienceInsights.regions.map((r, i) => (
                                <div key={i} className="px-2.5 py-1 bg-muted rounded-md border border-border/40 text-xs font-semibold flex items-center gap-2">

                                  {r.country} <span className="text-muted-foreground ml-1">{r.weight}%</span>
                                </div>
                              ))}
                             </div>
                           </div>
                        )}
                        {data.audienceInsights.whatTheyCareAbout && data.audienceInsights.whatTheyCareAbout.length > 0 && (
                           <div className="space-y-2 mt-6">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Interesses Principais do Público</p>
                             <ul className="space-y-2">
                              {data.audienceInsights.whatTheyCareAbout.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                                  <span className="text-muted-foreground select-none shrink-0 font-bold">•</span>
                                  {item}
                                </li>
                              ))}
                             </ul>
                           </div>
                        )}
                        {data.audienceInsights.buyingTriggers && data.audienceInsights.buyingTriggers.length > 0 && (
                           <div className="space-y-2 mt-6 bg-muted/40 p-4 rounded-xl border border-border/45">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Gatilhos de Decisão / Compra</p>
                             <ul className="space-y-2">
                              {data.audienceInsights.buyingTriggers.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                                  <span className="text-muted-foreground select-none shrink-0 font-bold">•</span>
                                  {item}
                                </li>
                              ))}
                             </ul>
                           </div>
                        )}
                        {data.audienceInsights.lifestyle && data.audienceInsights.lifestyle.length > 0 && (
                           <div className="space-y-2">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Lifestyle e Interesses</p>
                             <div className="flex items-center gap-2 flex-wrap">
                              {data.audienceInsights.lifestyle.map((l, i) => (
                                <div key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full font-bold text-[11px] border border-primary/20">{l}</div>
                              ))}
                             </div>
                           </div>
                        )}
                        {data.audienceInsights.contentPreferences && data.audienceInsights.contentPreferences.length > 0 && (
                           <div className="space-y-2">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Formatos Preferidos</p>
                             <div className="flex items-center gap-2 flex-wrap">
                              {data.audienceInsights.contentPreferences.map((l, i) => (
                                <div key={i} className="px-2.5 py-1 bg-muted rounded-md border border-border/40 text-xs font-semibold">{l}</div>
                              ))}
                             </div>
                           </div>
                        )}
                        {data.audienceInsights.devices && data.audienceInsights.devices.length > 0 && (
                           <div className="space-y-2">
                             <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Dispositivos</p>
                             <div className="flex items-center gap-2 flex-wrap">
                              {data.audienceInsights.devices.map((l, i) => (
                                <div key={i} className="px-2.5 py-1 bg-muted rounded-md border border-border/40 text-xs font-semibold">{l}</div>
                              ))}
                             </div>
                           </div>
                        )}
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground mt-4">Nenhum insight detalhado encontrado.</p>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          </div>
        </div>
      )}
      </TabsContent>

      <TabsContent value="library" className="space-y-6 mt-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">Histórico de Pesquisas</h3>
          <Button variant="ghost" size="sm" onClick={fetchLibraryHistory} className="text-xs">
            Atualizar
          </Button>
        </div>

        {loadingHistory ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Carregando sua biblioteca...</p>
          </div>
        ) : libraryHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed rounded-xl">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center shadow-inner">
               <Database className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold">Sua biblioteca está vazia</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Todos os relatórios que você gerar no Studio no futuro aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {libraryHistory.map((item: LibraryInsight) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors cursor-pointer group bg-card" onClick={() => {
                loadFromLibrary(item);
                setActiveMainTab("studio");
              }}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base truncate">{item.query}</CardTitle>
                    <div className="bg-primary/10 text-primary p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <div className="px-2 py-0.5 rounded bg-muted">
                      {item.insights_data?.trendingTopics?.length || 0} tópicos
                    </div>
                    <div className="px-2 py-0.5 rounded bg-muted">
                      {item.insights_data?.influencers?.length || 0} influenciadores
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="trends" className="space-y-8 mt-0">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Monitor</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Trends Monitor</h3>
              <p className="text-muted-foreground text-sm">
                 Análise diária de tendências mundiais e locais em tempo real.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Última atualização</p>
                 <p className="text-sm font-bold">{trendsData?.lastUpdate || 'Hoje'}</p>
              </div>
              <Button onClick={() => setTrendsData(null)} disabled={loadingTrends} variant="outline" className="rounded-xl border-dashed">
                Forçar Recarga
              </Button>
            </div>
          </div>

          {loadingTrends ? (
            <div className="py-20 flex flex-col items-center justify-center gap-6">
               <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                 <p className="text-xl font-bold">Sincronizando tendências globais...</p>
                 <p className="text-muted-foreground animate-pulse">Este processo leva cerca de 15 segundos e garante dados frescos.</p>
               </div>
            </div>
          ) : trendsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {trendsData.niches?.map((niche: TrendNiche, idx: number) => (
                <Card key={idx} className="bg-card border-border/60 hover:border-primary/30 transition-shadow overflow-hidden group">
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{niche.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          {niche.topics?.map((t: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded uppercase">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-primary">{niche.trendingScore}</div>
                         <div className="text-[10px] font-bold text-muted-foreground uppercase">Score</div>
                      </div>
                    </div>

                    <div className="h-32 -mx-2">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={niche.chartData}>
                             <defs>
                                <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'hsl(var(--card))', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                             <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill={`url(#grad-${idx})`} strokeWidth={3} />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                       <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 flex items-center gap-1">
                          <LineChart className="w-3 h-3" /> Previsão IA
                       </p>
                       <p className="text-xs font-medium leading-normal">{niche.prediction}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
               <p className="text-muted-foreground">Clique em atualizar para carregar as tendências de hoje.</p>
            </div>
          )}
          
          {trendsData?.globalHighlights && (
            <div className="mt-8 pt-8 border-t border-border/40">
               <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Destaques Globais
               </h4>
               <div className="flex flex-wrap gap-3">
                  {trendsData.globalHighlights?.map((h: string, i: number) => (
                    <div key={i} className="px-4 py-2 bg-card border border-border/60 rounded-full text-xs font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {h}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </TabsContent>
      </Tabs>
      </div>

      <Dialog open={showAllInfluencers} onOpenChange={setShowAllInfluencers}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Influenciadores Encontrados</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {data?.influencers?.map((inf, idx) => (
              <Card key={idx} className="bg-card border-border shadow-md overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center gap-3">
                  <img src={inf.avatarUrl} alt={inf.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                  <div>
                    <div className="font-bold text-xs leading-tight">{inf.name}</div>
                    <div className="text-[10px] text-muted-foreground">{inf.handle} • {inf.platform}</div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-medium text-foreground line-clamp-3">
                    {inf.latestPost.text}
                  </p>
                  <a href={inf.latestPost.postUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">Ver Original</a>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
