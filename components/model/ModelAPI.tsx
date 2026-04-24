'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, Check, Rocket, Play, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  values?: string;
}

interface APIResponse {
  field: string;
  type: string;
  description: string;
}

interface APIConfig {
  method: string;
  endpoint: string;
  title: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  exampleRequest?: Record<string, any>;
}

interface ModelAPIProps {
  modelId: string;
  modelName: string;
  apiType: 'image' | 'video' | 'audio';
}

// Task Status API Configuration (共通)
const queryTaskAPI: APIConfig = {
  method: 'GET',
  endpoint: '/api/generate/status/{task_id}',
  title: 'Query Task Status',
  description: 'Query task status and results by task ID',
  parameters: [
    { name: 'task_id', type: 'string', required: true, description: 'Task ID returned by the generation API (path parameter)' },
  ],
  responses: [
    { field: 'code', type: 'integer', description: 'HTTP status code (200 for success)' },
    { field: 'data.task_id', type: 'string', description: 'Unique task identifier' },
    { field: 'data.status', type: 'string', description: 'Current task state: not_started, running, finished, failed' },
    { field: 'data.files', type: 'array', description: 'Array of generated files (present when finished)' },
    { field: 'data.files[].file_url', type: 'string', description: 'URL of generated file' },
    { field: 'data.files[].file_type', type: 'string', description: 'Type of file: image, video, audio' },
    { field: 'data.created_time', type: 'string', description: 'Task creation timestamp (ISO 8601)' },
    { field: 'data.progress', type: 'integer', description: 'Task progress percentage (0-100)' },
    { field: 'data.error_message', type: 'string', description: 'Error description (failed tasks only)' },
  ],
};

// Image Generation API Configuration
const imageGenerationAPI: APIConfig = {
  method: 'POST',
  endpoint: '/api/generate/submit',
  title: 'Create Image Generation Task',
  description: 'Create a new image generation task for text-to-image or image editing (edit mode requires image_urls).',
  parameters: [
    { name: 'model', type: 'string', required: true, description: 'Model identifier (e.g., "nano-banana", "nano-banana-edit", "gpt-4o-image", "gpt-4o-image-edit")' },
    { name: 'callback_url', type: 'string', required: false, description: 'Webhook URL for task completion notification' },
    { name: 'input.prompt', type: 'string', required: true, description: 'Text description for generation (max 1000 characters)' },
    { name: 'input.size', type: 'string', required: false, description: 'Image dimensions: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, or 21:9' },
    { name: 'input.n', type: 'integer', required: false, description: 'Number of images to generate (model-dependent: 1-4 for GPT-4o, fixed at 1 for Nano Banana)' },
    { name: 'input.image_urls', type: 'array', required: false, description: 'Reference images (REQUIRED for edit models). Max 5 images, ≤10MB each, .jpeg/.jpg/.png/.webp' },
    { name: 'input.mask_url', type: 'string', required: false, description: 'PNG mask for targeted editing (≤4MB)' },
  ],
  responses: [
    { field: 'code', type: 'integer', description: 'HTTP status code (0 for success)' },
    { field: 'data.task_id', type: 'string', description: 'Unique identifier for tracking' },
    { field: 'data.created_time', type: 'string', description: 'Task creation timestamp (ISO 8601)' },
  ],
  exampleRequest: {
    model: 'nano-banana',
    input: {
      prompt: 'A serene lake at sunset with mountains in the background',
      size: '1:1',
      n: 1,
    },
  },
};

