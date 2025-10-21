import { Request, Response } from 'express';
import fs from 'fs';
import hljs from 'highlight.js';
import { marked } from 'marked';
import path from 'path';

export class DocsController {
  private readmeContent: string = '';
  private quickRefContent: string = '';

  constructor() {
    this.setupMarked();
    this.loadDocumentation();
  }

  private setupMarked() {
    // Configure marked with syntax highlighting
    const renderer = new marked.Renderer();
    
    // Override code block rendering
    renderer.code = ({ text, lang }: { text: string, lang?: string }) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>`;
        } catch (err) {
          console.warn('Highlight.js error:', err);
        }
      }
      // Auto-detect if no language specified
      try {
        const highlighted = hljs.highlightAuto(text).value;
        return `<pre class="hljs"><code>${highlighted}</code></pre>`;
      } catch (err) {
        return `<pre><code>${text}</code></pre>`;
      }
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true
    });
  }

  private loadDocumentation() {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      const quickRefPath = path.join(process.cwd(), 'QUICK-REFERENCE.md');
      
      if (fs.existsSync(readmePath)) {
        this.readmeContent = fs.readFileSync(readmePath, 'utf-8');
      }
      
      if (fs.existsSync(quickRefPath)) {
        this.quickRefContent = fs.readFileSync(quickRefPath, 'utf-8');
      }
    } catch (error) {
      console.warn('Could not load documentation files:', error);
    }
  }

  // Serve README as HTML
  getReadme(req: Request, res: Response) {
    const htmlContent = this.markdownToHtml(this.readmeContent || this.getDefaultReadme());
    res.send(this.wrapInHtml(htmlContent, 'Dynamic Mock Server - Documentation'));
  }

  // Serve Quick Reference as HTML
  getQuickReference(req: Request, res: Response) {
    const htmlContent = this.markdownToHtml(this.quickRefContent || this.getDefaultQuickRef());
    res.send(this.wrapInHtml(htmlContent, 'Dynamic Mock Server - Quick Reference'));
  }

  // Serve comprehensive mock creation guide
  getMockGuide(req: Request, res: Response) {
    const guideMarkdown = this.getMockCreationGuideMarkdown();
    const guideContent = this.markdownToHtml(guideMarkdown);
    res.send(this.wrapInHtml(guideContent, 'Mock Creation Guide'));
  }

  // Serve documentation index
  getDocsIndex(req: Request, res: Response) {
    const indexContent = `
      <div class="docs-index">
        <h1>🚀 Dynamic Mock Server Documentation</h1>
        
        <div class="nav-cards">
          <div class="card">
            <h3><a href="/docs/readme">📖 Full Documentation</a></h3>
            <p>Complete README with all features, examples, and advanced usage</p>
          </div>
          
          <div class="card">
            <h3><a href="/docs/quick">⚡ Quick Reference</a></h3>
            <p>Cheat sheet with commands and configuration examples</p>
          </div>
          
          <div class="card">
            <h3><a href="/docs/guide">🛠️ Mock Creation Guide</a></h3>
            <p>Step-by-step guide to create and configure mock endpoints</p>
          </div>
          
          <div class="card">
            <h3><a href="/admin">🔧 Admin Interface</a></h3>
            <p>Web-based configuration management and file browser</p>
          </div>
        </div>

        <div class="quick-start">
          <h2>🏃‍♂️ Quick Start</h2>
          <ol>
            <li><strong>Test existing endpoints:</strong> <code>GET /api/users</code></li>
            <li><strong>Create new mocks:</strong> Use <a href="/admin">/admin</a> interface</li>
            <li><strong>Upload configurations:</strong> JSON files in admin panel</li>
            <li><strong>Test conditions:</strong> Add query parameters like <code>?status=active</code></li>
          </ol>
        </div>

        <div class="example-commands">
          <h2>📋 Try These Commands</h2>
          <div class="command-section">
            <h4>PowerShell:</h4>
            <pre><code>Invoke-RestMethod -Uri 'http://localhost:3000/api/users'
Invoke-RestMethod -Uri 'http://localhost:3000/api/users/1'</code></pre>
          </div>
          
          <div class="command-section">
            <h4>cURL:</h4>
            <pre><code>curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/1</code></pre>
          </div>
        </div>
      </div>
    `;
    
    res.send(this.wrapInHtml(indexContent, 'Dynamic Mock Server - Documentation'));
  }

  private getMockCreationGuideMarkdown(): string {
    return `# 🛠️ Mock Creation Guide

## 📁 File Structure

Mock configurations are stored in \`src/config/routes/\` with this structure:

\`\`\`
src/config/routes/
├── users/
│   ├── get-users.json
│   ├── get-user-by-id.json
│   └── post-users.json
└── products/
    └── get-products.json
\`\`\`

## 📝 Basic Configuration

Each endpoint needs a JSON configuration file:

\`\`\`json
{
  "method": "GET",
  "path": "/users",
  "conditions": [
    {
      "response": {
        "status": 200,
        "data": [
          {"id": 1, "name": "John Doe"},
          {"id": 2, "name": "Jane Smith"}
        ]
      }
    }
  ]
}
\`\`\`

## 🔀 Conditional Responses

Create different responses based on request parameters:

\`\`\`json
{
  "method": "GET",
  "path": "/users",
  "conditions": [
    {
      "query": {"status": "active"},
      "response": {
        "status": 200,
        "data": [{"id": 1, "name": "Active User"}]
      }
    },
    {
      "response": {
        "status": 200,
        "data": [{"id": 1, "name": "All Users"}]
      }
    }
  ]
}
\`\`\`

## 🧠 Logical Operators

Use complex conditions with \`$and\`, \`$or\`, \`$not\`:

\`\`\`json
{
  "conditions": [
    {
      "$and": [
        {"query": {"status": "active"}},
        {"query": {"department": "IT"}}
      ],
      "response": {
        "status": 200,
        "data": [{"id": 1, "name": "Active IT User"}]
      }
    }
  ]
}
\`\`\`

## 🎭 Dynamic Variables

Use template variables in responses:

\`\`\`json
{
  "response": {
    "status": 200,
    "data": {
      "id": "{{params.id}}",
      "timestamp": "{{currentTimestamp}}",
      "uuid": "{{randomUUID}}",
      "status": "{{query.status}}"
    }
  }
}
\`\`\`

### Available Variables:

| Variable | Description |
|----------|-------------|
| \`{{params.id}}\` | URL parameters |
| \`{{query.status}}\` | Query parameters |
| \`{{body.name}}\` | Request body fields |
| \`{{currentTimestamp}}\` | Current timestamp |
| \`{{randomUUID}}\` | Random UUID |

## ⏱️ Latency & Failures

Simulate network conditions:

\`\`\`json
{
  "response": {
    "status": 200,
    "latency": 2000,
    "data": {"message": "Slow response"}
  }
}
\`\`\`

Test connection failures:

\`\`\`json
{
  "conditions": [
    {
      "query": {"testReset": "true"},
      "response": {
        "connectionFailure": {
          "type": "reset"
        }
      }
    },
    {
      "query": {"testTimeout": "true"},
      "response": {
        "timeout": true
      }
    }
  ]
}
\`\`\`

## 📤 Creating New Endpoints

### 🌐 Method 1: Admin Interface

1. Go to [/admin](/admin)
2. Click "Upload Configuration"
3. Create your JSON file and upload
4. Server automatically reloads

### 📁 Method 2: File System

1. Create JSON file in \`src/config/routes/\`
2. Follow naming: \`{method}-{endpoint}.json\`
3. Server auto-detects new files

## 🧪 Testing Your Mocks

### Basic Test:
\`\`\`bash
curl http://localhost:3000/api/users
\`\`\`

### Conditional Test:
\`\`\`bash
curl "http://localhost:3000/api/users?status=active"
\`\`\`

### POST Request:
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "New User"}'
\`\`\`

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **❌ No Response** | Check if JSON file exists and is valid |
| **🔄 Wrong Response** | Verify condition matching logic |
| **⏰ Connection Timeout** | Check testTimeout parameter |
| **💥 Server Error** | Check console logs for JSON syntax errors |

> **💡 Pro Tip**: Use the [/admin](/admin) interface to browse and edit configurations in real-time!
`;
  }

