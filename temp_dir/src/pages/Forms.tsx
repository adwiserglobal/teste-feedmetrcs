import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  BarChart3, 
  Search,
  ExternalLink,
  PowerOff,
  Power,
  QrCode,
  Download
} from "lucide-react";
import { useCustomForms } from "@/hooks/useCustomForms";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Forms() {
  const { forms, loading, deleteForm, updateForm } = useCustomForms();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link do formulário foi copiado para a área de transferência.",
    });
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    await updateForm(formId, { is_active: !currentStatus });
  };

  const handleDelete = async () => {
    if (selectedFormId) {
      await deleteForm(selectedFormId);
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Formulários</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie formulários customizados para coleta de feedback
          </p>
        </div>
        <Button onClick={() => navigate("/forms/create")} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Criar Formulário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar formulários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando formulários...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Nenhum formulário encontrado" : "Você ainda não criou nenhum formulário"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/forms/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Formulário
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredForms.map((form) => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{form.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {form.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{form.fields.length} campos</span>
                      <span>{form.total_responses} respostas</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado {formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/forms/${form.id}/responses`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Respostas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/form/${form.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyFormLink(form.id)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFormId(form.id);
                          setQrCodeDialogOpen(true);
                        }}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Code
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/forms/edit/${form.id}`)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFormStatus(form.id, form.is_active)}
                        className="flex-1"
                      >
                        {form.is_active ? (
                          <><PowerOff className="h-4 w-4 mr-1" />Desativar</>
                        ) : (
                          <><Power className="h-4 w-4 mr-1" />Ativar</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFormId(form.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as respostas associadas a este formulário também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code para Impressão
            </DialogTitle>
            <DialogDescription>
              Escaneie para responder o formulário
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              {selectedFormId && (
                <iframe
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/form/${selectedFormId}`)}`}
                  className="w-[300px] h-[300px] border-none"
                  title="QR Code"
                />
              )}
            </div>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/form/${selectedFormId}`)}`;
                link.download = `qrcode-formulario-${selectedFormId}.png`;
                link.click();
              }}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar QR Code (Alta Resolução)
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <span>💡</span>
                <span className="font-medium">Dicas para Impressão:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use papel de qualidade</li>
                <li>Imprima em tamanho mínimo de 5x5cm</li>
                <li>Evite dobras no QR Code</li>
                <li>Teste antes de imprimir em larga escala</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}