// Video Generation API Configuration
const videoGenerationAPI: APIConfig = {
  method: 'POST',
  endpoint: '/api/generate/submit',
  title: 'Create Video Generation Task',
  description: 'Create a new video generation task for text-to-video or image-to-video generation',
  parameters: [
    { name: 'model', type: 'string', required: true, description: 'Model identifier', values: '"sora-2"\n"sora-2-pro"' },
    { name: 'callback_url', type: 'string', required: false, description: 'Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or failure).' },
    { name: 'input.prompt', type: 'string', required: true, description: 'Text description of the video to generate (max 1000 characters)' },
    { name: 'input.duration', type: 'integer', required: false, description: 'Video duration in seconds', values: 'sora-2: 10, 15\nsora-2-pro: 15, 25' },
    { name: 'input.aspect_ratio', type: 'string', required: false, description: 'Video aspect ratio', values: '"16:9"\n"9:16"' },
    { name: 'input.image_urls', type: 'array', required: false, description: 'Reference image URLs for image-to-video generation. Supported: JPEG, PNG, WebP (max 10MB each)' },
    { name: 'input.watermark', type: 'boolean', required: false, description: 'Add watermark to video (default: false)', values: 'true\nfalse' },
  ],
  responses: [
    { field: 'code', type: 'integer', description: 'HTTP status code (200 for success)' },
    { field: 'data.task_id', type: 'string', description: 'Unique task identifier for tracking' },
    { field: 'data.created_time', type: 'string', description: 'Task creation timestamp (ISO 8601)' },
  ],
  exampleRequest: {
    model: 'sora-2',
    input: {
      prompt: 'A serene lake at sunset with mountains in the background',
      duration: 15,
      aspect_ratio: '16:9',
    },
  },
};