  private getDefaultReadme(): string {
    return `# Dynamic Mock Server

A flexible Express.js mock server with dynamic configuration and conditional responses.

## Features
- Dynamic endpoint configuration
- Conditional responses based on request parameters
- Template variables
- Connection failure simulation
- Web-based admin interface

## Quick Start
1. Start the server: \`npm start\`
2. Test endpoints: \`GET /api/users\`
3. Use admin interface: \`/admin\`

## Documentation
Visit /docs for complete documentation.
`;
  }

  private getDefaultQuickRef(): string {
    return `# Quick Reference

## Test Commands
- \`curl http://localhost:3000/api/users\`
- \`curl http://localhost:3000/api/users/1\`

## Admin Interface
- \`/admin\` - Configuration management

## Template Variables
- \`{{params.id}}\` - URL parameters
- \`{{query.status}}\` - Query parameters
- \`{{currentTimestamp}}\` - Current timestamp
`;
  }

  private markdownToHtml(markdown: string): string {
    try {
      const result = marked.parse(markdown);
      // Handle both sync and async returns
      if (typeof result === 'string') {
        return result;
      } else {
        // For async case, return a placeholder for now
        console.warn('Async markdown parsing not supported in sync context');
        return `<p>Processing markdown...</p><pre>${markdown}</pre>`;
      }
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return `<p>Error parsing markdown content</p><pre>${markdown}</pre>`;
    }
  }

