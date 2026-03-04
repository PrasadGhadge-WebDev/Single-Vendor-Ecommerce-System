# 📡 API Endpoints Reference

## Base URL
```
http://localhost:5000
```

> **Important**: Frontend uses axios instance with this baseURL, so all paths are relative (no need to include full URL)

---

## 🔐 Authentication Routes (`/api/auth`)

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "isAdmin": false
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "user": { _id, name, email, isAdmin }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": { _id, name, email, isAdmin }
}
```

---

## 📦 Product Routes (`/api/products`)

### Get All Products
```
GET /api/products
Query: ?category=electronics&limit=10&page=1

Response:
{
  "success": true,
  "total": 50,
  "products": [
    {
      _id: "...",
      name: "Product Name",
      price: 99.99,
      image: "filename.jpg",
      category: "electronics",
      description: "...",
      stock: 10,
      createdAt: "..."
    },
    ...
  ]
}
```

### Get Single Product
```
GET /api/products/:id

Response:
{
  "success": true,
  "product": { ... }
}
```

### Add Product (Admin Only)
```
POST /api/products
Authorization: Bearer token
Content-Type: multipart/form-data

body:
- name: "New Product"
- price: 99.99
- description: "Product description"
- category: "electronics"
- stock: 10
- image: [file]

Response:
{
  "success": true,
  "message": "Product added successfully",
  "product": { ... }
}
```

### Update Product (Admin Only)
```
PUT /api/products/:id
Authorization: Bearer token
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 89.99,
  "description": "...",
  "category": "...",
  "stock": 5
}

Response:
{
  "success": true,
  "message": "Product updated successfully",
  "product": { ... }
}
```

### Delete Product (Admin Only)
```
DELETE /api/products/:id
Authorization: Bearer token

Response:
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 🛒 Order Routes (`/api/orders`)

### Create Order
```
POST /api/orders
Authorization: Bearer token
Content-Type: application/json

{
  "items": [
    {
      productId: "...",
      quantity: 2,
      price: 99.99
    }
  ],
  "shippingInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "phone": "1234567890"
  },
  "paymentMethod": "credit_card",
  "totalPrice": 199.98
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "order": { _id, items, totalPrice, status, ... }
}
```

### Get All Orders (Admin Only)
```
GET /api/orders
Authorization: Bearer token

Response:
{
  "success": true,
  "orders": [
    {
      _id: "...",
      userId: "...",
      items: [...],
      totalPrice: 199.98,
      status: "pending",
      shippingInfo: {...},
      paymentMethod: "credit_card",
      createdAt: "..."
    },
    ...
  ]
}
```

### Get User's Orders
```
GET /api/orders/my-orders
Authorization: Bearer token

Response:
{
  "success": true,
  "orders": [...]
}
```

### Get Dashboard Stats (Admin Only)
```
GET /api/orders/stats/dashboard
Authorization: Bearer token

Response:
{
  "success": true,
  "stats": {
    "totalOrders": 42,
    "totalRevenue": 5000.00,
    "totalUsers": 15,
    "totalProducts": 120
  }
}
```

### Update Order Status (Admin Only)
```
PUT /api/orders/:id/status
Authorization: Bearer token
Content-Type: application/json

{
  "status": "processing"
}

Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "order": { ..., status: "processing" }
}
```

---

## 👥 User Routes (`/api/users`)

### Get All Users (Admin Only)
```
GET /api/users
Authorization: Bearer token

Response:
{
  "success": true,
  "users": [
    {
      _id: "...",
      name: "John Doe",
      email: "john@example.com",
      isAdmin: false,
      createdAt: "..."
    },
    ...
  ]
}
```

### Get Current User Profile
```
GET /api/users/profile
Authorization: Bearer token

Response:
{
  "success": true,
  "user": { _id, name, email, isAdmin, ... }
}
```

### Update User (Admin Only)
```
PUT /api/users/:id
Authorization: Bearer token
Content-Type: application/json

{
  "name": "New Name",
  "isAdmin": true
}

Response:
{
  "success": true,
  "message": "User updated successfully",
  "user": { ... }
}
```

---

## 🏷️ Category Routes (`/api/categories`)

### Get All Categories
```
GET /api/categories

Response:
{
  "success": true,
  "categories": [
    {
      _id: "...",
      name: "Electronics",
      description: "...",
      createdAt: "..."
    },
    ...
  ]
}
```

### Create Category (Admin Only)
```
POST /api/categories
Authorization: Bearer token
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description"
}

Response:
{
  "success": true,
  "message": "Category created successfully",
  "category": { ... }
}
```

### Update Category (Admin Only)
```
PUT /api/categories/:id
Authorization: Bearer token
Content-Type: application/json

{
  "name": "Updated Category",
  "description": "..."
}

Response:
{
  "success": true,
  "message": "Category updated successfully",
  "category": { ... }
}
```

### Delete Category (Admin Only)
```
DELETE /api/categories/:id
Authorization: Bearer token

Response:
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 🔑 Authentication

All protected endpoints require:
```
Authorization: Bearer <token>
```

Token is stored in localStorage with key `token` after login.

Frontend axios interceptor automatically adds this header to all requests.

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing token) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Testing with Postman

1. **Register**: POST to `http://localhost:5000/api/auth/register` with user data
2. **Login**: POST to `http://localhost:5000/api/auth/login` - Copy token from response
3. **Add Token to Header**: In Postman, go to Authorization tab → Type: Bearer Token → Paste token
4. **All Protected Requests**: Now include `Authorization: Bearer <token>` header automatically

---

## 🔍 Debugging API Issues

### Check Network Tab
1. Open DevTools (F12) → Network tab
2. Perform action (e.g., login)
3. Look for red/failed requests
4. Click request to see:
   - URL (should match backend route)
   - Status Code
   - Request Headers (Authorization header present?)
   - Response body (error message)

### Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing/invalid token | Login first, check token in localStorage |
| 403 Forbidden | Not admin | User doesn't have isAdmin: true |
| 404 Not Found | Wrong endpoint path | Check frontend API path vs this reference |
| CORS error | Frontend-backend mismatch | Backend CORS already allows any port |

### Example Working Request
```javascript
// In browser console:
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/orders/stats/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## Frontend API Usage

All requests already set up in `client/src/api.js`:

```javascript
import API from './api';

// Don't add /api/ prefix - baseURL already has it!
API.get('/products')                    // ✅ Correct
API.get('/api/products')                // ❌ Wrong - adds /api twice

// Token auto-included by interceptor
API.post('/orders', {items, totalPrice})  // ✅ Correct
```

---

**Last Updated**: Session complete
**All Endpoints**: ✅ Working & tested
