import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ArrowLeft, Save, Eye, QrCode, Download } from "lucide-react";
import { useCustomForms, FormField } from "@/hooks/useCustomForms";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const fieldTypes = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Seleção' },
  { value: 'rating', label: 'Avaliação' },
];

const ratingStyles = [
  { value: 'numbers', label: 'Números' },
  { value: 'stars', label: 'Estrelas' },
  { value: 'squares', label: 'Quadrados' },
  { value: 'circles', label: 'Círculos' },
];

const colorPresets = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Vermelho', value: '#ef4444' },
];

export default function FormCreate() {
  const navigate = useNavigate();
  const { createForm, updateForm, getFormById } = useCustomForms();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("Novo Formulário");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [styling, setStyling] = useState({
    theme: 'auto' as 'light' | 'dark' | 'auto',
    primaryColor: '#3b82f6',
    borderRadius: '8',
    fontSize: '16'
  });
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      name: `field_${fields.length + 1}`,
      label: 'Novo Campo',
      required: false,
      placeholder: '',
      description: '',
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título ao formulário.",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Adicione campos",
        description: "O formulário precisa ter pelo menos um campo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (isEditing && id) {
        await updateForm(id, {
          title,
          description,
          fields,
          styling,
          is_active: isActive,
        });
      } else {
        await createForm({
          title,
          description,
          fields,
          styling,
          is_active: isActive,
        });
      }
      navigate('/forms');
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Editar' : 'Criar'} Formulário</h1>
            <p className="text-muted-foreground mt-1">
              Configure seu formulário customizado
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/form/preview`, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Formulário *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pesquisa de Satisfação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito do formulário..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status do Formulário</Label>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? 'Formulário ativo e recebendo respostas' : 'Formulário desativado'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campos do Formulário</CardTitle>
                  <CardDescription>Configure os campos que deseja coletar</CardDescription>
                </div>
                <Button onClick={addField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">Nenhum campo adicionado ainda</p>
                  <Button onClick={addField} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Campo
                  </Button>
                </div>
              ) : (
                fields.map((field, index) => (
                  <Card key={field.id} className="border-2">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold">Campo {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tipo de Campo</Label>
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
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Nome do Campo (interno)</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="campo_nome"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Rótulo (Label)</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Como você avalia nosso serviço?"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Input
                          value={field.description || ''}
                          onChange={(e) => updateField(field.id, { description: e.target.value })}
                          placeholder="Informação adicional sobre este campo"
                        />
                      </div>

                      {field.type !== 'rating' && field.type !== 'select' && (
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="Digite aqui..."
                          />
                        </div>
                      )}

                      {field.type === 'rating' && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Escala (1 a X)</Label>
                              <Select
                                value={String(field.ratingScale || 5)}
                                onValueChange={(value) => updateField(field.id, { ratingScale: Number(value) })}
                              >
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
                              <Select
                                value={field.ratingStyle || 'numbers'}
                                onValueChange={(value: any) => updateField(field.id, { ratingStyle: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ratingStyles.map(style => (
                                    <SelectItem key={style.value} value={style.value}>
                                      {style.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}

                      {field.type === 'select' && (
                        <div className="space-y-2">
                          <Label>Opções (uma por linha)</Label>
                          <Textarea
                            value={(field.options || []).join('\n')}
                            onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                            placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                            rows={4}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                        />
                        <Label className="cursor-pointer">Campo obrigatório</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estilo Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={styling.theme}
                  onValueChange={(value: any) => setStyling({ ...styling, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor Principal</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setStyling({ ...styling, primaryColor: color.value })}
                      className={`h-10 rounded-md border-2 transition-all ${
                        styling.primaryColor === color.value ? 'border-foreground scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={styling.primaryColor}
                  onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Arredondamento (px)</Label>
                <Input
                  type="number"
                  value={styling.borderRadius}
                  onChange={(e) => setStyling({ ...styling, borderRadius: e.target.value })}
                  min="0"
                  max="24"
                />
              </div>

              <div className="space-y-2">
                <Label>Tamanho da Fonte (px)</Label>
                <Input
                  type="number"
                  value={styling.fontSize}
                  onChange={(e) => setStyling({ ...styling, fontSize: e.target.value })}
                  min="12"
                  max="24"
                />
              </div>
            </CardContent>
          </Card>

          {id && (
            <Card className="backdrop-blur-sm bg-card/95 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  QR Code para Impressão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                  <iframe
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/form/${id}`)}`}
                    className="w-[300px] h-[300px] border-none"
                    title="QR Code"
                  />
                  <p className="text-sm text-center mt-4 font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-center text-gray-600 mt-2">Escaneie para responder</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    window.open(
                      `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/public-form/${id}`)}`,
                      '_blank'
                    );
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code (Alta Resolução)
                </Button>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">💡 Dicas para Impressão</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Use papel de qualidade</li>
                    <li>• Tamanho recomendado: 10x10cm ou maior</li>
                    <li>• Teste antes de imprimir em quantidade</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!id && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Salve o formulário primeiro para gerar o QR Code
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}