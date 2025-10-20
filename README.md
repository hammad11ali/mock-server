# 🚀 Dynamic Mock Server

A powerful and flexible mock server built with Express and TypeScript that provides highly configurable JSON responses based on request conditions, template variables, and dynamic data processing.

## ✨ Features

- 🎯 **Per-endpoint configuration** - Each API endpoint has its own JSON config file
- 🔀 **Conditional responses** - Different responses based on request parameters, body, headers
- 🧩 **Template variables** - Dynamic data insertion with `{{params.id}}`, `{{currentTimestamp}}`
- ⚡ **Latency simulation** - Configurable delays per request or globally
- 📁 **Flexible data sources** - Use JSON files or embed data directly in configs
- 🎭 **Multiple HTTP status codes** - Simulate various response scenarios
- 🔄 **CRUD operations** - Full support for GET, POST, PUT, DELETE
- 📦 **Easy deployment** - Ready for Vercel and other platforms

## 🏁 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Server runs on `http://localhost:3000`

## 📂 Project Structure

```
src/
├── config/
│   ├── global.json              # Global server settings
│   └── routes/
│       ├── users/
│       │   ├── get-users.json           # GET /api/users
│       │   ├── get-user-by-id.json      # GET /api/users/:id
│       │   └── post-users.json          # POST /api/users
│       └── products/
│           └── get-products.json        # GET /api/products
├── data/
│   ├── users.json               # Sample user data
│   └── products.json            # Sample product data
├── controllers/
│   └── mockController.ts        # Main controller
├── middleware/
│   ├── requestMatcher.ts        # Route matching logic
│   └── responseProcessor.ts     # Response processing
├── utils/
│   ├── configLoader.ts          # Configuration loader
│   ├── templateEngine.ts        # Template variable processor
│   └── conditionEvaluator.ts    # Condition evaluation
└── types/
    └── index.ts                 # TypeScript definitions
```

## 🎯 Creating Mock Responses

This is the comprehensive guide to creating powerful mock responses for your API endpoints.

### 1. **Basic Route Configuration**

Create a JSON file in `src/config/routes/{resource}/{method}-{endpoint}.json`:

```json
{
  "method": "GET",
  "path": "/api/users/:id",
  "conditions": [
    {
      "when": {
        "params.id": "123"
      },
      "response": {
        "statusCode": 200,
        "body": {
          "data": {
            "id": "123",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      }
    }
  ],
  "defaultResponse": {
    "statusCode": 404,
    "body": {
      "data": {
        "error": "User not found"
      }
    }
  }
}
```

### 2. **Condition Types**

#### **Path Parameters**
```json
{
  "when": {
    "params.id": "123",           // Exact match
    "params.userId": { "exists": true }  // Check existence
  }
}
```

#### **Query Parameters**
```json
{
  "when": {
    "query.status": "active",     // Exact match
    "query.limit": { "exists": true },   // Parameter exists
    "query.page": { "greaterThan": 0 }   // Numeric comparison
  }
}
```

#### **Request Body**
```json
{
  "when": {
    "body.email": { "exists": true },    // Field exists
    "body.role": "admin",                // Exact match
    "body.name": { "contains": "John" }  // String contains
  }
}
```

#### **Headers**
```json
{
  "when": {
    "headers.authorization": { "exists": true },
    "headers.content-type": "application/json"
  }
}
```

### 3. **Condition Operators**

```json
{
  "when": {
    "query.age": { "greaterThan": 18 },
    "query.score": { "lessThan": 100 },
    "query.name": { "startsWith": "John" },
    "query.email": { "endsWith": "@company.com" },
    "query.status": { "in": ["active", "pending"] },
    "query.search": { "contains": "keyword" },
    "query.required": { "exists": true }
  }
}
```

### 4. **Response Configuration**

#### **Status Codes**
```json
{
  "response": {
    "statusCode": 200,    // 200, 201, 400, 401, 404, 500, etc.
    "body": { "data": "response data" }
  }
}
```

