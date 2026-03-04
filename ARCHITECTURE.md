# 🏗️ Application Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (React - Vite)                       │
│                   http://localhost:5173                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ AuthContext│  │CartContext │  │ Navbar     │               │
│  │(user/token)│  │ (products) │  │ (UI)       │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│         │              │                │                      │
│         └──────────────┴────────────────┘                      │
│                    │                                           │
│         ┌──────────────────────┐                              │
│         │   App.jsx (Routes)   │                              │
│         └──────────────────────┘                              │
│                    │                                           │
│    ┌───────────────┼───────────────┐                          │
│    │               │               │                          │
│  ┌─────┐   ┌──────────┐    ┌──────────┐                      │
│  │Home │   │Shop/Cart │    │Admin     │                      │
│  └─────┘   │Checkout  │    │Dashboard │                      │
│            └──────────┘    │Add/Manage│                      │
│                            │Products  │                      │
│                            └──────────┘                      │
│                    │                                           │
└────────────────────┼───────────────────────────────────────────┘
                     │
          JWT Token  │  (Authorization: Bearer <token>)
          │ Products │
          │ Orders   │
                     │
┌────────────────────┼───────────────────────────────────────────┐
│         SERVER (Node.js/Express)                               │
│                   http://localhost:5000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  Routes & Controllers                       │
│  │authRoutes    │  • register, login                          │
│  │productRoutes │  • get, add, update, delete                 │
│  │orderRoutes   │  • create, get, update status              │
│  │userRoutes    │  • get all users                            │
│  └──────────────┘                                             │
│         │                                                      │
│  ┌──────────────────────────┐                                │
│  │ Middleware               │                                │
│  │ • authMiddleware         │                                │
│  │ • requireSignIn          │                                │
│  │ • isAdmin                │                                │
│  └──────────────────────────┘                                │
│         │                                                      │
│  ┌──────────────────────────┐                                │
│  │ Controllers              │                                │
│  │ • authController         │                                │
│  │ • productController      │                                │
│  │ • orderController        │                                │
│  │ • userController         │                                │
│  └──────────────────────────┘                                │
│         │                                                      │
└─────────┼──────────────────────────────────────────────────────┘
          │
          │  (Mongoose ODM)
          │
┌─────────┼──────────────────────────────────────────────────────┐
│    DATABASE (MongoDB)                                          │
│         http://localhost:27017                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Collections:                                                   │
│  • users        (auth, profile data)                          │
│  • products     (product details, image filename)             │
│  • orders       (order data, status)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT: Register Page                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. User enters: name, email, password                          │
│ 2. Form submission → POST to /api/auth/register                │
│                                                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER: registerUser Controller                                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. Check if user exists in DB                                   │
│ 2. Hash password with bcrypt (salt: 10)                        │
│ 3. Create user in MongoDB                                       │
│ 4. Generate JWT token (expires: 7 days)                        │
│ 5. Return: { _id, name, email, isAdmin, token }               │
│                                                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT: AuthContext                                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Receive response from server                                 │
│ 2. Call: login(userData)                                       │
│ 3. Store in localStorage:                                       │
│    • userInfo: { _id, name, email, isAdmin, token }           │
│    • token: JWT token string                                    │
│ 4. Update state: setUser(userData)                             │
│ 5. Redirect to: Home /                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Product Shopping Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Shop Page                                             │
├──────────────────────────────────────────────────────────────┤
│ 1. useEffect → GET /api/products                              │
│ 2. Display all products in grid                               │
│ 3. User clicks "Add to Cart"                                  │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: CartContext                                           │
├──────────────────────────────────────────────────────────────┤
│ 1. Find if product already in cart                            │
│ 2. If exists: increment quantity                              │
│ 3. If not: add new item with quantity: 1                      │
│ 4. Save cart to localStorage                                  │
│ 5. Update Navbar cart count                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Checkout & Order Creation Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Checkout Page                                         │
├──────────────────────────────────────────────────────────────┤
│ 1. Display cart summary: products, quantities, total         │
│ 2. User clicks "Place Order"                                 │
│ 3. Validate: user authenticated? cart not empty?             │
│ 4. POST /api/orders                                          │
│    Headers: Authorization: Bearer <token>                    │
│    Body: { products: [...], totalAmount }                    │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVER: Middleware (requireSignIn)                           │
├──────────────────────────────────────────────────────────────┤
│ 1. Extract token from header (Bearer <token>)                │
│ 2. Verify JWT signature with JWT_SECRET                      │
│ 3. Decode token to get user ID                               │
│ 4. Fetch user from DB: User.findById(decoded.id)            │
│ 5. Attach user to request: req.user = userData              │
│ 6. Call next() → proceed to controller                       │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVER: createOrder Controller                               │
├──────────────────────────────────────────────────────────────┤
│ 1. Extract from request:                                      │
│    • products: [{ product: id, quantity: num }, ...]         │
│    • totalAmount: number                                      │
│    • user: req.user._id (from middleware)                   │
│ 2. Create order in MongoDB:                                   │
│    Order { user, products, totalAmount, status: "pending" }  │
│ 3. Return: order object                                       │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Success Handler                                       │
├──────────────────────────────────────────────────────────────┤
│ 1. Show success alert                                         │
│ 2. Call: clearCart()                                          │
│ 3. Clear localStorage['cart']                                 │
│ 4. Redirect to home (/)                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Admin Add Product Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: AddProduct Page                                       │
├──────────────────────────────────────────────────────────────┤
│ 1. Fill form: name, price, description, category, stock     │
│ 2. Select image file                                          │
│ 3. Submit form → FormData()                                   │
│ 4. POST /api/products                                        │
│    Headers: Authorization: Bearer <admin_token>              │
│             Content-Type: multipart/form-data                │
│    Body: FormData { name, price, ..., image (file) }        │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVER: Middleware - requireSignIn + isAdmin                 │
├──────────────────────────────────────────────────────────────┤
│ 1. requireSignIn: Verify token, attach user                  │
│ 2. isAdmin: Check req.user.isAdmin === true                  │
│ 3. Multer middleware: Handle file upload                      │
│    • Save file to: server/uploads/timestamp.ext              │
│    • Add filename to req.file.filename                       │
│ 4. Proceed to controller                                      │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVER: addProduct Controller                                │
├──────────────────────────────────────────────────────────────┤
│ 1. Extract: name, price, description, category, stock       │
│ 2. Get image filename: req.file.filename                     │
│ 3. Create product in MongoDB                                  │
│ 4. Return: product object                                     │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Success                                               │
├──────────────────────────────────────────────────────────────┤
│ 1. Show success alert                                         │
│ 2. Reset form fields                                          │
│ 3. Clear file input                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Admin Dashboard Stats Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Dashboard Page (useEffect)                           │
├──────────────────────────────────────────────────────────────┤
│ 1. GET /api/orders/stats/dashboard                           │
│    Headers: Authorization: Bearer <admin_token>              │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVER: getDashboardStats Controller                         │
├──────────────────────────────────────────────────────────────┤
│ 1. totalOrders = Order.countDocuments()                      │
│ 2. totalRevenue = Order.aggregate([                          │
│      { $group: { total: { $sum: "$totalAmount" } } }        │
│    ])                                                         │
│ 3. totalUsers = User.countDocuments()                        │
│ 4. totalProducts = Product.countDocuments()                  │
│ 5. Return: {                                                 │
│      totalOrders: number,                                    │
│      totalRevenue: number,                                   │
│      totalUsers: number,                                     │
│      totalProducts: number                                   │
│    }                                                          │
│                                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ CLIENT: Display Stats                                        │
├──────────────────────────────────────────────────────────────┤
│ 1. setStats(data)                                            │
│ 2. Display 4 cards:                                          │
│    • Total Orders: X                                         │
│    • Total Users: X                                          │
│    • Total Products: X                                       │
│    • Total Revenue: ₹X                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## State Management Structure

