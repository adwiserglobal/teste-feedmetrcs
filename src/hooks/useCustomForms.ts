import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FormField {
  id: string;
  type: 'rating' | 'text' | 'select' | 'textarea' | 'email' | 'number';
  name: string;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  ratingScale?: number;
  ratingStyle?: 'numbers' | 'stars' | 'squares' | 'circles';
  metricType?: 'csat' | 'nps' | 'ces' | 'experience' | 'ease' | 'service' | 'product' | 'custom' | 'none';
  customMetricName?: string;
}

export interface CustomForm {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  styling: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_responses: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  response_data: Record<string, any>;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export const useCustomForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching forms:', error);
      toast({
        title: 'Erro ao carregar formulários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (form: Omit<CustomForm, 'id' | 'created_at' | 'updated_at' | 'total_responses'>) => {
    try {
      const { data, error } = await supabase
        .from('custom_forms')
        .insert([form as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Formulário criado!',
        description: 'Seu formulário foi criado com sucesso.',
      });

      await fetchForms();
      return data;
    } catch (error: any) {
      console.error('Error creating form:', error);
      toast({
        title: 'Erro ao criar formulário',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateForm = async (id: string, updates: Partial<CustomForm>) => {
    try {
      const { error } = await supabase
        .from('custom_forms')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Formulário atualizado!',
        description: 'As alterações foram salvas.',
      });

      await fetchForms();
    } catch (error: any) {
      console.error('Error updating form:', error);
      toast({
        title: 'Erro ao atualizar formulário',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Formulário excluído',
        description: 'O formulário foi removido com sucesso.',
      });

      await fetchForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      toast({
        title: 'Erro ao excluir formulário',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getFormById = async (id: string): Promise<CustomForm | null> => {
    try {
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error: any) {
      console.error('Error fetching form:', error);
      return null;
    }
  };

  const getFormResponses = async (formId: string): Promise<FormResponse[]> => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error: any) {
      console.error('Error fetching form responses:', error);
      toast({
        title: 'Erro ao carregar respostas',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    fetchForms();

    // Realtime updates
    const channel = supabase
      .channel('custom-forms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_forms' }, () => {
        fetchForms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    forms,
    loading,
    createForm,
    updateForm,
    deleteForm,
    getFormById,
    getFormResponses,
    refresh: fetchForms,
  };
};