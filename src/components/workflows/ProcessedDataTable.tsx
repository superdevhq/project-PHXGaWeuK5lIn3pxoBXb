
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type ProcessedData = {
  id: number;
  external_id: string;
  name: string;
  value: number;
  category: string | null;
  quality: number;
  processed_at: string;
  workflow_run_id: string;
  created_at: string;
};

export function ProcessedDataTable({ workflowRunId }: { workflowRunId?: string }) {
  const [limit, setLimit] = useState(10);

  // Fetch processed data
  const { data, isLoading, error } = useQuery({
    queryKey: ["processed-data", workflowRunId, limit],
    queryFn: async () => {
      let query = supabase
        .from("processed_data")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(limit);

      // Filter by workflow run ID if provided
      if (workflowRunId) {
        query = query.eq("workflow_run_id", workflowRunId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching processed data:", error);
        throw error;
      }

      return data as ProcessedData[];
    },
  });

  // Function to get quality badge color
  const getQualityBadgeColor = (quality: number) => {
    if (quality >= 0.8) return "bg-green-500";
    if (quality >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm:ss");
    } catch (e) {
      return dateString;
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Processed Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading data: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Processed Data</CardTitle>
        {workflowRunId && (
          <div className="text-sm text-muted-foreground">
            Showing data for workflow run: {workflowRunId}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Processed At</TableHead>
                    {!workflowRunId && <TableHead>Workflow Run</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.category || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${getQualityBadgeColor(item.quality)} text-white`}
                        >
                          {(item.quality * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.processed_at)}</TableCell>
                      {!workflowRunId && (
                        <TableCell className="font-mono text-xs">
                          {item.workflow_run_id.substring(0, 8)}...
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data.length >= limit && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setLimit(limit + 10)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No processed data found
            {workflowRunId && " for this workflow run"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