```
AuthContext
├── user: { _id, name, email, isAdmin, token } | null
├── login(userData)
│   ├── localStorage.setItem("userInfo", JSON.stringify(userData))
│   ├── localStorage.setItem("token", userData.token)
│   └── setUser(userData)
└── logout()
    ├── localStorage.removeItem("userInfo") 
    ├── localStorage.removeItem("token")
    └── setUser(null)

CartContext
├── cart: [{ _id, name, price, quantity, ... }, ...]
├── addToCart(product)
│   ├── Check if exists
│   ├── Increment or add new
│   └── Save to localStorage
├── removeFromCart(id)
│   ├── Filter out product
│   └── Save to localStorage
└── clearCart()
    ├── Set cart to []
    └── Clear localStorage
```

---

## API Response Examples

### Login Success
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "isAdmin": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Order Success
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439011",
  "products": [
    {
      "product": "507f1f77bcf86cd799439013",
      "quantity": 2
    }
  ],
  "totalAmount": 500,
  "status": "pending",
  "createdAt": "2024-03-03T10:30:00Z"
}
```

### Dashboard Stats Success
```json
{
  "totalOrders": 15,
  "totalRevenue": 5000,
  "totalUsers": 8,
  "totalProducts": 24
}
```

---

## Error Handling Flow

```
CLIENT Request
    │
    ├─ Network Error
    │  └─ Try-Catch Block
    │     └─ Show: "Network error"
    │
    └─ Server Response
       ├─ Success (2xx)
       │  └─ Parse JSON
       │     └─ Use data
       │
       └─ Error (4xx, 5xx)
          └─ Get error.response?.data?.message
             └─ Show: error message
```

---

## Security Features

1. **Password Hashing**: bcryptjs with salt 10 rounds
2. **JWT Tokens**: Signed with JWT_SECRET, expires in 7 days
3. **Bearer Token Format**: `Authorization: Bearer <token>`
4. **Admin Authorization**: Check `req.user.isAdmin` flag
5. **Protected Routes**: Frontend checks user before rendering
6. **File Upload**: Stored in server filesystem, filename saved in DB

---

## Data Relationships

```
User
 └─ Has Many: Orders
    └─ Orders Has Many Products (through OrderProducts)
       └─ Each Product referenced by ID

Product
 └─ Has Many: OrderProducts
    └─ Standalone with image file

Order
 ├─ Belongs to: User
 └─ Has Many: Products (with quantities)
```

This architecture ensures:
✅ Separation of concerns  
✅ Secure authentication  
✅ Proper authorization  
✅ Scalable data structure  
✅ Clean state management  
✅ Error handling at each layer