#### **Latency Simulation**
```json
{
  "response": {
    "statusCode": 200,
    "body": { "data": "slow response" },
    "latency": {
      "enabled": true,
      "delay": 2000           // Fixed 2 second delay
    }
  }
}
```

```json
{
  "response": {
    "statusCode": 200,
    "body": { "data": "random delay" },
    "latency": {
      "enabled": true,
      "min": 500,             // Random delay between 500-2000ms
      "max": 2000
    }
  }
}
```

#### **Timeout Simulation**
```json
{
  "response": {
    "statusCode": 408,
    "body": { "error": "Request timeout" },
    "timeout": 5000           // 5 second timeout
  }
}
```

## 🧩 Template Variables

Use template variables to create dynamic responses:

### **System Variables**
```json
{
  "data": {
    "id": "{{generateId}}",         // Random UUID
    "timestamp": "{{currentTimestamp}}", // ISO timestamp
    "date": "{{currentDate}}",      // Current date (YYYY-MM-DD)
    "random": "{{randomNumber}}",   // Random number 1-1000
    "email": "{{randomEmail}}"      // Generated email
  }
}
```

### **Request Variables**
```json
{
  "data": {
    "userId": "{{params.id}}",      // Path parameter
    "status": "{{query.status}}",   // Query parameter
    "name": "{{body.name}}",        // Request body field
    "auth": "{{headers.authorization}}" // Header value
  }
}
```

### **Dynamic Response Examples**
```json
{
  "method": "GET",
  "path": "/api/users/:id",
  "conditions": [
    {
      "when": {
        "params.id": { "exists": true }
      },
      "response": {
        "statusCode": 200,
        "body": {
          "data": {
            "id": "{{params.id}}",
            "name": "User {{params.id}}",
            "email": "user{{params.id}}@example.com",
            "createdAt": "{{currentTimestamp}}",
            "profile": {
              "displayName": "User #{{params.id}}",
              "lastLogin": "{{currentDate}}"
            }
          }
        }
      }
    }
  ]
}
```

## 📁 Data Sources

### **Option 1: Direct Data**
Embed response data directly in the config:

```json
{
  "response": {
    "statusCode": 200,
    "body": {
      "data": {
        "users": [
          { "id": 1, "name": "John Doe" },
          { "id": 2, "name": "Jane Smith" }
        ],
        "total": 2
      }
    }
  }
}
```

### **Option 2: Data File Reference**
Reference external JSON data files:

```json
{
  "response": {
    "statusCode": 200,
    "body": {
      "dataFile": "users.json"      // Loads from src/data/users.json
    }
  }
}
```

### **Option 3: Filtered Data**
Filter data from files based on conditions:

```json
{
  "response": {
    "statusCode": 200,
    "body": {
      "dataFile": "users.json",
      "filter": { 
        "status": "active",           // Only active users
        "role": "admin"               // Only admin users
      },
      "limit": 10                     // Limit to 10 results
    }
  }
}
```

### **Option 4: Mixed Data**
Combine file data with dynamic fields:

```json
{
  "response": {
    "statusCode": 200,
    "body": {
      "dataFile": "users.json",
      "dynamicFields": {
        "requestId": "{{generateId}}",
        "timestamp": "{{currentTimestamp}}",
        "requestedBy": "{{params.id}}"
      }
    }
  }
}
```

## 🎛️ Advanced Examples

