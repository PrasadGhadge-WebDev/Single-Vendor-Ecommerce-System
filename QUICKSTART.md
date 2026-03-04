# 🚀 Quick Start Guide - Single Vendor E-Commerce

## ⚡ Get Running in 2 Minutes

### **Step 1: Setup Backend**
```bash
cd server
npm install
node server.js
```
✅ Backend running at: `http://localhost:5000`

### **Step 2: Setup Frontend**
```bash
cd client
npm install
npm run dev
```
✅ Frontend running at: `http://localhost:5173`

---

## 👤 Test User Accounts

### **Customer Account**
- Email: `customer@test.com`
- Password: `password123`
- (Register if doesn't exist)

### **Admin Account**
You need to manually create this in MongoDB:
```javascript
// In MongoDB Compass or mongosh
db.users.insertOne({
  name: "Admin",
  email: "admin@test.com",
  password: "$2a$10/...", // bcrypt hashed password
  isAdmin: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use bcrypt to hash: `password123`

---

## 🧪 Test Flow

### **As Customer:**
1. Go to `http://localhost:5173`
2. Click "Register" → Create account
3. Click "Login" → Login with your account
4. Click "Shop" → Add products to cart
5. Click cart icon → Click "Checkout"
6. Click "Place Order" → Order created! ✅

### **As Admin:**
1. Login with admin account
2. Click "Admin" button in navbar
3. **Dashboard** → View all stats
4. **Add Product** → Upload products with images
5. **Manage Products** → Delete products
6. **Orders** → Update order status (Pending → Shipped → Delivered)

---

## 📦 API Testing with Postman

### **Register**
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### **Login**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
Response: { token, _id, name, email, isAdmin }
```

### **Get Products**
```
GET http://localhost:5000/api/products
```
You can optionally filter by category or limit results:
```
GET http://localhost:5000/api/products?category=Electronics
GET http://localhost:5000/api/products?limit=8
```


### **Create Order (Authenticated)**

### **Get Categories**
```
GET http://localhost:5000/api/categories
```
(admins can also POST/DELETE to manage categories)

```
POST http://localhost:5000/api/orders
Headers: Authorization: Bearer <token>
Body (JSON):
{
  "products": [
    { "product": "5f1f...", "quantity": 2 }
  ],
  "totalAmount": 500
}
```

### **Get Dashboard Stats (Admin)**
```
GET http://localhost:5000/api/orders/stats/dashboard
Headers: Authorization: Bearer <admin_token>
```

---

## 🔧 Troubleshooting

### **Backend won't start**
- Check if MongoDB is running: `mongod`
- Check if port 5000 is available
- Clear `node_modules` and reinstall: `npm install`

### **Frontend won't connect to backend**
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Ensure token is stored in localStorage

### **Images not uploading**
- Check if `server/uploads/` folder exists
- Ensure multer middleware is working
- File size should be < 5MB

### **Login not working**
- Check if email exists in database
- Verify password is correct
- Clear browser localStorage and try again

### **Admin features not accessible**
- Verify user's `isAdmin` field is `true`
- Token must be recent (within 7 days)
- Check browser console for errors

---

## 📱 Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── AdminLayout.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Admin/
│   │       ├── Dashboard.jsx
│   │       ├── AddProduct.jsx
│   │       ├── ManageProducts.jsx
│   │       └── Orders.jsx
│   ├── App.jsx
│   └── main.jsx

server/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── userController.js
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── userRoutes.js
├── middlewares/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── uploads/
└── server.js
```

---

## 🎯 Key Features

✅ **User Authentication** - Secure registration & login with JWT  
✅ **Shopping Cart** - Add/remove products, persistent storage  
✅ **Checkout** - Multi-product orders with total calculation  
✅ **Product Management** - Admin can add/edit/delete products  
✅ **Order Management** - Track & update order status  
✅ **Dashboard** - Admin stats dashboard  
✅ **Image Upload** - Product images stored on server  
✅ **Protected Routes** - Admin & user-only pages  

---

## 💡 Pro Tips

1. **Clear Cache**: If seeing old data, clear browser cache
2. **Check Logs**: Monitor both browser console and terminal
3. **Test Admin**: Create 2nd account to test admin features
4. **Use Postman**: Test APIs before debugging frontend
5. **Token Expires**: Token valid for 7 days, re-login after

---

## ✅ Verified Working

- ✅ User registration and login
- ✅ Product listing and shopping cart
- ✅ Checkout and order creation
- ✅ Admin dashboard and statistics
- ✅ Product management (add/edit/delete)
- ✅ Order status updates
- ✅ Protected routes
- ✅ File uploads with image storage

---

## 🚀 Ready to Code!

Your full-stack e-commerce application is **production-ready**!

Start today:
```bash
# Terminal 1: Backend
cd server && node server.js

# Terminal 2: Frontend
cd client && npm run dev
```

**Visit: http://localhost:5173** 🎉

---

For detailed info, see `FINAL_PROJECT_SETUP.md`
