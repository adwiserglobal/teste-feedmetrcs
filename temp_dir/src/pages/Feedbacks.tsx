import { FeedbackList } from "@/components/FeedbackList";
import { useFeedbacks } from "@/hooks/useFeedbacks";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feedbacks() {
  const { stats, loading } = useFeedbacks();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Feedbacks</h1>
        <p className="text-muted-foreground">
          Visualize todos os feedbacks recebidos
        </p>
      </div>
      
      <FeedbackList feedbacks={stats.recentFeedbacks} />
    </div>
  );
}
