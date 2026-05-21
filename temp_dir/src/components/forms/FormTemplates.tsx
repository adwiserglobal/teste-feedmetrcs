import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  ShoppingCart, 
  Headphones, 
  Users, 
  Briefcase,
  Download,
  Eye,
  Copy,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'service' | 'product' | 'support' | 'general';
  icon: any;
  fields: Array<{
    name: string;
    label: string;
    type: 'rating' | 'text' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
  }>;
  styling: {
    primaryColor: string;
    theme: 'light' | 'dark';
  };
}

const templates: FormTemplate[] = [
  {
    id: 'ecommerce-satisfaction',
    name: 'E-commerce - Satisfação',
    description: 'Perfeito para lojas online avaliarem a experiência de compra',
    category: 'ecommerce',
    icon: ShoppingCart,
    styling: { primaryColor: '#10b981', theme: 'light' },
    fields: [
      { name: 'experience_rating', label: 'Como foi sua experiência de compra?', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Quão fácil foi navegar no site?', type: 'rating', required: true },
      { name: 'product_quality', label: 'Qualidade do produto (1-10)', type: 'rating', required: false },
      { name: 'delivery_rating', label: 'Avalie a entrega (1-10)', type: 'rating', required: false },
      { name: 'feedback_type', label: 'Tipo', type: 'select', required: false, options: ['Compra', 'Navegação', 'Produto', 'Entrega'] },
      { name: 'improvement_suggestions', label: 'Sugestões de melhoria', type: 'textarea', required: false }
    ]
  },
  {
    id: 'customer-service',
    name: 'Atendimento ao Cliente',
    description: 'Avalie a qualidade do suporte e atendimento',
    category: 'service',
    icon: Headphones,
    styling: { primaryColor: '#3b82f6', theme: 'light' },
    fields: [
      { name: 'experience_rating', label: 'Como foi o atendimento?', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Foi fácil resolver seu problema?', type: 'rating', required: true },
      { name: 'response_time', label: 'Velocidade de resposta (1-10)', type: 'rating', required: false },
      { name: 'staff_friendliness', label: 'Cordialidade da equipe (1-10)', type: 'rating', required: false },
      { name: 'contact_method', label: 'Como entrou em contato?', type: 'select', required: false, options: ['Chat', 'Email', 'Telefone', 'WhatsApp'] },
      { name: 'improvement_suggestions', label: 'Como podemos melhorar?', type: 'textarea', required: false }
    ]
  },
  {
    id: 'product-feedback',
    name: 'Feedback de Produto',
    description: 'Colete opiniões sobre recursos e funcionalidades',
    category: 'product',
    icon: Star,
    styling: { primaryColor: '#8b5cf6', theme: 'light' },
    fields: [
      { name: 'experience_rating', label: 'Experiência geral com o produto', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Facilidade de uso', type: 'rating', required: true },
      { name: 'feature_rating', label: 'Avalie os recursos (1-10)', type: 'rating', required: false },
      { name: 'design_rating', label: 'Avalie o design/interface (1-10)', type: 'rating', required: false },
      { name: 'product_category', label: 'Categoria do produto', type: 'select', required: false, options: ['Software', 'Hardware', 'Serviço', 'App Mobile'] },
      { name: 'improvement_suggestions', label: 'Que recursos gostaria de ver?', type: 'textarea', required: false }
    ]
  },
  {
    id: 'event-feedback',
    name: 'Feedback de Evento',
    description: 'Perfeito para avaliar workshops, webinars e eventos',
    category: 'general',
    icon: Users,
    styling: { primaryColor: '#f59e0b', theme: 'light' },
    fields: [
      { name: 'experience_rating', label: 'Como foi sua experiência no evento?', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Foi fácil se inscrever/participar?', type: 'rating', required: true },
      { name: 'content_quality', label: 'Qualidade do conteúdo (1-10)', type: 'rating', required: false },
      { name: 'speaker_rating', label: 'Avalie os palestrantes (1-10)', type: 'rating', required: false },
      { name: 'event_type', label: 'Tipo de evento', type: 'select', required: false, options: ['Workshop', 'Webinar', 'Palestra', 'Curso', 'Conferência'] },
      { name: 'improvement_suggestions', label: 'Sugestões para próximos eventos', type: 'textarea', required: false }
    ]
  },
  {
    id: 'saas-onboarding',
    name: 'SaaS - Onboarding',
    description: 'Avalie o processo de integração de novos usuários',
    category: 'product',
    icon: Briefcase,
    styling: { primaryColor: '#ef4444', theme: 'dark' },
    fields: [
      { name: 'experience_rating', label: 'Como foi o processo de cadastro?', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Facilidade para começar a usar', type: 'rating', required: true },
      { name: 'tutorial_rating', label: 'Clareza dos tutoriais (1-10)', type: 'rating', required: false },
      { name: 'setup_time', label: 'Tempo de configuração foi adequado?', type: 'rating', required: false },
      { name: 'user_role', label: 'Seu perfil de usuário', type: 'select', required: false, options: ['Desenvolvedor', 'Designer', 'Gerente', 'Analista', 'Outro'] },
      { name: 'improvement_suggestions', label: 'Como simplificar o onboarding?', type: 'textarea', required: false }
    ]
  },
  {
    id: 'restaurant-experience',
    name: 'Experiência em Restaurante',
    description: 'Avalie comida, serviço e ambiente',
    category: 'service',
    icon: Star,
    styling: { primaryColor: '#dc2626', theme: 'light' },
    fields: [
      { name: 'experience_rating', label: 'Experiência geral', type: 'rating', required: true },
      { name: 'ease_rating', label: 'Facilidade para fazer pedido/reserva', type: 'rating', required: true },
      { name: 'food_quality', label: 'Qualidade da comida (1-10)', type: 'rating', required: false },
      { name: 'service_rating', label: 'Qualidade do atendimento (1-10)', type: 'rating', required: false },
      { name: 'visit_reason', label: 'Motivo da visita', type: 'select', required: false, options: ['Jantar casual', 'Celebração', 'Negócios', 'Encontro', 'Família'] },
      { name: 'improvement_suggestions', label: 'Comentários adicionais', type: 'textarea', required: false }
    ]
  }
];

export function FormTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'Todos', icon: Star },
    { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
    { id: 'service', name: 'Serviços', icon: Headphones },
    { id: 'product', name: 'Produtos', icon: Briefcase },
    { id: 'general', name: 'Geral', icon: Users }
  ];

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const generateTemplateHTML = (template: FormTemplate) => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${template.styling.theme === 'dark' ? '#0f172a' : '#f8fafc'};
            padding: 20px;
            min-height: 100vh;
        }
        
        .feedback-form {
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background: ${template.styling.theme === 'dark' ? '#1e293b' : '#ffffff'};
            color: ${template.styling.theme === 'dark' ? '#f1f5f9' : '#0f172a'};
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .form-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 12px;
            background: linear-gradient(135deg, ${template.styling.primaryColor}, ${template.styling.primaryColor}cc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .form-description {
            font-size: 16px;
            opacity: 0.8;
            line-height: 1.6;
        }
        
        .field-group {
            margin-bottom: 32px;
        }
        
        .field-label {
            display: block;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .rating-input {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }
        
        .rating-button {
            width: 48px;
            height: 48px;
            border: 2px solid ${template.styling.primaryColor};
            background: ${template.styling.theme === 'dark' ? '#334155' : 'transparent'};
            color: ${template.styling.primaryColor};
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 16px;
        }
        
        .rating-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -8px ${template.styling.primaryColor}40;
        }
        
        .rating-button.selected {
            background: ${template.styling.primaryColor};
            color: white;
            transform: scale(1.1);
        }
        
        .text-input,
        .textarea-input,
        .select-input {
            width: 100%;
            padding: 16px;
            border: 2px solid ${template.styling.theme === 'dark' ? '#475569' : '#e2e8f0'};
            border-radius: 12px;
            font-size: 16px;
            background: ${template.styling.theme === 'dark' ? '#475569' : '#ffffff'};
            color: ${template.styling.theme === 'dark' ? '#f1f5f9' : '#0f172a'};
            transition: all 0.3s;
        }
        
        .text-input:focus,
        .textarea-input:focus,
        .select-input:focus {
            outline: none;
            border-color: ${template.styling.primaryColor};
            box-shadow: 0 0 0 3px ${template.styling.primaryColor}20;
        }
        
        .textarea-input {
            min-height: 120px;
            resize: vertical;
        }
        
        .submit-button {
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, ${template.styling.primaryColor}, ${template.styling.primaryColor}dd);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 8px 25px -8px ${template.styling.primaryColor}60;
        }
        
        .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px -8px ${template.styling.primaryColor}80;
        }
        
        .required-mark {
            color: #ef4444;
        }
        
        .rating-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            opacity: 0.6;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <form class="feedback-form" data-feedback="true" onsubmit="handleSubmit(event)">
        <div class="form-header">
            <h1 class="form-title">${template.name}</h1>
            <p class="form-description">${template.description}</p>
        </div>
        
        ${template.fields.map(field => {
          if (field.type === 'rating') {
            return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                <div class="rating-input">
                    ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => 
                      `<button type="button" class="rating-button" data-field="${field.name}" data-value="${num}" onclick="selectRating('${field.name}', ${num})">${num}</button>`
                    ).join('')}
                </div>
                <div class="rating-labels">
                    <span>Ruim</span>
                    <span>Excelente</span>
                </div>
                <input type="hidden" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>`;
          } else if (field.type === 'textarea') {
            return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
                <textarea 
                    class="textarea-input" 
                    name="${field.name}" 
                    placeholder="Compartilhe seus comentários..."
                    ${field.required ? 'required' : ''}
                ></textarea>
            </div>`;
          } else if (field.type === 'select') {
            return `
            <div class="field-group">
                <label class="field-label">
                    ${field.label} ${field.required ? '<span class="required-mark">*</span>' : ''}
                </label>
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
                <input 
                    type="text" 
                    class="text-input" 
                    name="${field.name}" 
                    placeholder="Digite sua resposta..."
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
                feedback_type: formData.get('feedback_type') || '${template.category}',
                form_template: '${template.id}'
            };
            
            // Add all other fields
            ${template.fields.filter(f => !['experience_rating', 'ease_rating'].includes(f.name)).map(field => 
              `if (formData.get('${field.name}')) data['custom_${field.name}'] = formData.get('${field.name}');`
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
                    alert('✅ Feedback enviado com sucesso! Obrigado pela sua opinião.');
                    event.target.reset();
                    document.querySelectorAll('.rating-button').forEach(btn => btn.classList.remove('selected'));
                } else {
                    alert('❌ Erro ao enviar feedback. Tente novamente.');
                }
            }).catch(() => {
                alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
            });
        }
    </script>
</body>
</html>`;
  };

  const copyTemplate = async (template: FormTemplate) => {
    try {
      await navigator.clipboard.writeText(generateTemplateHTML(template));
      setCopied(true);
      toast({
        title: "Template copiado!",
        description: `O formulário "${template.name}" foi copiado para sua área de transferência.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
        <CardHeader className="border-b border-border/50">
          <CardTitle>Templates de Formulário</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-5">
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: template.styling.primaryColor + '20' }}
                >
                  <template.icon 
                    className="h-6 w-6" 
                    style={{ color: template.styling.primaryColor }}
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {template.fields.length} campos
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Campos incluídos:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.slice(0, 4).map(field => (
                      <Badge key={field.name} variant="secondary" className="text-xs">
                        {field.label.length > 20 ? field.label.slice(0, 20) + '...' : field.label}
                      </Badge>
                    ))}
                    {template.fields.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.fields.length - 4} mais
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => copyTemplate(template)}
                    style={{ backgroundColor: template.styling.primaryColor }}
                  >
                    {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Usar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Preview: {selectedTemplate.name}</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyTemplate(selectedTemplate)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Copiar Código
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTemplate(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div 
                className="border rounded-lg p-6"
                dangerouslySetInnerHTML={{ __html: generateTemplateHTML(selectedTemplate) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}