  private wrapInHtml(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        code { 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        /* Highlight.js Syntax Highlighting */
        .hljs {
            background: #2b2b2b !important;
            color: #f8f8f2 !important;
            padding: 20px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 15px 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        
        /* JSON syntax highlighting colors */
        .hljs-attr { color: #66d9ef; } /* JSON keys */
        .hljs-string { color: #a6e22e; } /* JSON strings */
        .hljs-number { color: #ae81ff; } /* JSON numbers */
        .hljs-literal { color: #fd971f; } /* JSON booleans */
        .hljs-keyword { color: #f92672; }
        .hljs-comment { color: #75715e; font-style: italic; }
        
        /* Regular pre/code for non-highlighted content */
        pre:not(.hljs) { 
            background: #2c3e50; 
            color: #ecf0f1; 
            padding: 20px; 
            border-radius: 6px; 
            overflow-x: auto; 
            margin: 15px 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        
        pre code:not([class*="language-"]) { 
            background: none; 
            color: inherit; 
            padding: 0; 
        }
        
        /* Inline code */
        code:not([class*="language-"]) { 
            background: #f1f2f6; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        /* Blockquotes */
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 15px 20px;
            background: #f8f9fa;
            font-style: italic;
        }
        
        /* Lists */
        ul, ol {
            padding-left: 25px;
            margin: 15px 0;
        }
        
        li {
            margin: 8px 0;
            line-height: 1.6;
        }
        .nav-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .card {
            background: #fff;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .card:hover {
            border-color: #3498db;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
        }
        .card h3 { margin-top: 0; }
        .card a { text-decoration: none; color: #3498db; }
        .card a:hover { color: #2980b9; }
        .quick-start, .example-commands {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .command-section {
            margin: 15px 0;
        }
        .guide-section {
            margin: 30px 0;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
        }
        .guide-section:last-child {
            border-bottom: none;
        }
        ul, ol { padding-left: 25px; }
        li { margin: 8px 0; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .back-nav {
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .back-nav a {
            color: #666;
            text-decoration: none;
            font-size: 14px;
        }
        .back-nav a:hover { color: #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <div class="back-nav">
            <a href="/docs">← Back to Documentation</a> | 
            <a href="/">Home</a> | 
            <a href="/admin">Admin</a>
        </div>
        ${content}
    </div>
</body>
</html>`;
  }
}