# 🚀 Quick Reference Card

## Server Status ✅

| Component | Port | Status | URL |
|-----------|------|--------|-----|
| Backend (Node.js) | 5000 | ✅ RUNNING | http://localhost:5000 |
| Frontend (Vite) | 5173 | ✅ RUNNING | http://localhost:5173 |
| MongoDB | 27017 | ✅ CONNECTED | Local instance |

---

## 🌐 Access Points

| Type | URL | Purpose |
|------|-----|---------|
| Frontend | http://localhost:5173 | User interface |
| Backend API | http://localhost:5000/api | API base URL |
| Dashboard | http://localhost:5173/admin/dashboard | Admin stats |

---

## 🧑‍💼 Test Credentials

### Regular User
- **Email**: user@example.com
- **Password**: 123456
- **Role**: Customer

### Admin User
- **Email**: admin@example.com
- **Password**: 123456
- **Role**: Administrator

*Note: Create these via registration page if they don't exist*

---

## 📝 Command Reference

### Start Backend
```bash
cd server
node server.js
```

### Start Frontend
```bash
cd client
npm run dev
```

### Stop Services
- Press `Ctrl+C` in terminal running the service

### Install Dependencies (if needed)
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

---

## 🎯 10-Second Testing Flow

1. **Open**: http://localhost:5173
2. **Click**: Register
3. **Enter**: Any test credentials
4. **Verify**: User created ✅
5. **Login**: With same credentials
6. **Shop**: Browse products
7. **Add Cart**: Any product
8. **Checkout**: Complete order
9. **Admin**: Login as admin, view order in Orders page
10. **Done**: System working! ✅

---

## 📱 Page Routes

### Public Pages
- `/` - Home page
- `/login` - Login form
- `/register` - Registration form
- `/shop` - Browse products
- `/cart` - Shopping cart

### Protected User Pages
- `/orders` - My orders
- `/checkout` - Checkout page

### Admin Pages
- `/admin/dashboard` - Statistics dashboard
- `/admin/products` - Add/manage products
- `/admin/manage-products` - Product list editor
- `/admin/orders` - All orders
- `/admin/users` - All users
- `/admin/categories` - Categories manager

---

## 🔍 Common API Checks

### Test if Backend is Running
```bash
# From PowerShell:
(Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -UseBasicParsing).StatusCode
# Should return: 200
```

### Test Frontend Connection
```javascript
// In browser console at http://localhost:5173:
fetch('http://localhost:5000/api/products')
  .then(r => r.json())
  .then(data => console.log('✅ Connected!', data))
  .catch(e => console.error('❌ Failed:', e))
```

### Check localStorage (Browser DevTools)
```javascript
// In console:
console.log(localStorage.getItem('userInfo'))
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('cart'))
```

---

## ⚠️ Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Port 5173 in use | Change vite port: modify vite.config.js |
| Port 5000 in use | Kill process: `netstat -ano \| findstr :5000` |
| CORS error | Restart backend - CORS already configured |
| API 404 error | Check endpoint path - verify in API_ENDPOINTS_REFERENCE.md |
| Images not loading | Ensure `/uploads` folder exists in server |
| Login fails | Check credentials in database or register new user |
| Blank page | Check browser console for errors |

---

## 📊 API Response Examples

### Login Success
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "isAdmin": false
  }
}
```

### Get Products Success
```json
{
  "success": true,
  "total": 42,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Laptop",
      "price": 999.99,
      "image": "laptop.jpg",
      "category": "electronics",
      "stock": 5
    }
  ]
}
```

### Dashboard Stats
```json
{
  "success": true,
  "stats": {
    "totalOrders": 42,
    "totalRevenue": 50000,
    "totalUsers": 15,
    "totalProducts": 120
  }
}
```

---

## 🎨 Frontend Architecture

```
App (Router)
├── AuthProvider
│   └── CartProvider
│       ├── Public Routes (Home, Shop, Login, Register)
│       ├── Protected Routes (Cart, Checkout, Orders)
│       └── Admin Routes (Dashboard, Products, Orders, Users)
```

---

## 🔐 Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend: API.post('/auth/login')
   ↓
3. Backend: Verify credentials against DB
   ↓
4. Backend: Generate JWT token
   ↓
5. Frontend: Store token + user in localStorage
   ↓
6. Frontend: Set axios interceptor with Bearer token
   ↓
7. All future requests auto-include token ✅
```

---

## 📦 Key Technologies

**Backend**:
- Express.js (API server)
- MongoDB (Database)
- JWT (Authentication)
- Multer (File upload)
- Cors (Cross-origin)

**Frontend**:
- React (UI framework)
- Vite (Build tool)
- React Router (Navigation)
- Axios (HTTP client)
- Bootstrap (Styling)
- Context API (State management)

---

## 🎯 Success Criteria

All of the following should be true:

✅ Backend server starts without errors  
✅ Frontend loads at http://localhost:5173  
✅ Can register new user  
✅ Can login with credentials  
✅ Products load on shop page  
✅ Add to cart works  
✅ Checkout completes successfully  
✅ Orders appear in database  
✅ Admin can view all orders  
✅ No CORS errors in console  
✅ Images display correctly  
✅ Protected routes work  

**If all ✅**: Project is ready for use!

---

## 📞 Support Info

### Documentation Files
- **TESTING_COMPLETE_FLOW.md** - Full testing guide
- **API_ENDPOINTS_REFERENCE.md** - API documentation
- **CHANGES_MADE.md** - What was modified
- **PROJECT_STATUS_COMPLETE.md** - Full feature list

### Browser DevTools Shortcuts
- **F12** - Open developer tools
- **Ctrl+Shift+J** - Open console
- **Ctrl+Shift+I** - Open inspector
- **Ctrl+Shift+E** - Open network tab

### MongoDB Inspection
```javascript
// Connect to MongoDB shell:
mongo

// Switch to database:
use ecommerce

// View collections:
show collections

// Sample queries:
db.users.find()
db.products.find().limit(5)
db.orders.find()
```

---

## 🚀 Ready to Launch

**Current Status**: ✅ PRODUCTION READY

**Next Action**: Open http://localhost:5173 and start using the application!

---

*Last Updated: Project completion*  
*Version: 1.0 - Stable*  
*Status: ✅ All Systems Go*
