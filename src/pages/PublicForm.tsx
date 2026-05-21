import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCustomForms, CustomForm, FormField } from "@/hooks/useCustomForms";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PublicForm() {
  const { id } = useParams();
  const { getFormById } = useCustomForms();
  const { toast } = useToast();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    if (!id) return;
    setLoading(true);
    const formData = await getFormById(id);
    setForm(formData);
    setLoading(false);
  };

  const handleRatingClick = (fieldName: string, value: number) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
    setErrors({
      ...errors,
      [fieldName]: ''
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    form?.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'Este campo é obrigatório';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !form) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'form_responses'), {
        form_id: form.id,
        response_data: formData,
        submitted_at: serverTimestamp(),
      });
      setSubmitted(true);
      setFormData({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar formulário. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const error = errors[field.name];
    if (field.type === 'rating') {
      const scale = field.ratingScale || 5;
      const style = field.ratingStyle || 'numbers';
      const getRatingContent = (num: number) => {
        if (style === 'stars') return '⭐';
        if (style === 'squares') return '■';
        if (style === 'circles') return '●';
        return num;
      };
      const getButtonClass = (num: number) => {
        const baseClass = "w-12 h-12 border-2 transition-all font-bold flex items-center justify-center";
        const shapeClass = style === 'circles' ? 'rounded-full' : style === 'squares' ? 'rounded-sm' : 'rounded-md';
        const selectedClass = value >= num ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:border-primary/50';
        return `${baseClass} ${shapeClass} ${selectedClass}`;
      };
      return <div key={field.id} className="space-y-3">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
          <div className="flex flex-wrap gap-2">
            {Array.from({
            length: scale
          }, (_, i) => i + 1).map(num => <button key={num} type="button" onClick={() => handleRatingClick(field.name, num)} className={getButtonClass(num)}>
                {getRatingContent(num)}
              </button>)}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>;
    }
    if (field.type === 'textarea') {
      return <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
          <Textarea id={field.name} value={value || ''} onChange={e => {
          setFormData({
            ...formData,
            [field.name]: e.target.value
          });
          setErrors({
            ...errors,
            [field.name]: ''
          });
        }} placeholder={field.placeholder} rows={4} className={error ? 'border-destructive' : ''} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>;
    }
    if (field.type === 'select') {
      return <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
          <Select value={value || ''} onValueChange={val => {
          setFormData({
            ...formData,
            [field.name]: val
          });
          setErrors({
            ...errors,
            [field.name]: ''
          });
        }}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>)}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>;
    }
    return <div key={field.id} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
        <Input id={field.name} type={field.type} value={value || ''} onChange={e => {
        setFormData({
          ...formData,
          [field.name]: e.target.value
        });
        setErrors({
          ...errors,
          [field.name]: ''
        });
      }} placeholder={field.placeholder} className={error ? 'border-destructive' : ''} />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>;
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>;
  }
  if (!form) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md px-[8px] mx-[63px] my-[20px] py-[22px]">
          <CardHeader className="mx-[5px]">
            <CardTitle className="text-2xl">Ops! Formulário não encontrado :(</CardTitle>
            <CardDescription className="py-0 px-0 mx-0 my-0 text-xs">Parece que este formulário não existe, foi pausado ou removido.

          </CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }
  if (!form.is_active) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Formulário inativo</CardTitle>
            <CardDescription>
              Este formulário não está mais recebendo respostas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }
  if (submitted) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground">
              Sua resposta foi enviada com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30 py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{form.title}</CardTitle>
          {form.description && <CardDescription className="text-base">{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map(field => renderField(field))}
            
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </> : 'Enviar Respostas'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
}