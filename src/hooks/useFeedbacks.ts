import { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';

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
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.accountId) {
      setLoading(false);
      return;
    }
    
    fetchFeedbacks();
    
    // Set up real-time subscription for both tables
    const feedbackQuery = query(collection(db, 'feedbacks'), where('account_id', '==', user.accountId));
    const formResponsesQuery = query(collection(db, 'form_responses'), where('account_id', '==', user.accountId));

    const unsubscribeFeedbacks = onSnapshot(feedbackQuery, () => {
      fetchFeedbacks();
    }, (err) => console.error(err));

    const unsubscribeResponses = onSnapshot(formResponsesQuery, () => {
      fetchFeedbacks();
    }, (err) => console.error(err));

    return () => {
      unsubscribeFeedbacks();
      unsubscribeResponses();
    };
  }, [user?.accountId]);

  const fetchFeedbacks = async (customFilters?: FeedbackFilters) => {
    if (!user?.accountId) return;

    try {
      const activeFilters = customFilters || filters;
      
      // Fetch regular feedbacks
      const fQuery = query(collection(db, 'feedbacks'), where('account_id', '==', user.accountId));
      const fSnap = await getDocs(fQuery);
      
      let feedbacks: any[] = fSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (activeFilters.dateRange.from) {
        feedbacks = feedbacks.filter(f => new Date(f.created_at) >= activeFilters.dateRange.from!);
      }
      
      if (activeFilters.dateRange.to) {
        feedbacks = feedbacks.filter(f => new Date(f.created_at) <= activeFilters.dateRange.to!);
      }
      
      if (activeFilters.feedbackType !== "all") {
        feedbacks = feedbacks.filter(f => f.feedback_type === activeFilters.feedbackType);
      }
      
      if (activeFilters.minRating > 0) {
        feedbacks = feedbacks.filter(f => f.experience_rating >= activeFilters.minRating);
      }

      // Fetch form responses
      const rQuery = query(collection(db, 'form_responses'), where('account_id', '==', user.accountId));
      const rSnap = await getDocs(rQuery);
      
      let formResponses: any[] = rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (activeFilters.dateRange.from) {
         formResponses = formResponses.filter(r => new Date(r.submitted_at) >= activeFilters.dateRange.from!);
      }
      
      if (activeFilters.dateRange.to) {
         formResponses = formResponses.filter(r => new Date(r.submitted_at) <= activeFilters.dateRange.to!);
      }

      // Convert form responses to feedback format
      const convertedFormResponses: Feedback[] = (formResponses || []).map((response: FormResponse) => {
        const data = response.response_data;
        
        // Extract metrics by field name and type
        const metrics: Record<string, number> = {};
        let suggestions = '';
        
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'number') {
              metrics[key] = value;
            }
            if (typeof value === 'string' && value.trim() !== '') {
              if (suggestions) {
                suggestions += ' | ' + value;
              } else {
                suggestions = value;
              }
            }
          });
        }

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
      const templatesRatings = allFeedbacks.filter(f => f.templates_rating !== undefined && f.templates_rating !== null);
      const avgTemplates = templatesRatings.length > 0 ? 
        templatesRatings.reduce((sum, f) => sum + (f.templates_rating || 0), 0) / templatesRatings.length : 0;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const currentPeriod = allFeedbacks.filter(f => new Date(f.created_at) >= sevenDaysAgo);
      const previousPeriod = allFeedbacks.filter(f => 
        new Date(f.created_at) >= fourteenDaysAgo && 
        new Date(f.created_at) < sevenDaysAgo
      );

      const currentCount = currentPeriod.length;
      const previousCount = previousPeriod.length;

      let trend = 0;
      if (previousCount > 0) {
        trend = ((currentCount - previousCount) / previousCount) * 100;
      } else if (currentCount > 0) {
        trend = 100;
      }

      setStats({
        total,
        averageExperience: avgExperience,
        averageEase: avgEase,
        averageTemplates: avgTemplates,
        recentFeedbacks: allFeedbacks.slice(0, 10),
        trend: Math.round(trend * 10) / 10
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao carregar feedbacks.",
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