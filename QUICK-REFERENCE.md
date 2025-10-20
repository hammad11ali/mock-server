# 🚀 Dynamic Mock Server - Quick Reference

## 📋 Quick Command Reference

### **Start Server**
```bash
npm run dev      # Development with ts-node
npm start        # Production (requires npm run build first)
npm run build    # Build TypeScript to JavaScript
```

### **Basic Endpoint Tests**
```bash
# Health check
curl http://localhost:3000/

# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/123

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com"}'
```

### **Multiple Conditions Tests**
```bash
# Implicit AND: status=active AND limit exists
curl "http://localhost:3000/api/users?status=active&limit=2"

# OR logic: premium users OR admin role
curl "http://localhost:3000/api/users?status=premium"
curl "http://localhost:3000/api/users?role=admin"

# Complex conditions: non-inactive users with role
curl "http://localhost:3000/api/users?status=active&role=user"

# PowerShell alternative (Windows)
Invoke-RestMethod "http://localhost:3000/api/users?status=active&limit=2"
```

## 🎯 Configuration Quick Start

### **1. Basic Route Config**
File: `src/config/routes/users/get-users.json`
```json
{
  "method": "GET",
  "path": "/users",
  "conditions": [
    {
      "when": { "query.status": "active" },
      "response": {
        "statusCode": 200,
        "body": { "dataFile": "users.json", "filter": { "status": "active" } }
      }
    }
  ],
  "defaultResponse": {
    "statusCode": 200,
    "body": { "dataFile": "users.json" }
  }
}
```

### **2. Multiple Conditions Examples**

#### **Implicit AND (All must match)**
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
      "dataFile": "users.json",
      "filter": { "status": "active" },
      "limit": "{{query.limit}}"
    }
  }
}
```

#### **OR Logic (Any must match)**
```json
{
  "when": {
    "$or": [
      { "query.status": "premium" },
      { "query.role": "admin" },
      { "headers.x-vip-access": { "exists": true } }
    ]
  },
  "response": {
    "statusCode": 200,
    "body": {
      "message": "VIP access granted",
      "accessLevel": "premium"
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
      { "query.role": { "not": "guest" } }
    ]
  },
  "response": {
    "statusCode": 200,
    "body": {
      "dataFile": "users.json",
      "dynamicFields": {
        "message": "Complex condition matched",
        "userType": "{{query.status}}",
        "role": "{{query.role}}"
      }
    }
  }
}
```

### **3. Create Data File**
File: `src/data/users.json`
```json
[
  { "id": 1, "name": "John", "status": "active" },
  { "id": 2, "name": "Jane", "status": "inactive" }
]
```

## 🧩 Template Variables Cheat Sheet

| Variable | Description | Example |
|----------|-------------|---------|
| `{{params.id}}` | Path parameter | `/users/123` → `"123"` |
| `{{query.status}}` | Query parameter | `?status=active` → `"active"` |
| `{{body.name}}` | Request body field | POST data → field value |
| `{{headers.auth}}` | Request header | Header value |
| `{{generateId}}` | Random UUID | `"f47ac10b-58cc-4372..."` |
| `{{currentTimestamp}}` | ISO timestamp | `"2025-10-20T14:30:00Z"` |
| `{{currentDate}}` | Current date | `"2025-10-20"` |
| `{{randomNumber}}` | Random 1-1000 | `"742"` |
| `{{randomEmail}}` | Generated email | `"user8392@example.com"` |

## 🎛️ Condition Operators

### **Field-Level Operators**
| Operator | Example | Description |
|----------|----------|-------------|
| Direct match | `"status": "active"` | Exact string match |
| `exists` | `"email": { "exists": true }` | Field must exist |
| `not` | `"role": { "not": "guest" }` | Field not equal to value |
| `contains` | `"name": { "contains": "John" }` | String contains |
| `startsWith` | `"email": { "startsWith": "admin" }` | String starts with |
| `endsWith` | `"email": { "endsWith": ".com" }` | String ends with |
| `greaterThan` | `"age": { "greaterThan": 18 }` | Numeric comparison |
| `lessThan` | `"score": { "lessThan": 100 }` | Numeric comparison |
| `in` | `"role": { "in": ["admin", "user"] }` | Value in array |

### **Logical Operators**
| Operator | Example | Description |
|----------|---------|-------------|
| **Implicit AND** | `{ "status": "active", "limit": { "exists": true } }` | All conditions must match |
| **`$and`** | `{ "$and": [{"status": "active"}, {"role": "admin"}] }` | Explicit AND logic |
| **`$or`** | `{ "$or": [{"status": "premium"}, {"role": "vip"}] }` | Any condition must match |
| **`$not`** | `{ "$not": {"status": "banned"} }` | Condition must not match |

## 📁 Response Body Options

### **Direct Data**
```json
{
  "body": {
    "data": { "id": 1, "name": "Direct response" }
  }
}
```

### **File Reference**
```json
{
  "body": {
    "dataFile": "users.json"
  }
}
```

### **Filtered File Data**
```json
{
  "body": {
    "dataFile": "users.json",
    "filter": { "status": "active" },
    "limit": 5
  }
}
```

### **Mixed Data**
```json
{
  "body": {
    "dataFile": "users.json",
    "dynamicFields": {
      "requestId": "{{generateId}}",
      "timestamp": "{{currentTimestamp}}"
    }
  }
}
```

## ⚡ Latency & Timing

### **Fixed Delay**
```json
{
  "latency": {
    "enabled": true,
    "delay": 2000
  }
}
```

### **Random Delay**
```json
{
  "latency": {
    "enabled": true,
    "min": 500,
    "max": 2000
  }
}
```

### **Timeout**
```json
{
  "timeout": 5000
}
```

## 🎭 Common HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| `200` | OK | Successful GET |
| `201` | Created | Successful POST |
| `400` | Bad Request | Validation error |
| `401` | Unauthorized | Auth required |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Duplicate resource |
| `500` | Server Error | Internal error |

## 📂 File Naming Convention

| Method | Path | Filename |
|--------|------|----------|
| GET | `/api/users` | `get-users.json` |
| GET | `/api/users/:id` | `get-user-by-id.json` |
| POST | `/api/users` | `post-users.json` |
| PUT | `/api/users/:id` | `put-user-by-id.json` |
| DELETE | `/api/users/:id` | `delete-user-by-id.json` |

## 🔧 Troubleshooting

### **Config Not Loading**
- Check file path: `src/config/routes/{resource}/{method}-{endpoint}.json`
- Validate JSON syntax
- Check server logs for errors

### **Template Variables Not Working**
- Ensure correct syntax: `{{variable.name}}`
- Check available variables in logs
- Verify request contains expected data

### **Conditions Not Matching**
- Check condition syntax
- Log request data to verify values
- Test with simpler conditions first

### **Logical Operators Not Working**
- Ensure correct `$and`, `$or`, `$not` syntax
- Check array format: `"$or": [condition1, condition2]`
- Verify nested conditions are valid
- Test individual conditions before combining

### **Performance Issues**
- Use implicit AND when possible (faster than `$and`)
- Avoid deeply nested logical structures
- Consider condition order (most specific first)

---

**💡 Pro Tips:** 
- Start simple and add complexity gradually
- Test each condition individually before combining
- Use implicit AND (`{"a": "1", "b": "2"}`) for better performance than explicit `$and`
- Place most specific conditions first for better matching