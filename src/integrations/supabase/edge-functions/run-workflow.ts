
// Edge function to execute a workflow with real task implementations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { validate } from 'https://esm.sh/jsonschema@1.4.1'

// Define types for our workflow system
type WorkflowNode = {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  position: { x: number; y: number };
  config: Record<string, any>;
  dependencies: string[];
  description?: string;
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  condition?: string;
};

type Workflow = {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  schedule?: { cron: string };
  tags?: string[];
  status: 'active' | 'inactive' | 'running' | 'failed';
};

type NodeRun = {
  nodeId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed';
  output?: any;
  error?: string;
};

type WorkflowRun = {
  id: string;
  workflowId: string;
  version: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  nodeRuns: NodeRun[];
};

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
}

// Main function to handle the request
Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Get the request method
  const { method } = req;

  // Only allow POST requests
  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse the request body
    const { workflowId, runId } = await req.json();

    // Validate required parameters
    if (!workflowId || !runId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: workflowId and runId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a Supabase client (using the edge function's built-in credentials)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
      }
    );

    // Execute the workflow
    const result = await executeWorkflow(supabaseClient, workflowId, runId);

    // Return the result
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while executing the workflow' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Function to execute the workflow
async function executeWorkflow(supabase: any, workflowId: string, runId: string) {
  console.log(`Starting execution of workflow ${workflowId}, run ${runId}`);
  
  try {
    // Fetch the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();
    
    if (workflowError) {
      throw new Error(`Error fetching workflow: ${workflowError.message}`);
    }
    
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    // Fetch the run
    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('id', runId)
      .single();
    
    if (runError) {
      throw new Error(`Error fetching workflow run: ${runError.message}`);
    }
    
    if (!run) {
      throw new Error(`Workflow run with ID ${runId} not found`);
    }
    
    // Initialize node runs array
    const nodeRuns: NodeRun[] = [];
    
    // Find trigger nodes (nodes without dependencies)
    const triggerNodes = workflow.nodes.filter((node: WorkflowNode) => 
      node.dependencies.length === 0 || node.type === 'trigger'
    );
    
    // Process each trigger node
    for (const node of triggerNodes) {
      await processNode(supabase, workflow, node, nodeRuns, runId);
    }
    
    // Determine overall status
    const failedNodes = nodeRuns.filter(nr => nr.status === 'failed');
    const overallStatus = failedNodes.length > 0 ? 'failed' : 'success';
    
    // Update the workflow run with the results
    const { error: updateRunError } = await supabase
      .from('workflow_runs')
      .update({
        status: overallStatus,
        end_time: new Date().toISOString(),
        node_runs: nodeRuns
      })
      .eq('id', runId);
    
    if (updateRunError) {
      throw new Error(`Error updating workflow run: ${updateRunError.message}`);
    }
    
    // Update the workflow status
    const { error: updateWorkflowError } = await supabase
      .from('workflows')
      .update({
        status: overallStatus === 'success' ? 'active' : 'failed'
      })
      .eq('id', workflowId);
    
    if (updateWorkflowError) {
      throw new Error(`Error updating workflow status: ${updateWorkflowError.message}`);
    }
    
    console.log(`Workflow execution completed with status: ${overallStatus}`);
    
    return {
      workflowId,
      runId,
      status: overallStatus,
      nodeRuns
    };
  } catch (error) {
    console.error(`Error in workflow execution:`, error);
    
    // Update the workflow run with error status
    await supabase
      .from('workflow_runs')
      .update({
        status: 'failed',
        end_time: new Date().toISOString(),
        node_runs: []
      })
      .eq('id', runId);
    
    // Update the workflow status
    await supabase
      .from('workflows')
      .update({
        status: 'failed'
      })
      .eq('id', workflowId);
    
    throw error;
  }
}

