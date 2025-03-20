import { supabase } from "@/integrations/supabase/client";
import { Workflow, WorkflowRun } from "@/lib/types";
import { toast } from "sonner";

// Fetch all workflows
export async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    console.log("Fetching workflows...");
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching workflows:", error);
      throw error;
    }

    console.log("Fetched workflows:", data);
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      version: item.version,
      nodes: item.nodes as any,
      edges: item.edges as any,
      schedule: item.schedule as any,
      tags: item.tags || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      lastRunAt: item.last_run_at || undefined,
      status: item.status as "active" | "inactive" | "running" | "failed",
    }));
  } catch (error) {
    console.error("Error fetching workflows:", error);
    toast.error(`Failed to fetch workflows: ${error.message || "Unknown error"}`);
    return [];
  }
}

// Fetch a single workflow by ID
export async function fetchWorkflowById(id: string): Promise<Workflow | null> {
  try {
    console.log(`Fetching workflow with ID ${id}...`);
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Supabase error fetching workflow with ID ${id}:`, error);
      throw error;
    }

    if (!data) {
      console.log(`No workflow found with ID ${id}`);
      return null;
    }

    console.log(`Fetched workflow:`, data);
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      version: data.version,
      nodes: data.nodes as any,
      edges: data.edges as any,
      schedule: data.schedule as any,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRunAt: data.last_run_at || undefined,
      status: data.status as "active" | "inactive" | "running" | "failed",
    };
  } catch (error) {
    console.error(`Error fetching workflow with ID ${id}:`, error);
    toast.error(`Failed to fetch workflow: ${error.message || "Unknown error"}`);
    return null;
  }
}

// Create a new workflow
export async function createWorkflow(workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">): Promise<Workflow | null> {
  try {
    console.log("Creating new workflow:", workflow);
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        nodes: workflow.nodes,
        edges: workflow.edges,
        schedule: workflow.schedule,
        tags: workflow.tags,
        status: workflow.status,
        last_run_at: workflow.lastRunAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating workflow:", error);
      throw error;
    }

    if (!data) {
      console.error("No data returned after creating workflow");
      throw new Error("No data returned after creating workflow");
    }

    console.log("Workflow created successfully:", data);
    toast.success("Workflow created successfully");
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      version: data.version,
      nodes: data.nodes as any,
      edges: data.edges as any,
      schedule: data.schedule as any,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRunAt: data.last_run_at || undefined,
      status: data.status as "active" | "inactive" | "running" | "failed",
    };
  } catch (error) {
    console.error("Error creating workflow:", error);
    toast.error(`Failed to create workflow: ${error.message || "Unknown error"}`);
    return null;
  }
}

// Update an existing workflow
export async function updateWorkflow(id: string, workflow: Partial<Omit<Workflow, "id" | "createdAt" | "updatedAt">>): Promise<Workflow | null> {
  try {
    console.log(`Updating workflow with ID ${id}:`, workflow);
    const updateData: any = {};
    
    if (workflow.name) updateData.name = workflow.name;
    if (workflow.description !== undefined) updateData.description = workflow.description;
    if (workflow.version) updateData.version = workflow.version;
    if (workflow.nodes) updateData.nodes = workflow.nodes;
    if (workflow.edges) updateData.edges = workflow.edges;
    if (workflow.schedule !== undefined) updateData.schedule = workflow.schedule;
    if (workflow.tags) updateData.tags = workflow.tags;
    if (workflow.status) updateData.status = workflow.status;
    if (workflow.lastRunAt) updateData.last_run_at = workflow.lastRunAt;

    const { data, error } = await supabase
      .from("workflows")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating workflow with ID ${id}:`, error);
      throw error;
    }

    console.log("Workflow updated successfully:", data);
    toast.success("Workflow updated successfully");
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      version: data.version,
      nodes: data.nodes as any,
      edges: data.edges as any,
      schedule: data.schedule as any,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRunAt: data.last_run_at || undefined,
      status: data.status as "active" | "inactive" | "running" | "failed",
    };
  } catch (error) {
    console.error(`Error updating workflow with ID ${id}:`, error);
    toast.error(`Failed to update workflow: ${error.message || "Unknown error"}`);
    return null;
  }
}

