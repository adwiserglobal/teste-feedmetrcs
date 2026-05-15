import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { useCustomForms, CustomForm, FormResponse } from "@/hooks/useCustomForms";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function FormResponses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getFormById, getFormResponses } = useCustomForms();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const [formData, responsesData] = await Promise.all([
      getFormById(id),
      getFormResponses(id),
    ]);
    setForm(formData);
    setResponses(responsesData);
    setLoading(false);
  };

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    // Criar cabeçalhos
    const headers = ['Data de Envio', ...form.fields.map(f => f.label)];
    
    // Criar linhas
    const rows = responses.map(response => {
      const row = [new Date(response.submitted_at).toLocaleString('pt-BR')];
      form.fields.forEach(field => {
        row.push(response.response_data[field.name] || '');
      });
      return row;
    });

    // Converter para CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `respostas_${form.title}_${Date.now()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando respostas...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Formulário não encontrado</p>
            <Button onClick={() => navigate('/forms')} className="mt-4">
              Voltar para Formulários
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-muted-foreground mt-1">
              {responses.length} {responses.length === 1 ? 'resposta' : 'respostas'} recebidas
            </p>
          </div>
        </div>
        {responses.length > 0 && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Respostas</CardTitle>
          <CardDescription>
            Visualize todas as respostas enviadas para este formulário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Ainda não há respostas para este formulário
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    {form.fields.map(field => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map(response => (
                    <TableRow key={response.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(response.submitted_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(response.submitted_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      {form.fields.map(field => {
                        const value = response.response_data[field.name];
                        return (
                          <TableCell key={field.id}>
                            {field.type === 'rating' ? (
                              <Badge variant="secondary">{value || '-'}</Badge>
                            ) : (
                              <div className="max-w-xs truncate" title={value}>
                                {value || '-'}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}