// Process a single node and its downstream nodes
async function processNode(
  supabase: any, 
  workflow: Workflow, 
  node: WorkflowNode, 
  nodeRuns: NodeRun[], 
  runId: string
): Promise<boolean> {
  console.log(`Processing node: ${node.id} (${node.name})`);
  
  // Check if node has already been processed
  if (nodeRuns.some(nr => nr.nodeId === node.id)) {
    console.log(`Node ${node.id} already processed, skipping`);
    return true;
  }
  
  // Check if all dependencies have been processed successfully
  if (node.dependencies.length > 0) {
    for (const depId of node.dependencies) {
      const depRun = nodeRuns.find(nr => nr.nodeId === depId);
      if (!depRun || depRun.status !== 'success') {
        console.log(`Dependency ${depId} not yet successful, skipping node ${node.id}`);
        return false;
      }
    }
  }
  
  // Start node execution
  const nodeRun: NodeRun = {
    nodeId: node.id,
    startTime: new Date().toISOString(),
    status: 'running'
  };
  
  nodeRuns.push(nodeRun);
  
  // Update the workflow run with the current node runs
  await supabase
    .from('workflow_runs')
    .update({
      node_runs: nodeRuns
    })
    .eq('id', runId);
  
  try {
    // Get input data from dependencies
    const inputData = await getInputData(nodeRuns, node.dependencies);
    
    // Execute the node based on its type
    let output: any = null;
    
    switch (node.type) {
      case 'trigger':
        output = await executeDataExtraction(node.config, supabase);
        break;
      
      case 'task':
        if (node.name.includes('Validation')) {
          output = await executeDataValidation(inputData, node.config);
        } else if (node.name.includes('Transformation')) {
          output = await executeDataTransformation(inputData, node.config);
        } else if (node.name.includes('Loading')) {
          output = await executeDataLoading(inputData, node.config, supabase, runId);
        } else if (node.name.includes('Error Handling')) {
          output = await executeErrorHandling(inputData, node.config);
        } else if (node.name.includes('Notification')) {
          output = await executeNotification(inputData, node.config);
        } else {
          output = { processed: true, data: inputData };
        }
        break;
      
      case 'decision':
        output = await executeDecision(inputData, node.config);
        break;
      
      default:
        output = { executed: true, data: inputData };
    }
    
    // Update node run with success
    nodeRun.status = 'success';
    nodeRun.endTime = new Date().toISOString();
    nodeRun.output = output;
    
    // Update the workflow run with the current node runs
    await supabase
      .from('workflow_runs')
      .update({
        node_runs: nodeRuns
      })
      .eq('id', runId);
    
    // Find downstream nodes
    const outgoingEdges = workflow.edges.filter(edge => edge.source === node.id);
    
    // Process downstream nodes
    for (const edge of outgoingEdges) {
      // Check if edge has a condition
      if (edge.condition) {
        // For decision nodes, check the output decision
        if (node.type === 'decision' && output.decision !== undefined) {
          const shouldFollow = evaluateCondition(edge.condition, output);
          
          if (!shouldFollow) {
            console.log(`Skipping edge ${edge.id} due to condition evaluation`);
            continue;
          }
        }
      }
      
      const targetNode = workflow.nodes.find(n => n.id === edge.target);
      if (targetNode) {
        await processNode(supabase, workflow, targetNode, nodeRuns, runId);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing node ${node.id}:`, error);
    
    // Update node run with failure
    nodeRun.status = 'failed';
    nodeRun.endTime = new Date().toISOString();
    nodeRun.error = error.message || 'Unknown error';
    
    // Update the workflow run with the current node runs
    await supabase
      .from('workflow_runs')
      .update({
        node_runs: nodeRuns
      })
      .eq('id', runId);
    
    return false;
  }
}

// Get input data from dependencies
async function getInputData(nodeRuns: NodeRun[], dependencies: string[]): Promise<any> {
  if (dependencies.length === 0) {
    return {};
  }
  
  // Combine output from all dependencies
  const inputData: any = {};
  
  for (const depId of dependencies) {
    const depRun = nodeRuns.find(nr => nr.nodeId === depId);
    if (depRun && depRun.output) {
      if (depRun.output.data) {
        // If the output has a data property, merge it
        Object.assign(inputData, depRun.output.data);
      } else {
        // Otherwise, use the node ID as a key
        inputData[depId] = depRun.output;
      }
    }
  }
  
  return inputData;
}

// Evaluate a condition against data
function evaluateCondition(condition: string, data: any): boolean {
  try {
    // Simple condition evaluation
    if (condition.includes('quality > 0.8')) {
      return data.quality > 0.8 || data.decision === true;
    } else if (condition.includes('quality <= 0.8')) {
      return data.quality <= 0.8 || data.decision === false;
    }
    
    // Default to true if we can't evaluate
    return true;
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

// Execute data extraction (trigger node)
async function executeDataExtraction(config: any, supabase: any): Promise<any> {
  console.log('Executing data extraction with config:', config);
  
  // In a real implementation, this would make an actual API call
  // For this demo, we'll generate sample data
  
  // Sample data sources
  const dataSources = {
    api: [
      { id: '1', name: 'product1', value: 100, category: 'electronics' },
      { id: '2', name: 'product2', value: 200, category: 'clothing' },
      { id: '3', name: 'product3', value: 300, category: 'home' }
    ],
    database: [
      { id: '4', name: 'product4', value: 400, category: 'electronics' },
      { id: '5', name: 'product5', value: 500, category: 'food' }
    ],
    file: [
      { id: '6', name: 'product6', value: 600, category: 'toys' }
    ]
  };
  
  // Get data from the specified source
  const source = config.source || 'api';
  const data = dataSources[source] || dataSources.api;
  
  // Add a quality score (used by decision nodes)
  const quality = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
  
  return {
    data,
    quality,
    source,
    timestamp: new Date().toISOString(),
    recordCount: data.length
  };
}

// Execute data validation
async function executeDataValidation(inputData: any, config: any): Promise<any> {
  console.log('Executing data validation with config:', config);
  
  const data = inputData.data || [];
  const schema = config.schema;
  
  if (!schema) {
    throw new Error('Validation schema not provided');
  }
  
  // Validate each record against the schema
  const validRecords = [];
  const invalidRecords = [];
  
  for (const record of data) {
    const result = validate(record, schema);
    
    if (result.valid) {
      validRecords.push(record);
    } else {
      invalidRecords.push({
        record,
        errors: result.errors.map(e => e.stack)
      });
    }
  }
  
  // Calculate validation metrics
  const totalRecords = data.length;
  const validCount = validRecords.length;
  const invalidCount = invalidRecords.length;
  const validationRate = totalRecords > 0 ? validCount / totalRecords : 0;
  
  // Determine quality based on validation rate
  const quality = validationRate;
  
  return {
    data: validRecords,
    invalidRecords,
    metrics: {
      totalRecords,
      validCount,
      invalidCount,
      validationRate
    },
    quality,
    timestamp: new Date().toISOString()
  };
}

// Execute data transformation
async function executeDataTransformation(inputData: any, config: any): Promise<any> {
  console.log('Executing data transformation with config:', config);
  
  const data = inputData.data || [];
  const transformations = config.transformations || [];
  
  if (transformations.length === 0) {
    throw new Error('No transformations specified');
  }
  
  // Apply transformations to each record
  const transformedData = data.map(record => {
    const newRecord = { ...record };
    
    for (const transform of transformations) {
      const { field, operation } = transform;
      
      if (field && operation && newRecord[field] !== undefined) {
        switch (operation) {
          case 'uppercase':
            if (typeof newRecord[field] === 'string') {
              newRecord[field] = newRecord[field].toUpperCase();
            }
            break;
            
          case 'lowercase':
            if (typeof newRecord[field] === 'string') {
              newRecord[field] = newRecord[field].toLowerCase();
            }
            break;
            
          case 'multiply':
            if (typeof newRecord[field] === 'number') {
              const factor = transform.factor || 1;
              newRecord[field] = newRecord[field] * factor;
            }
            break;
            
          case 'round':
            if (typeof newRecord[field] === 'number') {
              newRecord[field] = Math.round(newRecord[field]);
            }
            break;
            
          case 'format':
            if (transform.format) {
              newRecord[field] = transform.format.replace('{value}', newRecord[field]);
            }
            break;
        }
      }
    }
    
    return newRecord;
  });
  
  // Calculate transformation metrics
  const beforeSize = JSON.stringify(data).length;
  const afterSize = JSON.stringify(transformedData).length;
  const sizeChange = afterSize - beforeSize;
  
  // Maintain the same quality score
  const quality = inputData.quality || 0.9;
  
  return {
    data: transformedData,
    metrics: {
      recordCount: transformedData.length,
      transformationCount: transformations.length,
      beforeSize,
      afterSize,
      sizeChange
    },
    quality,
    timestamp: new Date().toISOString()
  };
}

// Execute decision node
async function executeDecision(inputData: any, config: any): Promise<any> {
  console.log('Executing decision with config:', config);
  
  const condition = config.condition;
  
  if (!condition) {
    throw new Error('Decision condition not provided');
  }
  
  // Get quality from input data
  const quality = inputData.quality || 0.5;
  
  // Evaluate the condition
  let decision = false;
  
  if (condition.includes('quality > 0.8')) {
    decision = quality > 0.8;
  } else if (condition.includes('quality <= 0.8')) {
    decision = quality <= 0.8;
  }
  
  return {
    decision,
    condition,
    quality,
    timestamp: new Date().toISOString(),
    data: inputData.data
  };
}

// Execute data loading
async function executeDataLoading(inputData: any, config: any, supabase: any, runId: string): Promise<any> {
  console.log('Executing data loading with config:', config);
  
  const data = inputData.data || [];
  const destination = config.destination;
  const table = config.table;
  const mode = config.mode || 'append';
  
  if (!destination || !table) {
    throw new Error('Loading destination or table not provided');
  }
  
  // In a real implementation, this would insert data into the actual table
  // For this demo, we'll actually insert into the processed_data table
  
  if (destination === 'database' && table === 'processed_data') {
    try {
      // Insert the data into the processed_data table
      const recordsToInsert = data.map(item => ({
        external_id: item.id,
        name: item.name,
        value: item.value,
        category: item.category,
        quality: inputData.quality || 0.9,
        processed_at: new Date().toISOString(),
        workflow_run_id: runId
      }));
      
      console.log('Inserting data into processed_data:', recordsToInsert);
      
      const { error } = await supabase
        .from('processed_data')
        .insert(recordsToInsert);
      
      if (error) {
        console.error('Error inserting data:', error);
        throw new Error(`Error inserting data: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in data loading:', error);
      throw error;
    }
  }
  
  // Calculate loading metrics
  const recordCount = data.length;
  
  return {
    destination,
    table,
    mode,
    metrics: {
      recordCount,
      bytesProcessed: JSON.stringify(data).length
    },
    timestamp: new Date().toISOString(),
    data: inputData.data
  };
}

// Execute error handling
async function executeErrorHandling(inputData: any, config: any): Promise<any> {
  console.log('Executing error handling with config:', config);
  
  const action = config.action || 'log';
  const notify = config.notify || false;
  const retry = config.retry || false;
  
  // Get invalid records if available
  const invalidRecords = inputData.invalidRecords || [];
  
  // Log the error
  if (action === 'log') {
    console.log('Error handling: Invalid records detected', invalidRecords);
  }
  
  // In a real implementation, this would send notifications or retry operations
  
  return {
    action,
    notify,
    retry,
    invalidRecordCount: invalidRecords.length,
    timestamp: new Date().toISOString(),
    data: inputData.data
  };
}

// Execute notification
async function executeNotification(inputData: any, config: any): Promise<any> {
  console.log('Executing notification with config:', config);
  
  const channel = config.channel || 'email';
  const recipients = config.recipients || [];
  const template = config.template || 'default';
  
  // In a real implementation, this would send actual notifications
  // For this demo, we'll log the operation and return success
  
  // Prepare notification content
  const content = {
    subject: `Workflow Execution: ${template}`,
    body: `Workflow executed successfully with ${inputData.data?.length || 0} records processed.`
  };
  
  return {
    channel,
    recipients,
    template,
    content,
    sent: true,
    timestamp: new Date().toISOString()
  };
}