// Delete a workflow
export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    console.log(`Deleting workflow with ID ${id}...`);
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Supabase error deleting workflow with ID ${id}:`, error);
      throw error;
    }

    console.log(`Workflow with ID ${id} deleted successfully`);
    toast.success("Workflow deleted successfully");
    return true;
  } catch (error) {
    console.error(`Error deleting workflow with ID ${id}:`, error);
    toast.error(`Failed to delete workflow: ${error.message || "Unknown error"}`);
    return false;
  }
}

// Fetch workflow runs for a specific workflow
export async function fetchWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
  try {
    console.log(`Fetching runs for workflow ${workflowId}...`);
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("start_time", { ascending: false });

    if (error) {
      console.error(`Supabase error fetching runs for workflow ${workflowId}:`, error);
      throw error;
    }

    console.log(`Fetched ${data.length} runs for workflow ${workflowId}`);
    return data.map((item) => ({
      id: item.id,
      workflowId: item.workflow_id,
      version: item.version,
      startTime: item.start_time,
      endTime: item.end_time || undefined,
      status: item.status as "running" | "success" | "failed" | "cancelled",
      nodeRuns: item.node_runs as any,
    }));
  } catch (error) {
    console.error(`Error fetching runs for workflow ${workflowId}:`, error);
    toast.error(`Failed to fetch workflow runs: ${error.message || "Unknown error"}`);
    return [];
  }
}

// Create a new workflow run
export async function createWorkflowRun(workflowId: string, version: string): Promise<WorkflowRun | null> {
  try {
    console.log(`Creating run for workflow ${workflowId}...`);
    // Create a new run record
    const { data, error } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        version: version,
        status: "running",
        node_runs: [],
      })
      .select()
      .single();

    if (error) {
      console.error(`Supabase error creating run for workflow ${workflowId}:`, error);
      throw error;
    }

    console.log(`Created run for workflow ${workflowId}:`, data);

    // Update the workflow status to running
    await supabase
      .from("workflows")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", workflowId);

    // Call the edge function to execute the workflow
    console.log(`Invoking run-workflow edge function for workflow ${workflowId}, run ${data.id}`);
    const { data: executionData, error: executionError } = await supabase.functions.invoke("run-workflow", {
      body: { workflowId, runId: data.id },
    });

    if (executionError) {
      console.error("Error invoking workflow execution:", executionError);
      toast.error(`Error starting workflow execution: ${executionError.message || "Unknown error"}`);
      // We don't throw here because the run has been created
      // The edge function will handle updating the status
    } else {
      console.log("Edge function response:", executionData);
    }

    toast.success("Workflow execution started");
    
    return {
      id: data.id,
      workflowId: data.workflow_id,
      version: data.version,
      startTime: data.start_time,
      endTime: data.end_time || undefined,
      status: data.status as "running" | "success" | "failed" | "cancelled",
      nodeRuns: data.node_runs as any,
    };
  } catch (error) {
    console.error(`Error creating run for workflow ${workflowId}:`, error);
    toast.error(`Failed to start workflow execution: ${error.message || "Unknown error"}`);
    return null;
  }
}

// Update a workflow run
export async function updateWorkflowRun(
  runId: string, 
  updates: { 
    status?: "running" | "success" | "failed" | "cancelled";
    endTime?: string;
    nodeRuns?: any[];
  }
): Promise<WorkflowRun | null> {
  try {
    console.log(`Updating run ${runId}:`, updates);
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.nodeRuns) updateData.node_runs = updates.nodeRuns;

    const { data, error } = await supabase
      .from("workflow_runs")
      .update(updateData)
      .eq("id", runId)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating run ${runId}:`, error);
      throw error;
    }

    console.log(`Run ${runId} updated successfully:`, data);

    // If the run is completed, update the workflow status
    if (updates.status && updates.status !== "running") {
      const { data: runData } = await supabase
        .from("workflow_runs")
        .select("workflow_id")
        .eq("id", runId)
        .single();
        
      if (runData) {
        await supabase
          .from("workflows")
          .update({ status: updates.status === "success" ? "active" : "failed" })
          .eq("id", runData.workflow_id);
      }
    }

    if (updates.status === "success") {
      toast.success("Workflow execution completed successfully");
    } else if (updates.status === "failed") {
      toast.error("Workflow execution failed");
    } else if (updates.status === "cancelled") {
      toast.info("Workflow execution cancelled");
    }
    
    return {
      id: data.id,
      workflowId: data.workflow_id,
      version: data.version,
      startTime: data.start_time,
      endTime: data.end_time || undefined,
      status: data.status as "running" | "success" | "failed" | "cancelled",
      nodeRuns: data.node_runs as any,
    };
  } catch (error) {
    console.error(`Error updating run ${runId}:`, error);
    toast.error(`Failed to update workflow run: ${error.message || "Unknown error"}`);
    return null;
  }
}