### **Complex User API**
```json
{
  "method": "POST",
  "path": "/api/users",
  "conditions": [
    {
      "when": {
        "body.email": { "exists": false }
      },
      "response": {
        "statusCode": 400,
        "body": {
          "data": {
            "error": "Email is required",
            "code": "VALIDATION_ERROR",
            "field": "email"
          }
        }
      }
    },
    {
      "when": {
        "body.email": "admin@example.com"
      },
      "response": {
        "statusCode": 409,
        "body": {
          "data": {
            "error": "User already exists",
            "code": "DUPLICATE_EMAIL",
            "email": "{{body.email}}"
          }
        },
        "latency": {
          "enabled": true,
          "delay": 300
        }
      }
    },
    {
      "when": {
        "body.role": "premium"
      },
      "response": {
        "statusCode": 201,
        "body": {
          "data": {
            "id": "{{generateId}}",
            "name": "{{body.name}}",
            "email": "{{body.email}}",
            "role": "premium",
            "features": ["analytics", "priority_support"],
            "createdAt": "{{currentTimestamp}}",
            "welcomeMessage": "Welcome, premium user!"
          }
        }
      }
    }
  ],
  "defaultResponse": {
    "statusCode": 201,
    "body": {
      "data": {
        "id": "{{generateId}}",
        "name": "{{body.name}}",
        "email": "{{body.email}}",
        "role": "user",
        "status": "active",
        "createdAt": "{{currentTimestamp}}"
      }
    }
  }
}
```

### **Search API with Pagination**
```json
{
  "method": "GET",
  "path": "/api/search",
  "conditions": [
    {
      "when": {
        "query.q": { "exists": false }
      },
      "response": {
        "statusCode": 400,
        "body": {
          "data": {
            "error": "Search query required",
            "parameter": "q"
          }
        }
      }
    },
    {
      "when": {
        "query.q": "error"
      },
      "response": {
        "statusCode": 500,
        "body": {
          "data": {
            "error": "Search service unavailable",
            "retryAfter": 30
          }
        },
        "latency": {
          "enabled": true,
          "delay": 5000
        }
      }
    }
  ],
  "defaultResponse": {
    "statusCode": 200,
    "body": {
      "data": {
        "query": "{{query.q}}",
        "results": [
          {
            "id": "{{generateId}}",
            "title": "Search result for {{query.q}}",
            "score": "{{randomNumber}}"
          }
        ],
        "pagination": {
          "page": "{{query.page}}",
          "limit": "{{query.limit}}",
          "total": "{{randomNumber}}"
        },
        "executedAt": "{{currentTimestamp}}"
      }
    }
  }
}
```

## 🌍 Global Configuration

Configure server defaults in `src/config/global.json`:

```json
{
  "defaults": {
    "latency": {
      "enabled": false,
      "min": 100,
      "max": 500
    },
    "timeout": 5000,
    "statusCode": 200
  },
  "server": {
    "corsEnabled": true,
    "requestLogging": true
  },
  "templateVariables": {
    "system": {
      "currentTimestamp": "function",
      "currentDate": "function",
      "generateId": "function",
      "randomNumber": "function",
      "randomEmail": "function"
    }
  }
}
```

## 🧪 Testing Your Mocks

### **Available Endpoints**
- `GET /` - Health check and configuration info
- `GET /api/users` - List users (with filtering)
- `GET /api/users/:id` - Get user by ID (with template variables)
- `POST /api/users` - Create user (with validation)
- `GET /api/products` - List products (with categories)

### **Test with curl**
```bash
# Get user by ID
curl "http://localhost:3000/api/users/123"

# Create user
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Filter products
curl "http://localhost:3000/api/products?category=electronics"
```

## 🚀 Deployment

### **Vercel Deployment**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### **Environment Variables**
```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment
```

## 📚 API Reference

### **Configuration File Schema**
```typescript
interface RouteConfig {
  method: string;              // HTTP method
  path: string;                // Route path with parameters
  conditions?: Array<{         // Conditional responses
    when: Record<string, any>; // Condition criteria
    response: RouteResponse;   // Response configuration
  }>;
  defaultResponse: RouteResponse; // Fallback response
}

interface RouteResponse {
  statusCode: number;          // HTTP status code
  body: ResponseBody;          // Response data
  latency?: LatencyConfig;     // Delay configuration
  timeout?: number;            // Request timeout
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎉 Happy Mocking! Build powerful, flexible APIs for testing and development.**