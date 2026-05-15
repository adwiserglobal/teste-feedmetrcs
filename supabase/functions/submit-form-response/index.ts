import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { formId, responseData } = await req.json();

    if (!formId || !responseData) {
      return new Response(
        JSON.stringify({ error: 'formId and responseData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o formulário existe e está ativo
    const { data: form, error: formError } = await supabase
      .from('custom_forms')
      .select('id, is_active')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      console.error('Form not found:', formError);
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!form.is_active) {
      return new Response(
        JSON.stringify({ error: 'Form is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações da requisição
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Salvar resposta
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .insert([{
        form_id: formId,
        response_data: responseData,
        ip_address: ipAddress,
        user_agent: userAgent,
      }])
      .select()
      .single();

    if (responseError) {
      console.error('Error saving response:', responseError);
      return new Response(
        JSON.stringify({ error: 'Failed to save response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Response saved successfully:', response.id);

    return new Response(
      JSON.stringify({ success: true, responseId: response.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});