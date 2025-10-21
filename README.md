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

### 3. **Multiple Conditions & Logical Operators**

#### **Implicit AND (All conditions must match)**
```json
{
  "when": {
    "query.status": "active",
    "query.limit": { "exists": true },
    "headers.authorization": { "exists": true }
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "All conditions matched (implicit AND)"
    }
  }
}
```

#### **Explicit AND Logic**
```json
{
  "when": {
    "$and": [
      { "query.status": { "not": "inactive" } },
      { "query.role": { "exists": true } },
      { "query.limit": { "greaterThan": 0 } }
    ]
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "Explicit AND conditions matched"
    }
  }
}
```

#### **OR Logic (Any condition must match)**
```json
{
  "when": {
    "$or": [
      { "query.status": "premium" },
      { "query.role": "admin" },
      { "headers.x-special-access": { "exists": true } }
    ]
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "One of the OR conditions matched"
    }
  }
}
```

#### **NOT Logic (Condition must not match)**
```json
{
  "when": {
    "$not": {
      "query.status": "banned"
    }
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "User is not banned"
    }
  }
}
```

#### **Complex Nested Logic**
```json
{
  "when": {
    "$and": [
      {
        "$or": [
          { "query.status": "active" },
          { "query.status": "premium" }
        ]
      },
      { "query.limit": { "exists": true } },
      {
        "$not": {
          "query.role": "guest"
        }
      }
    ]
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "Complex nested conditions matched"
    }
  }
}
```

### 4. **Field-Level Condition Operators**

```json
{
  "when": {
    "query.age": { "greaterThan": 18 },
    "query.score": { "lessThan": 100 },
    "query.name": { "startsWith": "John" },
    "query.email": { "endsWith": "@company.com" },
    "query.status": { "in": ["active", "pending"] },
    "query.search": { "contains": "keyword" },
    "query.required": { "exists": true },
    "query.role": { "not": "guest" }
  }
}
```

#### **Complete Operator Reference**

| **Operator** | **Usage** | **Description** |
|-------------|-----------|-----------------|
| **Direct match** | `"field": "value"` | Exact value match |
| **exists** | `{ "exists": true/false }` | Field exists/doesn't exist |
| **not** | `{ "not": "value" }` | Field not equal to value |
| **in** | `{ "in": ["val1", "val2"] }` | Value in array |
| **contains** | `{ "contains": "substring" }` | String contains substring |
| **startsWith** | `{ "startsWith": "prefix" }` | String starts with prefix |
| **endsWith** | `{ "endsWith": "suffix" }` | String ends with suffix |
| **greaterThan** | `{ "greaterThan": 18 }` | Numeric greater than |
| **lessThan** | `{ "lessThan": 100 }` | Numeric less than |
| **$and** | `{ "$and": [cond1, cond2] }` | All conditions must match |
| **$or** | `{ "$or": [cond1, cond2] }` | Any condition must match |
| **$not** | `{ "$not": condition }` | Condition must not match |

