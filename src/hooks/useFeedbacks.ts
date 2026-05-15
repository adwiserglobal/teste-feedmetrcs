import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  experience_rating: number;
  ease_rating: number;
  templates_rating?: number;
  feedback_type: string;
  improvement_suggestions?: string;
  created_at: string;
}

interface FormResponse {
  id: string;
  form_id: string;
  response_data: any;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface FeedbackStats {
  total: number;
  averageExperience: number;
  averageEase: number;
  averageTemplates: number;
  recentFeedbacks: Feedback[];
  trend: number;
}

interface FeedbackFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  feedbackType: string;
  minRating: number;
}

export function useFeedbacks() {
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    averageExperience: 0,
    averageEase: 0,
    averageTemplates: 0,
    recentFeedbacks: [],
    trend: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilters>({
    dateRange: { from: null, to: null },
    feedbackType: "all",
    minRating: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
    
    // Set up real-time subscription for both tables
    const feedbackChannel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback'
        },
        () => {
          fetchFeedbacks();
        }
      )
      .subscribe();

    const formResponsesChannel = supabase
      .channel('form-responses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_responses'
        },
        () => {
          fetchFeedbacks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackChannel);
      supabase.removeChannel(formResponsesChannel);
    };
  }, []);

  const fetchFeedbacks = async (customFilters?: FeedbackFilters) => {
    try {
      const activeFilters = customFilters || filters;
      
      // Fetch regular feedbacks
      let feedbackQuery = supabase
        .from('feedback')
        .select('*');
      
      if (activeFilters.dateRange.from) {
        feedbackQuery = feedbackQuery.gte('created_at', activeFilters.dateRange.from.toISOString());
      }
      
      if (activeFilters.dateRange.to) {
        feedbackQuery = feedbackQuery.lte('created_at', activeFilters.dateRange.to.toISOString());
      }
      
      if (activeFilters.feedbackType !== "all") {
        feedbackQuery = feedbackQuery.eq('feedback_type', activeFilters.feedbackType);
      }
      
      if (activeFilters.minRating > 0) {
        feedbackQuery = feedbackQuery.gte('experience_rating', activeFilters.minRating);
      }

      const { data: feedbacks, error: feedbackError } = await feedbackQuery.order('created_at', { ascending: false });

      // Fetch form responses
      let formResponsesQuery = supabase
        .from('form_responses')
        .select('*');
      
      if (activeFilters.dateRange.from) {
        formResponsesQuery = formResponsesQuery.gte('submitted_at', activeFilters.dateRange.from.toISOString());
      }
      
      if (activeFilters.dateRange.to) {
        formResponsesQuery = formResponsesQuery.lte('submitted_at', activeFilters.dateRange.to.toISOString());
      }

      const { data: formResponses, error: formResponsesError } = await formResponsesQuery.order('submitted_at', { ascending: false });

      if (feedbackError) {
        console.error('Error fetching feedbacks:', feedbackError);
      }

      if (formResponsesError) {
        console.error('Error fetching form responses:', formResponsesError);
      }

      // Convert form responses to feedback format
      const convertedFormResponses: Feedback[] = (formResponses || []).map((response: FormResponse) => {
        const data = response.response_data;
        
        // Extract metrics by field name and type
        const metrics: Record<string, number> = {};
        let suggestions = '';
        
        // Parse form responses by checking field metadata if available
        Object.entries(data).forEach(([key, value]) => {
          // Store numeric values with their field keys
          if (typeof value === 'number') {
            metrics[key] = value;
          }
          
          // Collect text responses
          if (typeof value === 'string' && value.trim() !== '') {
            if (suggestions) {
              suggestions += ' | ' + value;
            } else {
              suggestions = value;
            }
          }
        });

        // Try to find experience and ease ratings from all numeric fields
        // Default to first two numeric values or 0
        const numericValues = Object.values(metrics);
        const experienceRating = numericValues[0] || 0;
        const easeRating = numericValues[1] || numericValues[0] || 0;

        return {
          id: response.id,
          experience_rating: experienceRating,
          ease_rating: easeRating,
          feedback_type: 'custom_form',
          improvement_suggestions: suggestions || JSON.stringify(data),
          created_at: response.submitted_at,
        };
      });

      // Combine both sources
      const allFeedbacks = [...(feedbacks || []), ...convertedFormResponses]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = allFeedbacks.length;
      const avgExperience = total > 0 ? 
        allFeedbacks.reduce((sum, f) => sum + f.experience_rating, 0) / total : 0;
      const avgEase = total > 0 ? 
        allFeedbacks.reduce((sum, f) => sum + f.ease_rating, 0) / total : 0;
      const templatesRatings = allFeedbacks.filter(f => f.templates_rating !== null);
      const avgTemplates = templatesRatings.length > 0 ? 
        templatesRatings.reduce((sum, f) => sum + (f.templates_rating || 0), 0) / templatesRatings.length : 0;

      // Calcular tendência: comparar últimos 7 dias com 7 dias anteriores
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const currentPeriod = allFeedbacks.filter(f => 
        new Date(f.created_at) >= sevenDaysAgo
      );
      const previousPeriod = allFeedbacks.filter(f => 
        new Date(f.created_at) >= fourteenDaysAgo && 
        new Date(f.created_at) < sevenDaysAgo
      );

      const currentCount = currentPeriod.length;
      const previousCount = previousPeriod.length;

      // Fórmula: ((Valor_Atual - Valor_Anterior) / Valor_Anterior) × 100
      let trend = 0;
      if (previousCount > 0) {
        trend = ((currentCount - previousCount) / previousCount) * 100;
      } else if (currentCount > 0) {
        trend = 100; // Se não há período anterior mas há atual, é 100% de crescimento
      }

      setStats({
        total,
        averageExperience: avgExperience,
        averageEase: avgEase,
        averageTemplates: avgTemplates,
        recentFeedbacks: allFeedbacks.slice(0, 10),
        trend: Math.round(trend * 10) / 10 // Arredondar para 1 casa decimal
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newFilters: Partial<FeedbackFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchFeedbacks(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: { from: null, to: null },
      feedbackType: "all",
      minRating: 0
    };
    setFilters(clearedFilters);
    fetchFeedbacks(clearedFilters);
  };

  return { 
    stats, 
    loading, 
    filters,
    refresh: fetchFeedbacks,
    applyFilters,
    clearFilters
  };
}