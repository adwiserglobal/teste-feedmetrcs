import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  response_data: Record<string, unknown>;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export const useCustomForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'custom_forms'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at instanceof Timestamp ? doc.data().created_at.toDate().toISOString() : doc.data().created_at,
        updated_at: doc.data().updated_at instanceof Timestamp ? doc.data().updated_at.toDate().toISOString() : doc.data().updated_at,
      })) as CustomForm[];
      
      setForms(formsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching forms:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createForm = async (form: Omit<CustomForm, 'id' | 'created_at' | 'updated_at' | 'total_responses'>) => {
    try {
      const docRef = await addDoc(collection(db, 'custom_forms'), {
        ...form,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        total_responses: 0
      });

      toast({
        title: 'Formulário criado!',
        description: 'Seu formulário foi criado com sucesso.',
      });

      return { id: docRef.id };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error creating form:', err);
      toast({
        title: 'Erro ao criar formulário',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateForm = async (id: string, updates: Partial<CustomForm>) => {
    try {
      const formRef = doc(db, 'custom_forms', id);
      await updateDoc(formRef, {
        ...updates,
        updated_at: serverTimestamp()
      });

      toast({
        title: 'Formulário atualizado!',
        description: 'As alterações foram salvas.',
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error updating form:', err);
      toast({
        title: 'Erro ao atualizar formulário',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_forms', id));
      toast({
        title: 'Formulário excluído',
        description: 'O formulário foi removido com sucesso.',
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting form:', err);
      toast({
        title: 'Erro ao excluir formulário',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getFormById = async (id: string): Promise<CustomForm | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'custom_forms', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at,
          updated_at: data.updated_at instanceof Timestamp ? data.updated_at.toDate().toISOString() : data.updated_at,
        } as CustomForm;
      }
      return null;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching form:', err);
      return null;
    }
  };

  const getFormResponses = async (formId: string): Promise<FormResponse[]> => {
    try {
      const q = query(
        collection(db, 'form_responses'), 
        where('form_id', '==', formId),
        orderBy('submitted_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submitted_at: doc.data().submitted_at instanceof Timestamp ? doc.data().submitted_at.toDate().toISOString() : doc.data().submitted_at,
      })) as FormResponse[];
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching form responses:', err);
      toast({
        title: 'Erro ao carregar respostas',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    forms,
    loading,
    createForm,
    updateForm,
    deleteForm,
    getFormById,
    getFormResponses,
    refresh: () => {}, // onSnapshot handles it
  };
};
