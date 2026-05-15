import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const feedbackData = await req.json();
    
    // Validate required fields
    if (!feedbackData.experience_rating || !feedbackData.ease_rating) {
      return new Response(JSON.stringify({ 
        error: 'experience_rating and ease_rating are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert ratings from 1-10 scale to 1-5 scale for database constraints
    const convertRating = (rating: number) => Math.ceil(rating / 2);
    
    const experience_rating = convertRating(Math.max(1, Math.min(10, parseInt(feedbackData.experience_rating))));
    const ease_rating = convertRating(Math.max(1, Math.min(10, parseInt(feedbackData.ease_rating))));
    const templates_rating = feedbackData.templates_rating ? 
      convertRating(Math.max(1, Math.min(10, parseInt(feedbackData.templates_rating)))) : null;

    const data = {
      experience_rating,
      ease_rating,
      templates_rating,
      feedback_type: feedbackData.feedback_type || 'general',
      improvement_suggestions: feedbackData.improvement_suggestions || null
    };

    console.log('Inserting feedback data:', data);

    const { data: result, error } = await supabase
      .from('feedback')
      .insert([data])
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save feedback',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Feedback saved successfully:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Feedback received successfully',
      data: result[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in collect-feedback function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});