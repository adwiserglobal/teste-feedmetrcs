import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

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
  account_id: string;
  title: string;
  description: string | null;
  fields: Record<string, any>;
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_responses?: number;
}

export interface FormResponse {
  id: string;
  account_id: string;
  form_id: string;
  response_data: Record<string, any>;
  submitted_at: string;
}

export const useCustomForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchForms = async () => {
    if (!user?.accountId) {
      setForms([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'custom_forms'), 
        where('account_id', '==', user.accountId)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomForm));
      
      // Sort in memory as composite index might be needed otherwise
      setForms(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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

  const createForm = async (form: Pick<CustomForm, 'title' | 'description' | 'fields' | 'settings'>) => {
    if (!user?.accountId) throw new Error('Não autenticado');
    
    try {
      const formPayload: Omit<CustomForm, 'id'> = {
        ...form,
        fields: form.fields || {},
        settings: form.settings || {},
        account_id: user.accountId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'custom_forms'), formPayload);

      toast({
        title: 'Formulário criado!',
        description: 'Seu formulário foi criado com sucesso.',
      });

      return { id: docRef.id, ...formPayload };
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
      const docRef = doc(db, 'custom_forms', id);
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(docRef, updatePayload);

      toast({
        title: 'Formulário atualizado!',
        description: 'As alterações foram salvas.',
      });
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
      await deleteDoc(doc(db, 'custom_forms', id));

      toast({
        title: 'Formulário excluído',
        description: 'O formulário foi removido com sucesso.',
      });
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
      const docRef = doc(db, 'custom_forms', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CustomForm;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching form:', error);
      return null;
    }
  };

  const getFormResponses = async (formId: string): Promise<FormResponse[]> => {
    try {
      const q = query(
        collection(db, 'form_responses'),
        where('form_id', '==', formId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormResponse));
      
      return data.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
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
    if (!user?.accountId) {
      setLoading(false);
      return;
    }

    // Realtime updates
    const q = query(
      collection(db, 'custom_forms'),
      where('account_id', '==', user.accountId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomForm));
      setForms(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    }, (error) => {
      console.error('Realtime error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.accountId]);

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