### 5. **Response Configuration**

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
    "statusCode": 200,
    "body": { "message": "This will timeout" },
    "timeout": true           // Boolean flag - defaults to 5s
  }
}
```

```json
{
  "response": {
    "statusCode": 200,
    "body": { "message": "Custom timeout" },
    "timeout": 3000           // Numeric timeout in milliseconds
  }
}
```

#### **Connection Failure Simulation**
```json
{
  "response": {
    "statusCode": 200,
    "body": { "message": "Connection will be reset" },
    "connectionFailure": {
      "type": "reset",        // "reset" or "silent"
      "delay": 500           // Optional delay before failure
    }
  }
}
```

```json
{
  "response": {
    "statusCode": 200,
    "body": { "message": "Server will not respond" },
    "connectionFailure": {
      "type": "silent"       // Server accepts but never responds
    }
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

## 🧪 Comprehensive Testing Guide

This mock server provides extensive testing capabilities to simulate real-world API scenarios, including network failures, timeouts, latency, and various response conditions.

### **🎯 Available Test Endpoints**

#### **Users API (`/api/users`)**
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID  
- `POST /api/users` - Create new user

#### **Products API (`/api/products`)**
- `GET /api/products` - List all products

#### **Admin Interface (`/admin`)**
- `GET /admin` - Web-based file management interface
- `GET /admin/files` - List configuration files
- `POST /admin/files/upload` - Upload configuration files
- `GET /admin/routes` - View all configured routes

---

## 🌊 **Response Flow Testing**

### **1. Normal Responses**
Test standard API responses with various conditions:

```bash
# Basic user listing
curl "http://localhost:3000/api/users?status=active"

# Get specific user
curl "http://localhost:3000/api/users/123"

# Create user with validation
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","role":"premium"}'

# Filter products by category
curl "http://localhost:3000/api/products?category=electronics"

# Featured products
curl "http://localhost:3000/api/products?featured=true"
```

### **2. Conditional Logic Testing**

#### **Implicit AND Conditions**
```bash
# All conditions must match
curl "http://localhost:3000/api/users?status=active&limit=5"
# Returns: Active users with pagination
```

#### **Explicit OR Logic**
```bash
# Any condition matches
curl "http://localhost:3000/api/users?status=premium"
curl "http://localhost:3000/api/users?role=vip"
# Returns: Premium users OR VIP users
```

#### **Complex Nested Logic**
```bash
# AND + OR + NOT combinations
curl "http://localhost:3000/api/users?status=active&role=admin"
# Returns: Active users who are NOT guests with roles
```

### **3. Validation & Error Testing**

#### **Missing Required Fields**
```bash
# Missing email - returns 400
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'
```

#### **Duplicate Resources**
```bash
# Duplicate email - returns 409
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com"}'
```

#### **Resource Not Found**
```bash
# Non-existent user - returns 404
curl "http://localhost:3000/api/users/999"
```

---

## ⏱️ **Performance & Timing Testing**

### **1. Latency Simulation**
Test API performance under various network conditions:

```bash
# Fast response (200ms delay)
curl "http://localhost:3000/api/users?status=active&limit=10"

# Slow response (300ms delay)  
curl "http://localhost:3000/api/users?status=active"

# Variable latency (different delays per request)
curl "http://localhost:3000/api/products"
```

### **2. Timeout Testing**

#### **Server-Side Timeout (408 Response)**
```bash
# Request configured to timeout after 5 seconds
curl "http://localhost:3000/api/users?test=timeout"
# Returns: 408 Request Timeout after 5s
```

#### **Default Response Timeout**
```bash
# Default endpoint timeout (3 seconds)
curl "http://localhost:3000/api/users"
# Returns: 408 Request Timeout after 3s
```

---

## 🔌 **Connection Failure Testing**

### **1. Connection Reset (ECONNRESET)**
Simulate server crashes or network interruptions:

```bash
# Connection reset after 500ms
curl "http://localhost:3000/api/users?simulate=connection_reset"
# Result: "Connection was closed unexpectedly"
```

**PowerShell equivalent:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users?simulate=connection_reset"
# Result: WebException - Connection closed unexpectedly
```

### **2. Silent Timeout (No Response)**
Simulate unresponsive servers:

```bash
# Server accepts connection but never responds
curl --max-time 10 "http://localhost:3000/api/users?simulate=silent_timeout"
# Result: "Operation timed out after 10000 milliseconds"
```

**PowerShell with timeout:**
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/users?simulate=silent_timeout" -TimeoutSec 5
} catch {
    Write-Host "Timeout: $($_.Exception.Message)"
}
```

---

## 🎭 **Status Code Testing**

Test various HTTP status codes and their scenarios:

```bash
# 200 - Success responses
curl "http://localhost:3000/api/users?status=active"

# 201 - Created (new user)
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com"}'

# 400 - Bad Request (missing email)
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'

# 404 - Not Found (non-existent user)
curl "http://localhost:3000/api/users/999"

# 408 - Request Timeout
curl "http://localhost:3000/api/users?test=timeout"

# 409 - Conflict (duplicate email)
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com"}'
```

---

## 🧩 **Template Variable Testing**

Test dynamic data generation and request variable insertion:

### **System Variables**
```bash
# Generate dynamic IDs and timestamps
curl "http://localhost:3000/api/users/456"
# Response includes: generateId, currentTimestamp, etc.
```

### **Request Parameters**
```bash
# Path parameters
curl "http://localhost:3000/api/users/123"
# Response: {"id": "123", "name": "User 123", ...}

# Query parameters  
curl "http://localhost:3000/api/users?limit=5&status=active"
# Response includes: limit=5, appliedFilters with status
```

### **Request Body Variables**
```bash
# Body data in response
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"TestUser","email":"test@example.com","role":"premium"}'
# Response echoes: name, email, role from request
```

---

## 📊 **Data Filtering & Pagination Testing**

### **Filtering**
```bash
# Filter by status
curl "http://localhost:3000/api/users?status=active"

# Complex filtering (implicit AND)
curl "http://localhost:3000/api/users?status=active&limit=3"
```

### **Pagination**
```bash
# Limit results
curl "http://localhost:3000/api/users?limit=2"

# Pagination with status filter
curl "http://localhost:3000/api/users?status=active&limit=5"
```

---

## 🎪 **Complete Test Suite Examples**

### **User Management Testing**
```bash
#!/bin/bash
echo "=== User Management Test Suite ==="

echo "1. Create new user..."
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

echo -e "\n2. Get specific user..."
curl "http://localhost:3000/api/users/123"

echo -e "\n3. List active users..."
curl "http://localhost:3000/api/users?status=active"

echo -e "\n4. Test validation error..."
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"No Email User"}'

echo -e "\n5. Test timeout..."
curl --max-time 6 "http://localhost:3000/api/users?test=timeout"
```

### **Connection Failure Testing**
```bash
#!/bin/bash
echo "=== Connection Failure Test Suite ==="

echo "1. Normal request..."
curl "http://localhost:3000/api/users?status=active"

echo -e "\n2. Connection reset test..."
curl "http://localhost:3000/api/users?simulate=connection_reset" || echo "Expected: Connection reset"

echo -e "\n3. Silent timeout test..."
curl --max-time 3 "http://localhost:3000/api/users?simulate=silent_timeout" || echo "Expected: Timeout"

echo -e "\n4. Server timeout test..."
curl --max-time 6 "http://localhost:3000/api/users?test=timeout" || echo "Expected: 408 timeout response"
```

### **Performance Testing**
```bash
#!/bin/bash
echo "=== Performance Test Suite ==="

echo "1. Fast response (200ms latency)..."
time curl "http://localhost:3000/api/users?status=active&limit=10"

echo -e "\n2. Slow response (300ms latency)..."
time curl "http://localhost:3000/api/users?status=active"

echo -e "\n3. Variable latency..."
for i in {1..3}; do
  echo "Request $i:"
  time curl "http://localhost:3000/api/products"
done
```

---

## 🔧 **Admin Interface Testing**

### **Web Interface**
Visit `http://localhost:3000/admin` to access the web-based admin interface:

- **File Browser**: View, upload, download, delete configuration files
- **Routes Overview**: See all configured routes and their conditions
- **Real-time Updates**: Modify configurations without server restart

### **Admin API Testing**
```bash
# List all configuration files
curl "http://localhost:3000/admin/files"

# Get server status
curl "http://localhost:3000/admin/status"

# List all routes
curl "http://localhost:3000/admin/routes"

# Download specific configuration
curl -O "http://localhost:3000/admin/files/download/config/routes/users/get-users.json"
```

---

## 🎯 **Testing Quick Reference**

| **Test Type** | **Endpoint** | **Expected Result** |
|--------------|-------------|-------------------|
| **Normal Response** | `GET /api/users?status=active` | 200 with user data |
| **Validation Error** | `POST /api/users` (no email) | 400 Bad Request |
| **Not Found** | `GET /api/users/999` | 404 Not Found |
| **Duplicate Resource** | `POST /api/users` (admin email) | 409 Conflict |
| **Server Timeout** | `GET /api/users?test=timeout` | 408 after 5s |
| **Connection Reset** | `GET /api/users?simulate=connection_reset` | Connection error |
| **Silent Timeout** | `GET /api/users?simulate=silent_timeout` | Client timeout |
| **Latency Test** | `GET /api/users?status=active` | 300ms delay |
| **Template Variables** | `GET /api/users/123` | Dynamic data with ID |
| **Complex Logic** | `GET /api/users?status=premium` | OR condition match |

---

## 🚀 **Production Testing Tips**

1. **Use different HTTP clients** to test various error handling:
   - `curl` - Command line testing
   - `Postman` - GUI testing with collections
   - `fetch()` - JavaScript client testing
   - `axios` - Node.js/React testing

2. **Test client timeout handling**:
   ```javascript
   // JavaScript example
   fetch('/api/users?simulate=silent_timeout', { 
     signal: AbortSignal.timeout(3000) 
   })
   .catch(err => console.log('Client timeout:', err));
   ```

3. **Test retry logic** with connection reset:
   ```bash
   # Test exponential backoff
   for i in {1..3}; do
     echo "Attempt $i"
     curl "http://localhost:3000/api/users?simulate=connection_reset"
     sleep $((i * 2))
   done
   ```

4. **Load testing** with concurrent requests:
   ```bash
   # Test concurrent requests
   for i in {1..10}; do
     curl "http://localhost:3000/api/users?status=active" &
   done
   wait
   ```

**🎉 Ready to test every possible scenario your API clients might encounter!**

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