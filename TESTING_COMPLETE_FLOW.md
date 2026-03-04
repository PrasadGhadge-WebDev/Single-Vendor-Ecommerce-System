# 🧪 Complete Testing Guide

## Server Details
- **Backend API**: http://localhost:5000
- **Frontend UI**: http://localhost:5173
- **Status**: ✅ Both running and accessible

---

## Test 1: User Registration & Login

### Register New User
1. Go to `http://localhost:5173/register`
2. Fill in form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `123456`
   - Confirm Password: `123456`
   - Is Admin: Uncheck (register as normal user)
3. Click Register
4. **Expected**: User created, redirected to login page

### Login with Credentials
1. Go to `http://localhost:5173/login`
2. Enter:
   - Email: `test@example.com`  
   - Password: `123456`
3. Click Login
4. **Expected**: 
   - Logged in successfully
   - Redirected to home page
   - Navbar shows user name + Logout button
   - localStorage has `userInfo` and `token`

### Create Admin User
1. Go to `http://localhost:5173/register`
2. Fill form with:
   - Name: `Admin User`
   - Email: `admin@example.com`
   - Password: `123456`
   - **Check** "Is Admin" checkbox
3. Register
4. **Expected**: Admin user created with role="admin"

---

## Test 2: Navigation & Categories

### Test Categories Dropdown
1. From homepage (logged in or not)
2. Look at Navbar - should show "Categories" dropdown
3. Click Categories dropdown
4. **Expected**: 
   - Categories load from `/api/categories` endpoint ✅
   - Dropdown shows available categories
   - No CORS errors in console

### Navigate Through Categories
1. Click a category (e.g., "Electronics")
2. **Expected**: 
   - URL changes to `/shop?category=electronics`
   - Products filtered by that category show
   - Product count updates

---

## Test 3: Shopping & Cart

### Browse Products
1. Go to `http://localhost:5173/shop`
2. **Expected**:
   - Products load from `/api/products` ✅
   - Product cards display with image, name, price
   - Images shown correctly from `/uploads` folder
   - No 404 errors for images

### Add to Cart
1. On Shop page, click "Add to Cart" on any product
2. Check navbar cart badge - should show "1"
3. Click another product "Add to Cart"
4. Navbar shows "2"
5. **Expected**:
   - CartContext updates properly
   - localStorage persists cart items
   - Cart badge updates

### Modify Cart
1. Go to `http://localhost:5173/cart`
2. See items you added
3. Update quantity using +/- buttons
4. **Expected**:
   - Quantity updates
   - Total price recalculates
   - localStorage syncs

### Remove from Cart
1. Click "Remove" on any item in cart
2. **Expected**:
   - Item removed immediately
   - localStorage updated
   - Total recalculates

---

## Test 4: Checkout & Orders

### Complete Checkout
1. From cart page (with items), fill checkout form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Address: `123 Main Street`
   - City: `New York`
   - State: `NY`
   - Zip: `10001`
   - Phone: `1234567890`
   - Payment Method: `Credit Card`
2. Click "Place Order"
3. **Expected**:
   - Order created via `POST /api/orders` ✅
   - Redirected to home page
   - Success message shown
   - localStorage cart cleared

### View User Orders
1. Logged in as regular user
2. Click username in navbar → "My Orders" (if available)
   - OR go directly to `http://localhost:5173/orders`
3. **Expected**:
   - Your orders displayed
   - Status visible (e.g., "pending", "processing")
   - Calls `GET /api/orders/my-orders` ✅

---

## Test 5: Admin Dashboard

### Access Admin Panel
1. Logout, then login as admin user (admin@example.com)
2. Navbar should show "Admin" link
3. Click Admin → Dashboard
4. **Expected**:
   - URL: `http://localhost:5173/admin/dashboard`
   - Dashboard loads with stats from `/api/orders/stats/dashboard` ✅
   - Shows: Total Orders, Total Revenue, Total Users, Total Products

### Add Product (Admin)
1. Go to Admin → Add Product
2. Fill form:
   - Product Name: `Sample Product`
   - Price: `99.99`
   - Description: `This is a test product`
   - Category: Select from dropdown
   - Stock: `10`
   - Image: Upload a test image file
3. Click "Add Product"
4. **Expected**:
   - Product uploaded via `POST /api/products` with image ✅
   - Image saved to `/uploads` folder
   - Redirected with success message

