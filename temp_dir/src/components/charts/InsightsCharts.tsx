import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";

interface Feedback {
  id: string;
  experience_rating: number;
  ease_rating: number;
  templates_rating?: number;
  feedback_type: string;
  created_at: string;
}

interface InsightsChartsProps {
  feedbacks: Feedback[];
}

export function InsightsCharts({ feedbacks }: InsightsChartsProps) {
  const insights = useMemo(() => {
    if (feedbacks.length === 0) {
      return {
        distributionData: [],
        sentimentData: [],
        trendsData: [],
        performanceData: [],
        totalFeedbacks: 0,
        averageScore: 0,
        trend: 0
      };
    }

    // Distribuição de ratings
    const experienceDistribution = Array.from({ length: 10 }, (_, i) => {
      const rating = i + 1;
      const count = feedbacks.filter(f => Math.round(f.experience_rating) === rating).length;
      return {
        rating: rating.toString(),
        experiencia: count,
        facilidade: feedbacks.filter(f => Math.round(f.ease_rating) === rating).length
      };
    });

    // Análise de sentimento (ajustado para escala 1-10)
    const excellent = feedbacks.filter(f => (f.experience_rating + f.ease_rating) / 2 >= 9).length;
    const good = feedbacks.filter(f => {
      const avg = (f.experience_rating + f.ease_rating) / 2;
      return avg >= 7 && avg < 9;
    }).length;
    const average = feedbacks.filter(f => {
      const avg = (f.experience_rating + f.ease_rating) / 2;
      return avg >= 5 && avg < 7;
    }).length;
    const poor = feedbacks.filter(f => (f.experience_rating + f.ease_rating) / 2 < 5).length;

    const sentimentData = [
      { name: 'Excelente', value: excellent, color: '#22c55e', percentage: (excellent / feedbacks.length * 100).toFixed(1) },
      { name: 'Bom', value: good, color: '#f59e0b', percentage: (good / feedbacks.length * 100).toFixed(1) },
      { name: 'Regular', value: average, color: '#f97316', percentage: (average / feedbacks.length * 100).toFixed(1) },
      { name: 'Ruim', value: poor, color: '#ef4444', percentage: (poor / feedbacks.length * 100).toFixed(1) }
    ].filter(item => item.value > 0);

    // Tendência (últimos 7 dias vs 7 dias anteriores)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent = feedbacks.filter(f => new Date(f.created_at) >= sevenDaysAgo);
    const previous = feedbacks.filter(f => {
      const date = new Date(f.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });

    const recentAvg = recent.length > 0 
      ? recent.reduce((sum, f) => sum + (f.experience_rating + f.ease_rating) / 2, 0) / recent.length 
      : 0;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, f) => sum + (f.experience_rating + f.ease_rating) / 2, 0) / previous.length 
      : 0;

    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    // Performance por tipo de feedback
    const typePerformance = feedbacks.reduce((acc, feedback) => {
      const type = feedback.feedback_type || 'outros';
      if (!acc[type]) {
        acc[type] = { count: 0, totalScore: 0 };
      }
      acc[type].count++;
      acc[type].totalScore += (feedback.experience_rating + feedback.ease_rating) / 2;
      return acc;
    }, {} as Record<string, { count: number; totalScore: number }>);

    const performanceData = Object.entries(typePerformance).map(([type, data]) => ({
      type,
      count: data.count,
      averageScore: (data.totalScore / data.count).toFixed(1),
      percentage: ((data.count / feedbacks.length) * 100).toFixed(1)
    }));

    return {
      distributionData: experienceDistribution,
      sentimentData,
      trendsData: [
        { period: 'Últimos 7 dias', score: recentAvg.toFixed(1), count: recent.length },
        { period: '7 dias anteriores', score: previousAvg.toFixed(1), count: previous.length }
      ],
      performanceData,
      totalFeedbacks: feedbacks.length,
      averageScore: feedbacks.reduce((sum, f) => sum + (f.experience_rating + f.ease_rating) / 2, 0) / feedbacks.length,
      trend
    };
  }, [feedbacks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    if (insights.trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (insights.trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendColor = () => {
    if (insights.trend > 5) return "text-green-500";
    if (insights.trend < -5) return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <div className="space-y-6">
      {/* Indicadores de Tendência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tendência</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon()}
                  <span className={`text-2xl font-bold ${getTrendColor()}`}>
                    {Math.abs(insights.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {insights.averageScore.toFixed(1)}/10
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Participação</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {insights.totalFeedbacks}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Sentimentos */}
        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Análise de Sentimento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insights.sentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={false}
                >
                  {insights.sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {insights.sentimentData.map((item) => (
                <Badge key={item.name} variant="outline" className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}: {item.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Ratings */}
        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição de Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="rating" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="experiencia" 
                  fill="hsl(var(--primary))" 
                  name="Experiência"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="facilidade" 
                  fill="hsl(var(--secondary))" 
                  name="Facilidade"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Tipo */}
      {insights.performanceData.length > 1 && (
        <Card className="backdrop-blur-sm bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Performance por Tipo de Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {insights.performanceData.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <div>
                      <p className="font-medium capitalize">{item.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} feedbacks ({item.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{item.averageScore}/10</p>
                    <p className="text-xs text-muted-foreground">Score médio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}