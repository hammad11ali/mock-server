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

## 🎯 Configuration Quick Start

### **1. Create Route Config**
File: `src/config/routes/users/get-users.json`
```json
{
  "method": "GET",
  "path": "/api/users",
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

### **2. Create Data File**
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

| Operator | Example | Description |
|----------|----------|-------------|
| Direct match | `"status": "active"` | Exact string match |
| `exists` | `"email": { "exists": true }` | Field must exist |
| `contains` | `"name": { "contains": "John" }` | String contains |
| `startsWith` | `"email": { "startsWith": "admin" }` | String starts with |
| `endsWith` | `"email": { "endsWith": ".com" }` | String ends with |
| `greaterThan` | `"age": { "greaterThan": 18 }` | Numeric comparison |
| `lessThan` | `"score": { "lessThan": 100 }` | Numeric comparison |
| `in` | `"role": { "in": ["admin", "user"] }` | Value in array |

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

---

**💡 Pro Tip:** Start simple and add complexity gradually. Test each condition individually before combining them!