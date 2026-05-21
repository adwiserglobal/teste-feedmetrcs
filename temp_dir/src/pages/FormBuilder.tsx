import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, Code, Palette, Settings, Copy, CheckCircle, Star, MessageSquare, Sliders, ArrowLeft, Download, Sparkles, Square, Circle, Hash, Monitor, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
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
  primaryColor: '#3b82f6',
  borderRadius: '8',
  fontSize: '16'
};
const fieldTypes = [{
  value: 'rating',
  label: 'Avaliação',
  icon: Star
}, {
  value: 'text',
  label: 'Texto Curto',
  icon: MessageSquare
}, {
  value: 'textarea',
  label: 'Texto Longo',
  icon: MessageSquare
}, {
  value: 'select',
  label: 'Seleção',
  icon: Sliders
}];
const ratingStyles = [{
  value: 'numbers',
  label: 'Números',
  icon: Hash
}, {
  value: 'stars',
  label: 'Estrelas',
  icon: Star
}, {
  value: 'squares',
  label: 'Quadrados',
  icon: Square
}, {
  value: 'circles',
  label: 'Círculos',
  icon: Circle
}];

const metricTypes = [
  { value: 'none', label: 'Nenhuma métrica específica' },
  { value: 'csat', label: 'CSAT (Customer Satisfaction)' },
  { value: 'nps', label: 'NPS (Net Promoter Score)' },
  { value: 'ces', label: 'CES (Customer Effort Score)' },
  { value: 'experience', label: 'Experiência Geral' },
  { value: 'ease', label: 'Facilidade de Uso' },
  { value: 'service', label: 'Avaliação do Serviço' },
  { value: 'product', label: 'Avaliação do Produto' },
  { value: 'custom', label: 'Personalizado' },
];
const colorPresets = [{
  name: 'Azul',
  value: '#3b82f6'
}, {
  name: 'Verde',
  value: '#22c55e'
}, {
  name: 'Roxo',
  value: '#8b5cf6'
}, {
  name: 'Rosa',
  value: '#ec4899'
}, {
  name: 'Laranja',
  value: '#f97316'
}, {
  name: 'Vermelho',
  value: '#ef4444'
}];
export default function FormBuilderPage() {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: 'form-' + Date.now(),
    title: 'Formulário de Feedback',
    description: 'Sua opinião é muito importante para nós',
    fields: [{
      id: 'experience',
      type: 'rating',
      name: 'experience_rating',
      label: 'Como foi sua experiência geral?',
      required: true,
      description: 'Avalie de 1 a 5',
      ratingScale: 5,
      ratingStyle: 'stars'
    }, {
      id: 'ease',
      type: 'rating',
      name: 'ease_rating',
      label: 'Quão fácil foi usar nosso produto?',
      required: true,
      description: 'Avalie de 1 a 5',
      ratingScale: 5,
      ratingStyle: 'numbers'
    }],
    styling: defaultStyling
  });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFormData, setTestFormData] = useState<Record<string, any>>({});
  const {
    toast
  } = useToast();
  const addField = () => {
    const newField: FormField = {
      id: 'field-' + Date.now(),
      type: 'text',
      name: 'new_field',
      label: 'Novo campo',
      required: false,
      placeholder: 'Digite aqui...',
      ratingScale: 5,
      ratingStyle: 'numbers'
    };
    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
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
      fields: prev.fields.map(field => field.id === fieldId ? {
        ...field,
        ...updates
      } : field)
    }));
  };
  const generateFormHTML = () => {
    const {
      title,
      description,
      fields,
      styling
    } = formConfig;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .feedback-form {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 24px;
            background: ${styling.theme === 'dark' ? '#1f2937' : '#ffffff'};
            color: ${styling.theme === 'dark' ? '#f9fafb' : '#1f2937'};
            border-radius: ${styling.borderRadius}px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .form-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: ${styling.primaryColor};
        }
        
        .form-description {
            font-size: ${styling.fontSize}px;
            opacity: 0.8;
        }
        
        .field-group {
            margin-bottom: 24px;
        }
        
        .field-label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: ${styling.fontSize}px;
        }
        
        .field-description {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 12px;
        }
        
        .rating-input {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .rating-button {
            width: 40px;
            height: 40px;
            border: 2px solid ${styling.primaryColor};
            background: transparent;
            color: ${styling.primaryColor};
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .rating-button.circles {
            border-radius: 50%;
        }
        
        .rating-button.squares {
            border-radius: 2px;
        }
        
        .rating-button.stars {
            font-size: 18px;
        }
        
        .rating-button:hover,
        .rating-button.selected {
            background: ${styling.primaryColor};
            color: white;
        }
        
        .text-input,
        .textarea-input,
        .select-input {
            width: 100%;
            padding: 12px;
            border: 2px solid ${styling.theme === 'dark' ? '#4b5563' : '#e5e7eb'};
            border-radius: ${styling.borderRadius}px;
            font-size: ${styling.fontSize}px;
            background: ${styling.theme === 'dark' ? '#374151' : '#ffffff'};
            color: ${styling.theme === 'dark' ? '#f9fafb' : '#1f2937'};
            transition: border-color 0.2s;
        }
        
        .text-input:focus,
        .textarea-input:focus,
        .select-input:focus {
            outline: none;
            border-color: ${styling.primaryColor};
        }
        
        .textarea-input {
            min-height: 100px;
            resize: vertical;
        }
        
        .submit-button {
            width: 100%;
            padding: 16px;
            background: ${styling.primaryColor};
            color: white;
            border: none;
            border-radius: ${styling.borderRadius}px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        .submit-button:hover {
            opacity: 0.9;
        }
        
        .required-mark {
            color: #ef4444;
        }
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
                    ${Array.from({
          length: scale
        }, (_, i) => i + 1).map(num => {
          let buttonContent = num.toString();
          if (style === 'stars') buttonContent = '⭐';else if (style === 'squares') buttonContent = '■';else if (style === 'circles') buttonContent = '●';
          return `<button type="button" class="rating-button ${style}" data-field="${field.name}" data-value="${num}" onclick="selectRating('${field.name}', ${num})">${buttonContent}</button>`;
        }).join('')}
                </div>
                <input type="hidden" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>`;
      } else if (field.type === 'textarea') {
        return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <textarea 
                    class="textarea-input" 
                    name="${field.name}" 
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                ></textarea>
            </div>`;
      } else if (field.type === 'select') {
        return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <select class="select-input" name="${field.name}" ${field.required ? 'required' : ''}>
                    <option value="">Selecione uma opção</option>
                    ${(field.options || []).map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            </div>`;
      } else {
        return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <input 
                    type="text" 
                    class="text-input" 
                    name="${field.name}" 
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                >
            </div>`;
      }
    }).join('')}
        
        <button type="submit" class="submit-button">Enviar Feedback</button>
    </form>

    <script>
        function selectRating(fieldName, value) {
            const buttons = document.querySelectorAll(\`[data-field="\${fieldName}"]\`);
            buttons.forEach((btn, index) => {
                btn.classList.toggle('selected', index < value);
            });
            document.querySelector(\`input[name="\${fieldName}"]\`).value = value;
        }
        
        function handleSubmit(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            
            const data = {
                experience_rating: parseInt(formData.get('experience_rating')) || null,
                ease_rating: parseInt(formData.get('ease_rating')) || null,
                feedback_type: 'form_builder',
                form_id: '${formConfig.id}'
            };
            
            ${fields.filter(f => !['experience_rating', 'ease_rating'].includes(f.name)).map(field => `if (formData.get('${field.name}')) data['${field.name}'] = formData.get('${field.name}');`).join('\n            ')}
            
            fetch('https://dkiybgkmzgyxqteymlwg.supabase.co/functions/v1/collect-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
      toast({
        title: "Código copiado!",
        description: "O formulário HTML foi copiado para sua área de transferência."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };
  const downloadFormHTML = () => {
    const htmlContent = generateFormHTML();
    const blob = new Blob([htmlContent], {
      type: 'text/html'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formConfig.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download iniciado!",
      description: "O arquivo HTML foi baixado."
    });
  };
  const handlePreviewRating = (fieldName: string, value: number) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };
  const handleTestRating = (fieldName: string, value: number) => {
    setTestFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };
  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simular envio sem salvar dados reais
    toast({
      title: "✅ Teste realizado com sucesso!",
      description: "Este é apenas um teste - os dados não foram salvos."
    });

    // Limpar formulário e fechar modal
    setTestFormData({});
    setShowTestModal(false);
  };
  const renderPreviewField = (field: FormField) => {
    if (field.type === 'rating') {
      const scale = field.ratingScale || 5;
      const style = field.ratingStyle || 'numbers';
      const renderRatingContent = (num: number) => {
        if (style === 'stars') return '⭐';
        if (style === 'squares') return '■';
        if (style === 'circles') return '●';
        return num;
      };
      return <div className="space-y-3">
          <label className="text-sm font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <div className="flex gap-2 flex-wrap">
            {Array.from({
            length: scale
          }, (_, i) => i + 1).map(num => <Button key={num} variant={previewData[field.name] >= num ? "default" : "outline"} size="sm" className={`w-8 h-8 p-0 ${style === 'circles' ? 'rounded-full' : style === 'squares' ? 'rounded-sm' : ''}`} onClick={() => handlePreviewRating(field.name, num)} style={{
            backgroundColor: previewData[field.name] >= num ? formConfig.styling.primaryColor : 'transparent',
            borderColor: formConfig.styling.primaryColor,
            color: previewData[field.name] >= num ? 'white' : formConfig.styling.primaryColor
          }}>
                {renderRatingContent(num)}
              </Button>)}
          </div>
        </div>;
    } else if (field.type === 'textarea') {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Textarea placeholder={field.placeholder} />
        </div>;
    } else if (field.type === 'select') {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>;
    } else {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Input placeholder={field.placeholder} />
        </div>;
    }
  };
  const renderTestField = (field: FormField) => {
    if (field.type === 'rating') {
      const scale = field.ratingScale || 5;
      const style = field.ratingStyle || 'numbers';
      const renderRatingContent = (num: number) => {
        if (style === 'stars') return '⭐';
        if (style === 'squares') return '■';
        if (style === 'circles') return '●';
        return num;
      };
      return <div className="space-y-3">
          <label className="text-sm font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <div className="flex gap-2 flex-wrap">
            {Array.from({
            length: scale
          }, (_, i) => i + 1).map(num => <Button key={num} type="button" variant={testFormData[field.name] >= num ? "default" : "outline"} size="sm" className={`w-8 h-8 p-0 ${style === 'circles' ? 'rounded-full' : style === 'squares' ? 'rounded-sm' : ''}`} onClick={() => handleTestRating(field.name, num)} style={{
            backgroundColor: testFormData[field.name] >= num ? formConfig.styling.primaryColor : 'transparent',
            borderColor: formConfig.styling.primaryColor,
            color: testFormData[field.name] >= num ? 'white' : formConfig.styling.primaryColor
          }}>
                {renderRatingContent(num)}
              </Button>)}
          </div>
        </div>;
    } else if (field.type === 'textarea') {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Textarea placeholder={field.placeholder} value={testFormData[field.name] || ''} onChange={e => setTestFormData(prev => ({
          ...prev,
          [field.name]: e.target.value
        }))} required={field.required} />
        </div>;
    } else if (field.type === 'select') {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Select value={testFormData[field.name] || ''} onValueChange={value => setTestFormData(prev => ({
          ...prev,
          [field.name]: value
        }))} required={field.required}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>;
    } else {
      return <div className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          <Input placeholder={field.placeholder} value={testFormData[field.name] || ''} onChange={e => setTestFormData(prev => ({
          ...prev,
          [field.name]: e.target.value
        }))} required={field.required} />
        </div>;
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Feedform Builder</h1>
                  <p className="text-sm text-muted-foreground">Powered by Feedmetrics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={downloadFormHTML} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download HTML
              </Button>
              <Button onClick={copyFormCode} size="sm" className="flex items-center gap-2">
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Builder */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configurações do Formulário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="builder">Campos</TabsTrigger>
                    <TabsTrigger value="styling">Estilo</TabsTrigger>
                    <TabsTrigger value="test">Teste</TabsTrigger>
                    <TabsTrigger value="code">Código</TabsTrigger>
                  </TabsList>

                  <TabsContent value="builder" className="space-y-6">
                    {/* Form Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título do Formulário</Label>
                        <Input value={formConfig.title} onChange={e => setFormConfig(prev => ({
                        ...prev,
                        title: e.target.value
                      }))} placeholder="Nome do formulário" />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={formConfig.description} onChange={e => setFormConfig(prev => ({
                        ...prev,
                        description: e.target.value
                      }))} placeholder="Descreva o propósito do formulário" />
                      </div>
                    </div>

                    <Separator />

                    {/* Fields */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Campos do Formulário</h3>
                        <Button onClick={addField} size="sm" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Campo
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formConfig.fields.map((field, index) => <Card key={field.id} className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="outline">Campo {index + 1}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => removeField(field.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Tipo do Campo</Label>
                                  <Select value={field.type} onValueChange={(value: any) => updateField(field.id, {
                                type: value
                              })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map(type => <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-2">
                                            <type.icon className="h-4 w-4" />
                                            {type.label}
                                          </div>
                                        </SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Nome do Campo</Label>
                                  <Input value={field.name} onChange={e => updateField(field.id, {
                                name: e.target.value
                              })} placeholder="field_name" />
                                </div>
                              </div>

                              {/* Metric Type Selector */}
                              <div className="space-y-2">
                                <Label>O que este campo vai mensurar?</Label>
                                <Select 
                                  value={field.metricType || 'none'} 
                                  onValueChange={(value: any) => updateField(field.id, { 
                                    metricType: value,
                                    customMetricName: value === 'custom' ? field.customMetricName : undefined
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma métrica" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {metricTypes.map(metric => (
                                      <SelectItem key={metric.value} value={metric.value}>
                                        {metric.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Custom Metric Name */}
                              {field.metricType === 'custom' && (
                                <div className="space-y-2">
                                  <Label>Nome da Métrica Personalizada</Label>
                                  <Input 
                                    value={field.customMetricName || ''} 
                                    onChange={e => updateField(field.id, { 
                                      customMetricName: e.target.value 
                                    })} 
                                    placeholder="Ex: Qualidade do Atendimento" 
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Este nome aparecerá no gráfico de métricas
                                  </p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>Rótulo</Label>
                                <Input value={field.label} onChange={e => updateField(field.id, {
                              label: e.target.value
                            })} placeholder="Texto do rótulo" />
                              </div>

                              <div className="space-y-2">
                                <Label>Descrição (opcional)</Label>
                                <Input value={field.description || ''} onChange={e => updateField(field.id, {
                              description: e.target.value
                            })} placeholder="Texto de ajuda" />
                              </div>

                              {field.type !== 'rating' && <div className="space-y-2">
                                  <Label>Placeholder</Label>
                                  <Input value={field.placeholder || ''} onChange={e => updateField(field.id, {
                              placeholder: e.target.value
                            })} placeholder="Texto do placeholder" />
                                </div>}

                              {field.type === 'select' && <div className="space-y-2">
                                  <Label>Opções (uma por linha)</Label>
                                  <Textarea value={(field.options || []).join('\n')} onChange={e => updateField(field.id, {
                              options: e.target.value.split('\n').filter(opt => opt.trim())
                            })} placeholder="Opção 1&#10;Opção 2&#10;Opção 3" />
                                </div>}

                              {field.type === 'rating' && <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Escala de Avaliação</Label>
                                      <Select value={field.ratingScale?.toString() || '5'} onValueChange={value => updateField(field.id, {
                                  ratingScale: parseInt(value),
                                  description: `Avalie de 1 a ${value}`
                                })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="3">1 a 3</SelectItem>
                                          <SelectItem value="5">1 a 5</SelectItem>
                                          <SelectItem value="7">1 a 7</SelectItem>
                                          <SelectItem value="10">1 a 10</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Estilo Visual</Label>
                                      <Select value={field.ratingStyle || 'numbers'} onValueChange={(value: any) => updateField(field.id, {
                                  ratingStyle: value
                                })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ratingStyles.map(style => <SelectItem key={style.value} value={style.value}>
                                              <div className="flex items-center gap-2">
                                                <style.icon className="h-4 w-4" />
                                                {style.label}
                                              </div>
                                            </SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>}

                              <div className="flex items-center space-x-2">
                                <Switch checked={field.required} onCheckedChange={checked => updateField(field.id, {
                              required: checked
                            })} />
                                <Label>Campo obrigatório</Label>
                              </div>
                            </div>
                          </Card>)}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="styling" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tema</Label>
                        <Select value={formConfig.styling.theme} onValueChange={(value: any) => setFormConfig(prev => ({
                        ...prev,
                        styling: {
                          ...prev.styling,
                          theme: value
                        }
                      }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Escuro</SelectItem>
                            <SelectItem value="auto">Automático</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Cor Primária</Label>
                        <div className="flex gap-2 flex-wrap">
                          {colorPresets.map(color => <Button key={color.value} variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setFormConfig(prev => ({
                          ...prev,
                          styling: {
                            ...prev.styling,
                            primaryColor: color.value
                          }
                        }))}>
                              <div className="w-4 h-4 rounded-full" style={{
                            backgroundColor: color.value
                          }} />
                              {color.name}
                            </Button>)}
                        </div>
                        <Input type="color" value={formConfig.styling.primaryColor} onChange={e => setFormConfig(prev => ({
                        ...prev,
                        styling: {
                          ...prev.styling,
                          primaryColor: e.target.value
                        }
                      }))} className="w-full h-10" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Border Radius (px)</Label>
                          <Input type="number" value={formConfig.styling.borderRadius} onChange={e => setFormConfig(prev => ({
                          ...prev,
                          styling: {
                            ...prev.styling,
                            borderRadius: e.target.value
                          }
                        }))} placeholder="8" />
                        </div>
                        <div className="space-y-2">
                          <Label>Tamanho da Fonte (px)</Label>
                          <Input type="number" value={formConfig.styling.fontSize} onChange={e => setFormConfig(prev => ({
                          ...prev,
                          styling: {
                            ...prev.styling,
                            fontSize: e.target.value
                          }
                        }))} placeholder="16" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Preview em Site Mockup</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Veja como seu formulário aparece em um site real com o card de feedback lateral.
                      </p>
                      
                      {/* Website Mockup */}
                      <div className="relative border-2 border-border rounded-lg overflow-hidden bg-white">
                        {/* Mockup Browser Header */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b">
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="flex-1 text-center text-sm text-gray-600">
                            https://meusite.com
                          </div>
                        </div>
                        
                        {/* Mockup Content */}
                        <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                          {/* Sample website content */}
                          <div className="p-8">
                            <div className="max-w-2xl mx-auto">
                              <div className="h-8 bg-gray-300 rounded mb-4"></div>
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="h-24 bg-gray-200 rounded"></div>
                                <div className="h-24 bg-gray-200 rounded"></div>
                              </div>
                              
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                            </div>
                          </div>
                          
                          {/* Floating Feedback Card */}
                          <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">Feedback</h4>
                                <p className="text-xs text-gray-600">Sua opinião é importante</p>
                              </div>
                            </div>
                            <Button size="sm" className="w-full text-xs" style={{
                            backgroundColor: formConfig.styling.primaryColor
                          }} onClick={() => setShowTestModal(true)}>
                              Deixar Feedback
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <strong>💡 Dica:</strong> O card de feedback aparece como um elemento flutuante no canto da página, 
                        facilitando o acesso dos usuários ao formulário sem interromper a navegação.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Código HTML Completo</Label>
                      <Textarea value={generateFormHTML()} readOnly className="font-mono text-xs h-64" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={copyFormCode} className="flex items-center gap-2">
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copiado!' : 'Copiar Código'}
                      </Button>
                      <Button onClick={downloadFormHTML} variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download HTML
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Preview em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6" style={{
                backgroundColor: formConfig.styling.theme === 'dark' ? '#1f2937' : '#ffffff',
                color: formConfig.styling.theme === 'dark' ? '#f9fafb' : '#1f2937'
              }}>
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2" style={{
                    color: formConfig.styling.primaryColor
                  }}>
                      {formConfig.title}
                    </h1>
                    <p className="opacity-80" style={{
                    fontSize: `${formConfig.styling.fontSize}px`
                  }}>
                      {formConfig.description}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {formConfig.fields.map(field => <div key={field.id}>
                        {renderPreviewField(field)}
                      </div>)}

                    <Button className="w-full" style={{
                    backgroundColor: formConfig.styling.primaryColor,
                    borderRadius: `${formConfig.styling.borderRadius}px`
                  }}>
                      Enviar Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Teste Interativo */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Teste do Formulário
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleTestSubmit} className="space-y-6">
            <div className="border rounded-lg p-6" style={{
            backgroundColor: formConfig.styling.theme === 'dark' ? '#1f2937' : '#ffffff',
            color: formConfig.styling.theme === 'dark' ? '#f9fafb' : '#1f2937'
          }}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2" style={{
                color: formConfig.styling.primaryColor
              }}>
                  {formConfig.title}
                </h1>
                <p className="opacity-80" style={{
                fontSize: `${formConfig.styling.fontSize}px`
              }}>
                  {formConfig.description}
                </p>
              </div>

              <div className="space-y-6">
                {formConfig.fields.map(field => <div key={field.id}>
                    {renderTestField(field)}
                  </div>)}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" style={{
              backgroundColor: formConfig.styling.primaryColor,
              borderRadius: `${formConfig.styling.borderRadius}px`
            }}>
                🧪 Enviar Teste
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowTestModal(false)}>
                Cancelar
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <strong>💡 Modo Teste:</strong> Este formulário está em modo de teste. 
              Os dados não serão salvos no banco de dados real.
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
}