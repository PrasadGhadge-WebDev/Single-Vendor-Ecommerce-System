# 🧪 Testing Guide - Create Test Data

## Prerequisites
- MongoDB running locally or on MongoDB Atlas
- MongoDB Compass or mongosh CLI
- Backend running on port 5000
- Frontend running on port 5173

---

## Method 1: Using Postman (Recommended)

### Step 1: Create Customer User

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Customer",
  "email": "customer@test.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439001",
  "name": "John Customer",
  "email": "customer@test.com",
  "isAdmin": false,
  "token": "eyJhbGciOi..."
}
```

Save the token for later use.

---

### Step 2: Create Admin User

**In MongoDB Compass or mongosh**, connect to your database and run:

```javascript
// Connect to ecommerce database
use ecommerce

// Need to hash password first. In a test environment, you can use:
// For production, use bcrypt: bcrypt.hashSync("password123", 10)
// Output: $2a$10$...

db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  password: "$2a$10$GknCkN03YXuKCJpQaAQx6eDqoJpCgCWIRdVn8Jw8KNVMnhMqGlDuu", // hashed: password123
  isAdmin: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Verify
db.users.find({ email: "admin@test.com" })
```

---

### Step 3: Add Test Products (As Admin)

First, login as admin:

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}
```

Response will include admin token.

**Add Product (with image)**:

```
POST http://localhost:5000/api/products
Headers:
- Authorization: Bearer <admin_token>
- Content-Type: multipart/form-data

Form Data:
- name: "Laptop"
- price: 50000
- description: "High performance laptop"
- category: "Electronics"
- stock: 10
- image: <select actual image file>
```

Add more products:
```
- Smartphone, ₹30000, Category: Electronics, Stock: 15
- T-Shirt, ₹500, Category: Clothing, Stock: 50
- Shoes, ₹2000, Category: Footwear, Stock: 20
```

---

### Step 4: Create Test Orders (As Customer)

Login as customer:

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "customer@test.com",
  "password": "password123"
}
```

Create order:

```
POST http://localhost:5000/api/orders
Headers:
- Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "products": [
    {
      "product": "507f...",  // Product ID from step 3
      "quantity": 2
    }
  ],
  "totalAmount": 100000
}
```

Create multiple orders with different products and quantities.

---

## Method 2: Using MongoDB Compass UI

### Insert Test Users

1. Open MongoDB Compass
2. Connect to local MongoDB
3. Create database: `ecommerce`
4. Create collection: `users`
5. Insert JSON:

```json
{
  "name": "Test Customer",
  "email": "test@example.com",
  "password": "$2a$10$...",
  "isAdmin": false,
  "createdAt": {
    "$date": "2024-03-03T00:00:00Z"
  },
  "updatedAt": {
    "$date": "2024-03-03T00:00:00Z"
  }
}
```

---

### Insert Test Products

Collection: `products`

```json
[
  {
    "name": "Laptop",
    "description": "High-end gaming laptop",
    "price": 80000,
    "category": "Electronics",
    "stock": 5,
    "image": "1709453800000.jpg",
    "createdAt": {
      "$date": "2024-03-03T10:00:00Z"
    },
    "updatedAt": {
      "$date": "2024-03-03T10:00:00Z"
    }
  },
  {
    "name": "Smartphone",
    "description": "Latest smartphone",
    "price": 50000,
    "category": "Electronics",
    "stock": 10,
    "image": "1709453801000.jpg",
    "createdAt": {
      "$date": "2024-03-03T10:00:00Z"
    },
    "updatedAt": {
      "$date": "2024-03-03T10:00:00Z"
    }
  }
]
```

---

### Insert Test Orders

Collection: `orders`

```json
{
  "user": ObjectId("507f1f77bcf86cd799439001"),
  "products": [
    {
      "product": ObjectId("507f1f77bcf86cd799439010"),
      "quantity": 2
    }
  ],
  "totalAmount": 100000,
  "status": "pending",
  "createdAt": {
    "$date": "2024-03-03T11:00:00Z"
  },
  "updatedAt": {
    "$date": "2024-03-03T11:00:00Z"
  }
}
```

---

## Method 3: Using CLI (mongosh)

```bash
mongosh

# Use ecommerce database
use ecommerce