### Manage Products (Admin)
1. Go to Admin → Manage Products
2. Should see list of all products
3. Click Edit on any product
4. Modify details and click Update
5. **Expected**:
   - Product updated via `PUT /api/products/:id` ✅
   - List refreshes
6. Click Delete on a product
7. **Expected**:
   - Product deleted via `DELETE /api/products/:id` ✅
   - Removed from list

### Manage Orders (Admin)
1. Go to Admin → Orders
2. See all orders from all users
3. Click any order to view details
4. Change Status dropdown (pending → processing → completed)
5. Click Update Status
6. **Expected**:
   - Status updated via `PUT /api/orders/:id/status` ✅
   - Status changes immediately
   - User can see updated status in "My Orders"

### Manage Categories (Admin)
1. Go to Admin → Categories
2. View available categories
3. **Note**: Full CRUD functionality can be expanded
4. **Expected**: Categories load from `/api/categories` ✅

### Manage Users (Admin)
1. Go to Admin → Users
2. See list of all registered users
3. View user details (name, email, role)
4. **Expected**: Data loaded from `/api/users` ✅

---

## Test 6: Error Handling & Edge Cases

### Test Invalid Routes
1. Manually go to http://localhost:5173/invalid-page
2. **Expected**: 404 page or redirected home

### Test Logout Then Access Protected Routes
1. Login, then logout
2. Manually go to http://localhost:5173/cart
3. **Expected**: Redirected to login page

### Test Admin Access Control
1. Login as regular user
2. Manually go to http://localhost:5173/admin/dashboard
3. **Expected**: 
   - Blocked from access
   - Redirected to home or login
   - Shows unauthorized message

### Test Missing Auth Token
1. Open DevTools → Application → LocalStorage
2. Delete `token` from localStorage
3. Try to access protected route
4. **Expected**: Redirected to login

### Test CORS Issues
1. Open DevTools → Network tab
2. Make any API call
3. Check response headers for `Access-Control-Allow-Origin`
4. **Expected**: Should be `*` or allow your port

---

## Browser Console Checks

Open DevTools (F12) and check:

✅ No CORS errors  
✅ No 404 errors for API calls  
✅ No undefined function errors  
✅ localStorage shows `userInfo` and `token` when logged in  
✅ Network requests to `http://localhost:5000/api/*` complete successfully  

---

## Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot GET /api/..." | API path wrong | Check baseURL in `api.js` + endpoint paths |
| CORS error | Port mismatch | Backend CORS should have `origin: true` |
| Product images not loading | Wrong path | Check `/uploads` folder exists, images uploaded |
| Login fails | Wrong credentials | Check user in DB, password hashing correct |
| Admin page blocked | Not logged in as admin | Register with "Is Admin" checked |
| Cart empty after refresh | localStorage issue | Check if token/data persisting |
| Blank dropdown menus | API call failed | Check Network tab for error status codes |

---

## Quick Database Check

### From Backend Terminal
Check if MongoDB has data:
```javascript
// Open MongoDB shell and run:
db.users.find()           // See all users
db.products.find()        // See all products
db.orders.find()          // See all orders
db.categories.find()      // See all categories
```

---

## Performance Checks

1. **Load Time**: First page load should be < 3 seconds
2. **API Response**: Each API call should complete < 500ms
3. **Cart Operations**: Add/remove items should be instant
4. **Image Loading**: Product images should load within 2 seconds

Check Network tab (DevTools) for timing details.

---

## Final Validation Checklist

- [ ] Backend runs without errors
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Categories dropdown populates
- [ ] Products load from database
- [ ] Add to cart updates cart
- [ ] Checkout completes successfully
- [ ] Orders appear in admin panel
- [ ] Admin can manage products
- [ ] Admin can update order status
- [ ] No CORS errors in console
- [ ] Logout works
- [ ] Protected routes block unauthorized access
- [ ] Images display correctly

**If all checkboxes pass**: ✅ **PROJECT IS PRODUCTION READY**

---

## Next Steps After Testing

1. If issues found: Check Network tab for failing endpoints
2. Look at browser console for specific error messages
3. Check backend logs on server terminal
4. Verify all required npm packages installed (`npm install` in both folders)
5. Ensure `.env` file exists with correct MongoDB connection string

**Questions?** Check CHANGES_MADE.md for what was fixed.
