import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, Paintbrush, Settings, Copy, CheckCircle, Star, MessageSquare, Sliders, ArrowLeft, Download, Hash, Monitor, MessageCircle, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

interface FormField {
  id: string;
  type: 'rating' | 'text' | 'select' | 'textarea';
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

interface FormConfig {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  styling: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
  };
}

const defaultStyling = {
  theme: 'auto' as const,
  primaryColor: '#6366f1', // Indigo primary color by default
  borderRadius: '9',
  fontSize: '16'
};

const fieldTypes = [
  { value: 'rating', label: 'Avaliação', icon: Star },
  { value: 'text', label: 'Texto Curto', icon: MessageSquare },
  { value: 'textarea', label: 'Texto Longo', icon: MessageSquare },
  { value: 'select', label: 'Seleção', icon: Sliders }
];

const metricTypes = [
  { value: 'none', label: 'Nenhuma métrica específica' },
  { value: 'csat', label: 'CSAT (Customer Satisfaction)' },
  { value: 'nps', label: 'NPS (Net Promoter Score)' },
  { value: 'ces', label: 'CES (Customer Effort Score)' },
  { value: 'custom', label: 'Personalizado' },
];

const colorPresets = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Violet', value: '#8b5cf6' }
];

export default function FormBuilderPage() {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: 'form-' + Date.now(),
    title: 'Pesquisa de Satisfação',
    description: 'Queremos ouvir você! Como foi a sua experiência com o nosso serviço hoje?',
    fields: [
      {
        id: 'experience',
        type: 'rating',
        name: 'experience_rating',
        label: 'Avalie sua experiência geral',
        required: true,
        ratingScale: 5,
        ratingStyle: 'stars',
        metricType: 'experience'
      },
      {
        id: 'ease',
        type: 'rating',
        name: 'ease_rating',
        label: 'A facilidade de uso atendeu às expectativas?',
        required: true,
        ratingScale: 5,
        ratingStyle: 'numbers',
        metricType: 'ease'
      }
    ],
    styling: defaultStyling
  });
  
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: 'field-' + Date.now(),
      type,
      name: 'new_field_' + Date.now(),
      label: 'Novo campo',
      required: false,
      placeholder: 'Digite aqui...',
      ratingScale: 5,
      ratingStyle: 'stars',
      metricType: 'none'
    };
    setFormConfig(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const removeField = (fieldId: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => field.id === fieldId ? { ...field, ...updates } : field)
    }));
  };

  const generateFormHTML = () => {
    const { title, description, fields, styling } = formConfig;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
          --primary-color: ${styling.primaryColor};
          --radius: ${styling.borderRadius}px;
          --font-size: ${styling.fontSize}px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; }
        
        .feedback-form {
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background: ${styling.theme === 'dark' ? '#18181b' : '#ffffff'};
            color: ${styling.theme === 'dark' ? '#f4f4f5' : '#18181b'};
            border-radius: var(--radius);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border: 1px solid ${styling.theme === 'dark' ? '#27272a' : '#e4e4e7'};
        }
        
        .form-header { text-align: center; margin-bottom: 32px; }
        .form-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: var(--primary-color); }
        .form-description { font-size: var(--font-size); opacity: 0.8; line-height: 1.5; }
        .field-group { margin-bottom: 24px; }
        .field-label { display: block; font-weight: 600; margin-bottom: 8px; font-size: var(--font-size); }
        .field-description { font-size: 14px; opacity: 0.7; margin-bottom: 12px; }
        
        .rating-input { display: flex; gap: 8px; flex-wrap: wrap; }
        .rating-button {
            width: 44px; height: 44px;
            border: 2px solid var(--primary-color);
            background: transparent; color: var(--primary-color);
            border-radius: 8px; font-weight: 600; cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; align-items: center; justify-content: center;
        }
        .rating-button.circles { border-radius: 50%; }
        .rating-button.squares { border-radius: 4px; }
        .rating-button.stars { font-size: 20px; border-color: transparent; }
        
        .rating-button:hover, .rating-button.selected {
            background: var(--primary-color);
            color: white; transform: scale(1.05);
        }
        
        .text-input, .textarea-input, .select-input {
            width: 100%; padding: 12px 16px;
            border: 2px solid ${styling.theme === 'dark' ? '#3f3f46' : '#e4e4e7'};
            border-radius: var(--radius);
            font-size: var(--font-size);
            background: ${styling.theme === 'dark' ? '#27272a' : '#fafafa'};
            color: ${styling.theme === 'dark' ? '#f4f4f5' : '#18181b'};
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .text-input:focus, .textarea-input:focus, .select-input:focus {
            outline: none; border-color: var(--primary-color);
            box-shadow: 0 0 0 3px ${styling.primaryColor}30;
        }
        .textarea-input { min-height: 120px; resize: vertical; }
        
        .submit-button {
            width: 100%; padding: 16px; margin-top: 16px;
            background: var(--primary-color); color: white;
            border: none; border-radius: var(--radius);
            font-size: 18px; font-weight: 600; cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
        }
        .submit-button:hover { opacity: 0.9; }
        .submit-button:active { transform: scale(0.98); }
        .required-mark { color: #e11d48; margin-left: 4px; }
    </style>
</head>
<body>
    <form class="feedback-form" onsubmit="handleSubmit(event)">
        <div class="form-header">
            <h1 class="form-title">${title}</h1>
            <p class="form-description">${description}</p>
        </div>
        
        ${fields.map(field => {
          if (field.type === 'rating') {
            const scale = field.ratingScale || 5;
            const style = field.ratingStyle || 'numbers';
            return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <div class="rating-input">
                    ${Array.from({ length: scale }, (_, i) => i + 1).map(num => {
                      let btnContent = num.toString();
                      if (style === 'stars') btnContent = '★';
                      else if (style === 'squares') btnContent = '■';
                      else if (style === 'circles') btnContent = '●';
                      return `<button type="button" class="rating-button ${style}" data-field="${field.name}" data-value="${num}" onclick="selectRating('${field.name}', ${num})">${btnContent}</button>`;
                    }).join('')}
                </div>
                <input type="hidden" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>`;
          } else if (field.type === 'textarea') {
            return `
            <div class="field-group">
                <label class="field-label">${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}</label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <textarea class="textarea-input" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
            </div>`;
          } else if (field.type === 'select') {
            return `
            <div class="field-group">
                <label class="field-label">${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}</label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <select class="select-input" name="${field.name}" ${field.required ? 'required' : ''}>
                    <option value="">Selecione uma opção</option>
                    ${(field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </div>`;
          } else {
            return `
            <div class="field-group">
                <label class="field-label">${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}</label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <input type="text" class="text-input" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>
            </div>`;
          }
        }).join('')}
        
        <button type="submit" class="submit-button">Enviar Resposta</button>
    </form>

    <script>
        function selectRating(fieldName, value) {
            const buttons = document.querySelectorAll('[data-field="' + fieldName + '"]');
            buttons.forEach((btn) => {
                const btnValue = parseInt(btn.getAttribute('data-value'));
                btn.classList.toggle('selected', btnValue <= value);
            });
            document.querySelector('input[name="' + fieldName + '"]').value = value;
        }
        
        function handleSubmit(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            
            const data = {
                feedback_type: 'form_builder',
                form_id: '${formConfig.id}',
                metadata: {}
            };
            
            // Map form data dynamically
            for (const [key, val] of formData.entries()) {
                if (key.includes('rating')) {
                    data[key] = parseInt(val) || null;
                } else {
                    data.metadata[key] = val;
                }
            }
            
            // Sending to Supabase Edge Function
            fetch('https://dkiybgkmzgyxqteymlwg.supabase.co/functions/v1/collect-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    alert('Feedback enviado com sucesso! Obrigado pela sua opinião.');
                    event.target.reset();
                    document.querySelectorAll('.rating-button').forEach(btn => btn.classList.remove('selected'));
                } else {
                    alert('Erro ao enviar feedback. Tente novamente.');
                }
            }).catch(() => {
                alert('Erro ao enviar feedback. Verifique sua conexão.');
            });
        }
    </script>
</body>
</html>`;
  };

  const copyFormCode = async () => {
    try {
      await navigator.clipboard.writeText(generateFormHTML());
      setCopied(true);
      toast({ title: "Código copiado!", description: "O HTML foi copiado para sua área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o código.", variant: "destructive" });
    }
  };

  const downloadFormHTML = () => {
    const htmlContent = generateFormHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formConfig.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado!" });
  };

  const handlePreviewRating = (fieldName: string, value: number) => {
    setPreviewData(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Paintbrush className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Form Builder</h1>
                <p className="text-xs text-muted-foreground font-medium">Crie formulários incriveis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={downloadFormHTML} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Exportar HTML
            </Button>
            <Button onClick={copyFormCode} size="sm" className="gap-2">
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar Código'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Builder Controls - Left Column */}
          <div className="xl:col-span-5 space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Configurações</CardTitle>
                <CardDescription>Personalize a estrutura e o estilo do seu formulário.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="builder" className="font-medium">Campos</TabsTrigger>
                    <TabsTrigger value="styling" className="font-medium">Estilo & Tema</TabsTrigger>
                  </TabsList>

                  <TabsContent value="builder" className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Cabeçalho</Label>
                        <Input 
                          value={formConfig.title} 
                          onChange={e => setFormConfig(prev => ({ ...prev, title: e.target.value }))} 
                          className="font-medium text-lg border-x-0 border-t-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Textarea 
                          value={formConfig.description} 
                          onChange={e => setFormConfig(prev => ({ ...prev, description: e.target.value }))} 
                          className="resize-none min-h-[80px] border-x-0 border-t-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                        />
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Form Fields Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Estrutura de Campos</Label>
                      </div>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {fieldTypes.map(ft => (
                          <Button key={ft.value} size="sm" variant="outline" className="gap-2 text-xs" onClick={() => addField(ft.value as any)}>
                            {<ft.icon className="w-3.5 h-3.5"/>}
                            {ft.label}
                          </Button>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {formConfig.fields.map((field, idx) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.98 }}
                              key={field.id}
                            >
                              <Card className="border-border/60 overflow-hidden group">
                                <div className="p-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                                      <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-md text-muted-foreground">CAMPO {idx + 1}</span>
                                      <span className="text-sm font-medium text-foreground">{fieldTypes.find(t=>t.value===field.type)?.label}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeField(field.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">Rótulo / Pergunta</Label>
                                      <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="h-9"/>
                                    </div>

                                    {/* Type specific config */}
                                    {field.type === 'rating' && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs text-muted-foreground">Escala</Label>
                                          <Select value={field.ratingScale?.toString()} onValueChange={(val) => updateField(field.id, { ratingScale: parseInt(val) })}>
                                            <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="3">1 a 3</SelectItem>
                                              <SelectItem value="5">1 a 5</SelectItem>
                                              <SelectItem value="7">1 a 7</SelectItem>
                                              <SelectItem value="10">1 a 10</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs text-muted-foreground">Estilo</Label>
                                          <Select value={field.ratingStyle} onValueChange={(val: any) => updateField(field.id, { ratingStyle: val })}>
                                            <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="numbers">Números</SelectItem>
                                              <SelectItem value="stars">Estrelas</SelectItem>
                                              <SelectItem value="squares">Quadrados</SelectItem>
                                              <SelectItem value="circles">Círculos</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}

                                    {field.type === 'select' && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Opções separadas por vírgula</Label>
                                        <Input 
                                          value={(field.options || []).join(', ')} 
                                          onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                                          placeholder="Opção 1, Opção 2"
                                          className="h-9"
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="space-y-0.5">
                                        <Label className="text-xs font-semibold">Obrigatório</Label>
                                        <p className="text-[10px] text-muted-foreground cursor-default">O usuário deve preencher este campo.</p>
                                      </div>
                                      <Switch checked={field.required} onCheckedChange={(val) => updateField(field.id, { required: val })}/>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="styling" className="space-y-8">
                     <div className="space-y-4">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Paleta de Cores</Label>
                      <div className="flex gap-3 flex-wrap">
                        {colorPresets.map(preset => (
                           <button 
                            key={preset.value}
                            onClick={() => setFormConfig(p => ({...p, styling: {...p.styling, primaryColor: preset.value}}))}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${formConfig.styling.primaryColor === preset.value ? 'ring-2 ring-offset-2 ring-offset-white ring-black/80' : ''}`}
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                          >
                            {formConfig.styling.primaryColor === preset.value && <CheckCircle className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                         <Label className="text-sm">Cor personalizada:</Label>
                         <Input type="color" value={formConfig.styling.primaryColor} onChange={e => setFormConfig(p => ({...p, styling: {...p.styling, primaryColor: e.target.value}}))} className="w-14 h-9 p-1 border-border/50 cursor-pointer"/>
                      </div>
                     </div>

                     <Separator className="opacity-50" />

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Bordas (Radius px)</Label>
                          <Input type="number" value={formConfig.styling.borderRadius} onChange={e => setFormConfig(p => ({...p, styling: {...p.styling, borderRadius: e.target.value}}))} className="font-mono"/>
                        </div>
                        <div className="space-y-4">
                           <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Tema</Label>
                           <Select value={formConfig.styling.theme} onValueChange={(v:any) => setFormConfig(p => ({...p, styling: {...p.styling, theme: v}}))}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Escuro</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview - Right Column */}
          <div className="xl:col-span-7 sticky top-24">
             <div className="flex items-center gap-2 mb-4 px-1">
               <Monitor className="h-5 w-5 text-muted-foreground" />
               <h2 className="font-semibold text-foreground">Preview Real</h2>
             </div>
             
             {/* Mock Browser Layout */}
             <div className="rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden flex flex-col h-[700px]">
                {/* Browser Header */}
                <div className="h-12 border-b border-border/40 bg-muted/30 flex items-center px-4 gap-4">
                   <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                   </div>
                   <div className="flex-1 bg-background border border-border/50 rounded-md h-7 flex items-center px-3 justify-center text-xs text-muted-foreground opacity-60">
                     meusite.com
                   </div>
                </div>

                {/* Browser Content */}
                <div className="flex-1 overflow-y-auto bg-muted/30 p-6 flex flex-col pt-12 relative">
                   {/* Centered form preview */}
                   <motion.div 
                     layout
                     className="w-full max-w-lg mx-auto shadow-2xl transition-all duration-300"
                     style={{
                       backgroundColor: formConfig.styling.theme === 'dark' ? '#18181b' : '#ffffff',
                       color: formConfig.styling.theme === 'dark' ? '#f4f4f5' : '#18181b',
                       borderRadius: `${formConfig.styling.borderRadius}px`,
                     }}
                   >
                     <div className="p-8 space-y-8">
                       <div className="text-center space-y-2">
                         <h2 className="text-2xl font-bold tracking-tight" style={{ color: formConfig.styling.primaryColor }}>{formConfig.title}</h2>
                         <p className="opacity-80 leading-relaxed text-sm">{formConfig.description}</p>
                       </div>

                       <div className="space-y-6">
                         {formConfig.fields.map(field => (
                           <motion.div layout key={field.id} className="space-y-3">
                             <div>
                               <label className="text-sm font-semibold tracking-tight">
                                 {field.label} {field.required && <span className="text-rose-500 ml-1">*</span>}
                               </label>
                               {field.description && <p className="text-xs opacity-70 mt-1">{field.description}</p>}
                             </div>

                             {field.type === 'rating' && (
                               <div className="flex flex-wrap gap-2 text-sm">
                                 {Array.from({ length: field.ratingScale || 5 }, (_, i) => i + 1).map(num => {
                                   const isSelected = (previewData[field.name] || 0) >= num;
                                   const isStars = field.ratingStyle === 'stars';
                                   return (
                                     <button
                                       key={num}
                                       type="button"
                                       className="transition-all duration-200 border-2 font-semibold flex items-center justify-center 
                                                 hover:scale-105 active:scale-95"
                                       style={{
                                         width: isStars ? 'auto' : '40px',
                                         height: '40px',
                                         padding: isStars ? '0 8px' : '0',
                                         borderRadius: field.ratingStyle === 'circles' ? '50%' : '6px',
                                         borderColor: isStars ? 'transparent' : formConfig.styling.primaryColor,
                                         backgroundColor: isSelected ? formConfig.styling.primaryColor : 'transparent',
                                         color: isSelected ? '#fff' : (isStars ? '#18181b' : formConfig.styling.primaryColor),
                                         fontSize: isStars ? '24px' : '15px'
                                       }}
                                       onClick={() => handlePreviewRating(field.name, num)}
                                     >
                                      {isStars ? (isSelected ? '★' : '☆') : field.ratingStyle === 'squares' ? '■' : field.ratingStyle === 'circles' ? '●' : num}
                                     </button>
                                   )
                                 })}
                               </div>
                             )}

                             {field.type === 'text' && (
                               <input type="text" placeholder={field.placeholder} className="w-full h-11 px-3 border rounded-md border-border/50 outline-none transition-colors" 
                               style={{ borderColor: formConfig.styling.theme === 'dark' ? '#3f3f46' : '#e4e4e7', background: formConfig.styling.theme === 'dark' ? '#27272a' : 'transparent' }}/>
                             )}
                             {field.type === 'textarea' && (
                               <textarea placeholder={field.placeholder} className="w-full h-24 p-3 border rounded-md border-border/50 outline-none resize-none transition-colors" 
                               style={{ borderColor: formConfig.styling.theme === 'dark' ? '#3f3f46' : '#e4e4e7', background: formConfig.styling.theme === 'dark' ? '#27272a' : 'transparent' }}/>
                             )}
                             {field.type === 'select' && (
                               <select className="w-full h-11 px-3 border rounded-md border-border/50 outline-none transition-colors bg-transparent"
                               style={{ borderColor: formConfig.styling.theme === 'dark' ? '#3f3f46' : '#e4e4e7', background: formConfig.styling.theme === 'dark' ? '#27272a' : 'transparent' }}>
                                 <option value="">Selecione...</option>
                                 {field.options?.map(o => <option key={o}>{o}</option>)}
                               </select>
                             )}
                           </motion.div>
                         ))}

                         <div className="pt-2">
                           <button className="w-full h-12 rounded-md font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0"
                             style={{ backgroundColor: formConfig.styling.primaryColor, borderRadius: `${formConfig.styling.borderRadius}px` }}
                           >
                             Enviar Respostas
                           </button>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