# Insert users
db.users.insertMany([
  {
    name: "John Doe",
    email: "john@test.com",
    password: "$2a$10$...",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Admin",
    email: "admin@test.com",
    password: "$2a$10$...",
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

# Verify
db.users.find()

# Get user ID
db.users.findOne({ email: "john@test.com" })
```

---

## Quick Test Workflow

### 1. **Register & Login**
- Email: `newuser@test.com`
- Password: `test123456`
- Verify: localStorage has `userInfo` and `token`

### 2. **Browse Products**
- Navigate to `/shop`
- See products loaded from `/api/products`
- Check Network tab for API call

### 3. **Add to Cart**
- Click "Add to Cart" on any product
- Verify: Navbar shows cart count
- Check localStorage: cart array updated

### 4. **Checkout**
- Go to `/cart`
- Click "Checkout"
- Go to `/checkout`
- Click "Place Order"
- Verify: Order created, cart cleared

### 5. **Admin Features (as admin user)**
- Navigate to `/admin`
- **Dashboard**: See stats
- **Add Product**: Upload product with image
- **Manage Products**: Edit/delete products- **Categories**: Add/edit/delete categories via `/admin/categories` page- **Orders**: View orders and update status
- **Users**: View/create/delete users via `/admin/users` page

---

## Database Query Examples

### View All Users
```javascript
db.users.find()
```

### View User by Email
```javascript
db.users.findOne({ email: "admin@test.com" })
```

### Count Total Orders
```javascript
db.orders.countDocuments()
```

### Get All Orders with User Details
```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userData"
    }
  }
])
```

### Update Order Status
```javascript
db.orders.updateOne(
  { _id: ObjectId("507f...") },
  { $set: { status: "shipped" } }
)
```

### Delete Product
```javascript
db.products.deleteOne({ _id: ObjectId("507f...") })
```

### Get Total Revenue
```javascript
db.orders.aggregate([
  { $group: { _id: null, total: { $sum: "$totalAmount" } } }
])
```

---

## Useful Postman Collections

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
```

### Product Endpoints
```
GET    /api/products               (public)
POST   /api/products               (admin)
PUT    /api/products/{id}          (admin)
DELETE /api/products/{id}          (admin)
```

### Order Endpoints
```
POST   /api/orders                 (authenticated)
GET    /api/orders                 (admin)
PUT    /api/orders/{id}            (admin)
GET    /api/orders/stats/dashboard (admin)
```

### User Endpoints
```
GET    /api/users                  (admin)
```

---

## Common Test Scenarios

### Scenario 1: Customer Flow
1. Register new account
2. Login
3. Browse products
4. Add 3 different products to cart
5. Checkout
6. Create order
7. Verify in admin panel

### Scenario 2: Admin Product Management
1. Login as admin
2. Add 5 new products with images
3. View all products
4. Delete 1 product
5. Verify deletion

### Scenario 3: Order Management
1. Create 5 customer orders
2. Login as admin
3. View all orders on Orders page
4. Update order 1 to "Shipped"
5. Update order 2 to "Delivered"
6. Check dashboard stats reflect changes

### Scenario 4: Error Handling
1. Try to access `/admin` without login
2. Try to add product without image
3. Try to checkout with empty cart
4. Try to place order without authentication

---

## Performance Testing

### Load Test (Simulate Multiple Users)

Use tool like Apache JMeter or k6:

```javascript
// k6 example
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  let res = http.get('http://localhost:5000/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

---

## Debugging Checklist

- ✅ Check MongoDB connection (mongosh)
- ✅ Verify JWT_SECRET in .env
- ✅ Check token in localStorage
- ✅ Verify token expiry (7 days)
- ✅ Check CORS headers
- ✅ Verify image upload path
- ✅ Check file permissions on uploads/
- ✅ Monitor Network tab in browser DevTools
- ✅ Check backend console for errors
- ✅ Verify user.isAdmin flag for admin routes

---

## Sample Bcrypt Hashed Passwords (for testing)

```
Password: password123
Hash: $2a$10$GknCkN03YXuKCJpQaAQx6eDqoJpCgCWIRdVn8Jw8KNVMnhMqGlDuu

Password: admin123
Hash: $2a$10$6m...... (generate with: bcrypt.hashSync('admin123', 10))

Password: test123
Hash: $2a$10$6n...... (generate with: bcrypt.hashSync('test123', 10))
```

Use an online bcrypt tool or Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password123', 10);
console.log(hash);
```

---

## Continuous Testing

After each deployment:
1. Register new test user
2. Create test order
3. Verify admin stats update
4. Test product upload
5. Verify email integration (if added)

---

All test scenarios ready! Begin testing now. ✅