export function ModelAPI({ modelId, modelName, apiType }: ModelAPIProps) {
  const [selectedAPI, setSelectedAPI] = useState<'create' | 'query'>('create');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showTryAPI, setShowTryAPI] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [taskId, setTaskId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Initialize request body when opening Try API dialog
  const handleOpenTryAPI = () => {
    setShowTryAPI(true);
    setApiResponse(null);

    if (currentAPI.method === 'POST' && currentAPI.exampleRequest) {
      setRequestBody(JSON.stringify({ ...currentAPI.exampleRequest, model: modelId }, null, 2));
    } else {
      setRequestBody('');
      setTaskId('');
    }
  };

  // Handle API call
  const handleSendRequest = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your API Key');
      return;
    }

    setIsLoading(true);
    setApiResponse(null);

    try {
      let url = `https://api.poyo.ai${currentAPI.endpoint}`;
      const headers: any = {
        'Authorization': `Bearer ${apiKey}`,
      };

      let body = null;

      if (currentAPI.method === 'POST') {
        if (!requestBody.trim()) {
          toast.error('Please enter request body');
          setIsLoading(false);
          return;
        }

        try {
          body = JSON.parse(requestBody);
        } catch (e) {
          toast.error('Invalid JSON format in request body');
          setIsLoading(false);
          return;
        }

        headers['Content-Type'] = 'application/json';
      } else {
        // GET request - replace task_id in URL
        if (!taskId.trim()) {
          toast.error('Please enter Task ID');
          setIsLoading(false);
          return;
        }
        url = url.replace('{task_id}', taskId);
      }

      const response = await fetch(url, {
        method: currentAPI.method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
      });

      const data = await response.json();
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        data,
      });

      if (response.ok) {
        toast.success('Request successful!');
      } else {
        toast.error(`Request failed: ${response.status}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Request failed');
      setApiResponse({
        status: 0,
        statusText: 'Error',
        data: { error: error.message || 'Request failed' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Select appropriate creation API based on type
  const createAPI = apiType === 'image' ? imageGenerationAPI : videoGenerationAPI;
  const currentAPI = selectedAPI === 'create' ? createAPI : queryTaskAPI;

  // Generate code examples
  const generateCurlExample = (api: APIConfig) => {
    if (api.method === 'POST') {
      const exampleData = { ...api.exampleRequest, model: modelId };
      return `curl -X ${api.method} "https://api.poyo.ai${api.endpoint}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(exampleData, null, 2)}'`;
    } else {
      return `curl -X ${api.method} "https://api.poyo.ai${api.endpoint.replace('{task_id}', 'YOUR_TASK_ID')}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;
    }
  };

  const generateJavaScriptExample = (api: APIConfig) => {
    if (api.method === 'POST') {
      const exampleData = { ...api.exampleRequest, model: modelId };
      return `const response = await fetch('https://api.poyo.ai${api.endpoint}', {
  method: '${api.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(exampleData, null, 4).split('\n').join('\n  ')})
});

const data = await response.json();
console.log(data);`;
    } else {
      return `const response = await fetch('https://api.poyo.ai${api.endpoint.replace('{task_id}', 'YOUR_TASK_ID')}', {
  method: '${api.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const data = await response.json();
console.log(data);`;
    }
  };

  const generatePythonExample = (api: APIConfig) => {
    if (api.method === 'POST') {
      const exampleData = { ...api.exampleRequest, model: modelId };
      return `import requests

url = "https://api.poyo.ai${api.endpoint}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

data = ${JSON.stringify(exampleData, null, 4).split('\n').join('\n')}

response = requests.post(url, headers=headers, json=data)
print(response.json())`;
    } else {
      return `import requests

url = "https://api.poyo.ai${api.endpoint.replace('{task_id}', 'YOUR_TASK_ID')}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`;
    }
  };

  const generateResponseExample = (api: APIConfig) => {
    if (api.method === 'POST') {
      return `{
  "code": 200,
  "data": {
    "task_id": "FDR7H8Y7JAL97KCV",
    "created_time": "2025-11-10T13:28:02"
  }
}`;
    } else {
      return `{
  "code": 200,
  "data": {
    "task_id": "FDR7H8Y7JAL97KCV",
    "status": "finished",
    "files": [
      {
        "file_url": "https://storage.apidot.ai/${apiType === 'image' ? 'images' : 'videos'}/FDR7H8Y7JAL97KCV/example.${apiType === 'image' ? 'png' : 'mp4'}",
        "file_type": "${apiType}"
      }
    ],
    "created_time": "2025-11-10T13:28:02",
    "progress": 100,
    "error_message": null
  }
}`;
    }
  };

  return (
    <>
      {/* Try API Dialog */}
      <Dialog open={showTryAPI} onOpenChange={setShowTryAPI}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Try {currentAPI.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pt-4">
            {/* API Endpoint */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="default"
                  className={cn(
                    "text-xs",
                    currentAPI.method === 'POST'
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {currentAPI.method}
                </Badge>
                <code className="text-sm font-mono">
                  https://api.poyo.ai{currentAPI.endpoint}
                </code>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                API Key <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter your API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API Key from{' '}
                <a
                  href="/dashboard/api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  API Key Management
                </a>
              </p>
            </div>

            {/* Request Body (for POST) or Task ID (for GET) */}
            {currentAPI.method === 'POST' ? (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Request Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder='{\n  "model": "sora-2",\n  "input": {\n    "prompt": "..."\n  }\n}'
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Task ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter Task ID"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Send Button */}
            <div>
              <Button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>

            {/* Response Section */}
            {apiResponse && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Response</Label>
                  <Badge
                    variant={apiResponse.status >= 200 && apiResponse.status < 300 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {apiResponse.status} {apiResponse.statusText}
                  </Badge>
                </div>
                <div className="bg-muted rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(JSON.stringify(apiResponse.data, null, 2))}
                  >
                    {copiedCode === JSON.stringify(apiResponse.data, null, 2) ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                  <pre className="text-xs font-mono overflow-x-auto pr-20 max-h-[300px] overflow-y-auto">
                    <code>{JSON.stringify(apiResponse.data, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTryAPI(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-6">
      {/* Left Sidebar - API Endpoints Navigation */}
      <div className="w-[280px] shrink-0 space-y-4">
        {/* API Endpoints */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">API Endpoints</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Create Task Button */}
            <button
              onClick={() => setSelectedAPI('create')}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedAPI === 'create'
                  ? "bg-primary/10 border-primary"
                  : "bg-background hover:bg-muted/50 border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="h-3.5 w-3.5" />
                <span className="font-medium text-sm">Create Task</span>
              </div>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                POST
              </Badge>
            </button>

            {/* Query Task Button */}
            <button
              onClick={() => setSelectedAPI('query')}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedAPI === 'query'
                  ? "bg-primary/10 border-primary"
                  : "bg-background hover:bg-muted/50 border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="h-3.5 w-3.5" />
                <span className="font-medium text-sm">Query Task</span>
              </div>
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-xs">
                GET
              </Badge>
            </button>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-yellow-500">🔒</span>
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              All APIs require authentication via Bearer Token.
            </p>
            <code className="block bg-muted px-3 py-2 rounded-md text-xs font-mono break-all">
              Authorization: Bearer YOUR_API_KEY
            </code>
            <div className="mt-3 text-xs text-muted-foreground">
              <span>Get API Key: </span>
              <a
                href="/dashboard/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ➜ API Key Management
              </a>
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-start gap-1">
                <span>🔒</span>
                <span>Keep your API Key secure</span>
              </div>
              <div className="flex items-start gap-1">
                <span>🚫</span>
                <span>Do not share it with others</span>
              </div>
              <div className="flex items-start gap-1">
                <span>⚡</span>
                <span>Reset immediately if compromised</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Content - API Documentation */}
      <div className="flex-1 space-y-6">
        {/* API Title and Endpoint */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="default"
              className={cn(
                "text-sm px-3 py-1",
                currentAPI.method === 'POST'
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {currentAPI.method}
            </Badge>
            <code className="text-lg font-mono">{currentAPI.endpoint}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(currentAPI.endpoint)}
            >
              {copiedCode === currentAPI.endpoint ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="ml-auto"
              onClick={handleOpenTryAPI}
            >
              <Play className="h-4 w-4 mr-2" />
              Try API
            </Button>
          </div>
          <h2 className="text-2xl font-bold mb-1">{currentAPI.title}</h2>
          <p className="text-muted-foreground">{currentAPI.description}</p>
        </div>

        {/* Request Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Request Parameters</CardTitle>
            <p className="text-sm text-muted-foreground">
              The API accepts {currentAPI.method === 'POST' ? 'a JSON payload' : 'the following parameters'} with the following structure:
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Parameter</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Required</TableHead>
                    <TableHead className="font-semibold">Values</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAPI.parameters.map((param) => (
                    <TableRow key={param.name}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2 group">
                          <span>{param.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(param.name)}
                          >
                            {copiedCode === param.name ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {param.required ? (
                          <span className="text-red-500 font-semibold">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono whitespace-pre-line text-muted-foreground">
                        {param.values || ''}
                      </TableCell>
                      <TableCell className="text-sm">{param.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Request Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-500">{'<>'}</span>
              Request Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="mt-4">
                <div className="bg-muted rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateCurlExample(currentAPI))}
                  >
                    {copiedCode === generateCurlExample(currentAPI) ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                  <pre className="text-xs font-mono overflow-x-auto pr-20">
                    <code>{generateCurlExample(currentAPI)}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="javascript" className="mt-4">
                <div className="bg-muted rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateJavaScriptExample(currentAPI))}
                  >
                    {copiedCode === generateJavaScriptExample(currentAPI) ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                  <pre className="text-xs font-mono overflow-x-auto pr-20">
                    <code>{generateJavaScriptExample(currentAPI)}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <div className="bg-muted rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatePythonExample(currentAPI))}
                  >
                    {copiedCode === generatePythonExample(currentAPI) ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                  <pre className="text-xs font-mono overflow-x-auto pr-20">
                    <code>{generatePythonExample(currentAPI)}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Response Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-green-500">📄</span>
              Response Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 relative mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateResponseExample(currentAPI))}
              >
                {copiedCode === generateResponseExample(currentAPI) ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
              <pre className="text-xs font-mono overflow-x-auto pr-20">
                <code>{generateResponseExample(currentAPI)}</code>
              </pre>
            </div>

            <h3 className="font-semibold mb-3">Response Fields</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Field</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAPI.responses.map((response) => (
                    <TableRow key={response.field}>
                      <TableCell className="font-mono text-sm">{response.field}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {response.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{response.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
