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
import { 
  Plus, 
  Trash2, 
  Eye, 
  Code, 
  Palette, 
  Settings,
  Copy,
  CheckCircle,
  Star,
  MessageSquare,
  Sliders
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  type: 'rating' | 'text' | 'select' | 'textarea';
  name: string;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
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

const fieldTypes = [
  { value: 'rating', label: 'Avaliação (1-10)', icon: Star },
  { value: 'text', label: 'Texto Curto', icon: MessageSquare },
  { value: 'textarea', label: 'Texto Longo', icon: MessageSquare },
  { value: 'select', label: 'Seleção', icon: Sliders }
];

export function FormBuilder() {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: 'form-' + Date.now(),
    title: 'Formulário de Feedback',
    description: 'Sua opinião é muito importante para nós',
    fields: [
      {
        id: 'experience',
        type: 'rating',
        name: 'experience_rating',
        label: 'Como foi sua experiência geral?',
        required: true,
        description: 'Avalie de 1 a 10'
      },
      {
        id: 'ease',
        type: 'rating', 
        name: 'ease_rating',
        label: 'Quão fácil foi usar nosso produto?',
        required: true,
        description: 'Avalie de 1 a 10'
      }
    ],
    styling: defaultStyling
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const { toast } = useToast();

  const addField = () => {
    const newField: FormField = {
      id: 'field-' + Date.now(),
      type: 'text',
      name: 'new_field',
      label: 'Novo campo',
      required: false,
      placeholder: 'Digite aqui...'
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
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
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
    <form class="feedback-form" data-feedback="true" onsubmit="handleSubmit(event)">
        <div class="form-header">
            <h1 class="form-title">${title}</h1>
            <p class="form-description">${description}</p>
        </div>
        
        ${fields.map(field => {
          if (field.type === 'rating') {
            return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                <div class="rating-input">
                    ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => 
                      `<button type="button" class="rating-button" data-field="${field.name}" data-value="${num}" onclick="selectRating('${field.name}', ${num})">${num}</button>`
                    ).join('')}
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
            // Update visual state
            const buttons = document.querySelectorAll(\`[data-field="\${fieldName}"]\`);
            buttons.forEach((btn, index) => {
                btn.classList.toggle('selected', index < value);
            });
            
            // Update hidden input
            document.querySelector(\`input[name="\${fieldName}"]\`).value = value;
        }
        
        function handleSubmit(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            
            // Send to feedback platform
            const data = {
                experience_rating: parseInt(formData.get('experience_rating')) || null,
                ease_rating: parseInt(formData.get('ease_rating')) || null,
                feedback_type: formData.get('feedback_type') || 'form_builder',
                form_id: '${formConfig.id}'
            };
            
            // Add custom fields
            ${fields.filter(f => !['experience_rating', 'ease_rating'].includes(f.name)).map(field => 
              `if (formData.get('${field.name}')) data['${field.name}'] = formData.get('${field.name}');`
            ).join('\n            ')}
            
            fetch('https://dkiybgkmzgyxqteymlwg.supabase.co/rest/v1/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraXliZ2ttemd5eHF0ZXltbHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTQ2ODgsImV4cCI6MjA3Mzg3MDY4OH0.1hW1OntD3A0XxmMyRBi2WKQ8YZ5STiffzT9tp6ypV6M',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraXliZ2ttemd5eHF0ZXltbHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTQ2ODgsImV4cCI6MjA3Mzg3MDY4OH0.1hW1OntD3A0XxmMyRBi2WKQ8YZ5STiffzT9tp6ypV6M'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    alert('Feedback enviado com sucesso! Obrigado pela sua opinião.');
                    event.target.reset();
                    // Reset rating buttons
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
        description: "O formulário HTML foi copiado para sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Criador de Formulários
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Construtor
              </TabsTrigger>
              <TabsTrigger value="styling" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Estilo
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visualizar
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Código
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              {/* Form Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título do Formulário</Label>
                  <Input
                    value={formConfig.title}
                    onChange={(e) => setFormConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do formulário"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID do Formulário</Label>
                  <Input
                    value={formConfig.id}
                    onChange={(e) => setFormConfig(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="form-id"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formConfig.description}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito do formulário"
                />
              </div>

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
                  {formConfig.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">Campo {index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo do Campo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: any) => updateField(field.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Nome do Campo (técnico)</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="field_name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Texto do Campo</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Como foi sua experiência?"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="Digite aqui..."
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Descrição (opcional)</Label>
                          <Input
                            value={field.description || ''}
                            onChange={(e) => updateField(field.id, { description: e.target.value })}
                            placeholder="Instrução adicional para o campo"
                          />
                        </div>

                        {field.type === 'select' && (
                          <div className="space-y-2">
                            <Label>Opções (uma por linha)</Label>
                            <Textarea
                              value={(field.options || []).join('\n')}
                              onChange={(e) => updateField(field.id, { 
                                options: e.target.value.split('\n').filter(o => o.trim()) 
                              })}
                              placeholder="Excelente&#10;Bom&#10;Regular&#10;Ruim"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          />
                          <Label>Campo obrigatório</Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="styling" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Aparência</h3>
                  
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select
                      value={formConfig.styling.theme}
                      onValueChange={(value: any) => 
                        setFormConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, theme: value } 
                        }))
                      }
                    >
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
                    <Label>Cor Principal</Label>
                    <Input
                      type="color"
                      value={formConfig.styling.primaryColor}
                      onChange={(e) => 
                        setFormConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, primaryColor: e.target.value } 
                        }))
                      }
                      className="h-12 w-20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Layout</h3>
                  
                  <div className="space-y-2">
                    <Label>Borda Arredondada (px)</Label>
                    <Input
                      type="number"
                      value={formConfig.styling.borderRadius}
                      onChange={(e) => 
                        setFormConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, borderRadius: e.target.value } 
                        }))
                      }
                      min="0"
                      max="20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho da Fonte (px)</Label>
                    <Input
                      type="number"
                      value={formConfig.styling.fontSize}
                      onChange={(e) => 
                        setFormConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, fontSize: e.target.value } 
                        }))
                      }
                      min="12"
                      max="24"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="border border-border rounded-lg p-6 bg-muted/20">
                <div dangerouslySetInnerHTML={{ __html: generateFormHTML() }} />
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Código HTML Completo</h3>
                <Button
                  onClick={copyFormCode}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              
              <Textarea
                value={generateFormHTML()}
                readOnly
                className="font-mono text-sm min-h-[400px]"
              />

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 Como usar:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Copie o código HTML completo acima</li>
                  <li>2. Salve como arquivo .html (ex: feedback-form.html)</li>
                  <li>3. Hospede em seu site ou use diretamente</li>
                  <li>4. Os dados serão enviados automaticamente para sua plataforma</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}