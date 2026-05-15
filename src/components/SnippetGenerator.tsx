import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Code, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SnippetGenerator() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [formId, setFormId] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateSnippet = () => {
    return `<!-- Feedback Collector Snippet -->
<script>
(function() {
  const FEEDBACK_ENDPOINT = 'https://bwspaytvqurvxtfwaqte.supabase.co/functions/v1/collect-feedback';
  
  function collectFeedback(formData) {
    const data = {
      experience_rating: parseInt(formData.get('experience_rating')),
      ease_rating: parseInt(formData.get('ease_rating')),
      templates_rating: formData.get('templates_rating') ? parseInt(formData.get('templates_rating')) : null,
      feedback_type: formData.get('feedback_type') || 'general',
      improvement_suggestions: formData.get('improvement_suggestions') || null
    };

    fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('✅ Feedback enviado com sucesso!', result);
        // Opcional: mostrar mensagem de sucesso ao usuário
        if (typeof window.onFeedbackSuccess === 'function') {
          window.onFeedbackSuccess(result);
        }
      } else {
        console.error('❌ Erro ao enviar feedback:', result.error);
      }
    }).catch(error => {
      console.error('❌ Erro de conexão:', error);
      // Opcional: callback de erro
      if (typeof window.onFeedbackError === 'function') {
        window.onFeedbackError(error);
      }
    });
  }

  // Auto-detect forms with feedback data
  document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form[data-feedback="true"]${formId ? `, form#${formId}` : ''}');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const formData = new FormData(this);
        if (formData.get('experience_rating') || formData.get('ease_rating')) {
          collectFeedback(formData);
        }
      });
    });
  });

  // Global function for manual calls
  window.sendFeedback = collectFeedback;
})();
</script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateSnippet());
      setCopied(true);
      toast({
        title: "Snippet copiado!",
        description: "O código foi copiado para sua área de transferência.",
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
            <Code className="h-5 w-5 text-primary" />
            Gerador de Snippet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">URL do Website (Opcional)</Label>
              <Input
                id="website"
                placeholder="https://meusite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formId">ID do Formulário (Opcional)</Label>
              <Input
                id="formId"
                placeholder="feedback-form"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Código Gerado</Label>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <Textarea
              value={generateSnippet()}
              readOnly
              className="font-mono text-sm min-h-[300px] bg-muted/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50 shadow-card">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Instruções de Implementação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                Cole o snippet no seu HTML
              </h4>
              <p className="text-sm text-muted-foreground">
                Adicione o código JavaScript gerado no &lt;head&gt; ou antes do &lt;/body&gt; das páginas onde deseja coletar feedback.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                Configure seu formulário
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Use os campos abaixo no seu formulário HTML:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <code className="block text-sm">
                  &lt;form data-feedback="true"&gt;
                </code>
                <code className="block text-sm ml-4">
                  &lt;input name="experience_rating" type="number" min="1" max="10" required&gt;
                </code>
                <code className="block text-sm ml-4">
                  &lt;input name="ease_rating" type="number" min="1" max="10" required&gt;
                </code>
                <code className="block text-sm ml-4">
                  &lt;input name="templates_rating" type="number" min="1" max="10"&gt;
                </code>
                <code className="block text-sm ml-4">
                  &lt;input name="feedback_type" value="general"&gt;
                </code>
                <code className="block text-sm ml-4">
                  &lt;textarea name="improvement_suggestions"&gt;&lt;/textarea&gt;
                </code>
                <code className="block text-sm">
                  &lt;/form&gt;
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                Campos obrigatórios
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <code>experience_rating</code> - Nota da experiência (1-10)</li>
                <li>• <code>ease_rating</code> - Nota da facilidade (1-10)</li>
                <li>• <code>templates_rating</code> - Nota dos templates (opcional, 1-10)</li>
                <li>• <code>feedback_type</code> - Tipo do feedback (ex: general, product, service)</li>
                <li>• <code>improvement_suggestions</code> - Sugestões de melhoria (opcional)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                Teste a integração
              </h4>
              <p className="text-sm text-muted-foreground">
                Após implementar, envie um feedback teste e verifique se aparece no dashboard em tempo real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}