# ✅ Email & Password Fields Added to Admin Panel

## Updated Forms:

### 1. **Add/Edit School** (`/admin/schools/add` and `/admin/schools/edit/:id`)

**New Fields Added:**
- **Login Email** (required, type: email)
  - Placeholder: "school@example.com"
  - This is separate from the contact info email
  
- **Password** (required for new, optional for edit)
  - Minimum 8 characters
  - When editing: Placeholder shows "Leave blank to keep current"
  - When creating: Required field with "Enter password"

**Form Sections:**
1. Institution Details
   - School Name
   - **Login Email** ← NEW
   - **Password** ← NEW
   - Subdomain
   - Commission Margin (%)

2. Contact Information
   - Email Address (for contact purposes)
   - Phone Number

---

### 2. **Add/Edit Supplier** (`/admin/suppliers/add` and `/admin/suppliers/edit/:id`)

**New Fields Added:**
- **Login Email** (required, type: email)
  - Placeholder: "supplier@example.com"
  - This is separate from the contact info email
  
- **Password** (required for new, optional for edit)
  - Minimum 8 characters
  - When editing: Placeholder shows "Leave blank to keep current"
  - When creating: Required field with "Enter password"

**Form Sections:**
1. Business Details
   - Supplier Name
   - **Login Email** ← NEW
   - **Password** ← NEW

2. Contact Information
   - Email Address (for contact purposes)
   - Phone Number

---

## Testing Instructions:

### Create New School:
1. Go to `/admin/schools/add`
2. Fill in all fields including:
   - School Name: "Test School"
   - **Login Email: "school@test.com"** ← NEW FIELD
   - **Password: "password123"** ← NEW FIELD (min 8 chars)
   - Subdomain: "testschool"
   - Commission: 5
   - Contact Email: "contact@test.com"
   - Contact Phone: "123-456-7890"
3. Click "Register School"

### Edit Existing School:
1. Go to `/admin/schools/edit/1`
2. The form will show:
   - Existing name, subdomain, commission
   - **Email field populated with current email** ← NEW FIELD
   - **Password field (empty)** ← NEW FIELD - Leave blank to keep current password
3. Change any fields
4. Password is optional - only fill if you want to change it
5. Click "Update School"

### Create New Supplier:
1. Go to `/admin/suppliers/add`
2. Fill in:
   - Supplier Name: "Test Supplier"
   - **Login Email: "supplier@test.com"** ← NEW FIELD
   - **Password: "password123"** ← NEW FIELD (min 8 chars)
   - Contact Email: "contact@supplier.com"
   - Contact Phone: "123-456-7890"
3. Click "Register Supplier"

### Edit Existing Supplier:
1. Go to `/admin/suppliers/edit/1`
2. The form will show:
   - **Email field populated with current email** ← NEW FIELD
   - **Password field (empty)** ← NEW FIELD - Leave blank to keep current password
3. Password is optional when editing
4. Click "Update Supplier"

---

## Backend API (Already Implemented):

### POST `/api/admin/create-school`
```json
{
  "name": "New School",
  "email": "school@example.com",
  "password": "password123",
  "subdomain": "newschool",
  "commission_percentage": 5
}
```

### PUT `/api/admin/school/{id}`
```json
{
  "name": "Updated School",
  "email": "updated@example.com",
  "password": "newpassword",  // Optional
  "subdomain": "updated",
  "contact_info": "{\"phone\":\"123-456-7890\"}"
}
```

### POST `/api/admin/create-supplier`
```json
{
  "name": "New Supplier",
  "email": "supplier@example.com",
  "password": "password123",
  "contact_info": "Contact details"
}
```

### PUT `/api/admin/supplier/{id}`
```json
{
  "name": "Updated Supplier",
  "email": "updated@example.com",
  "password": "newpassword",  // Optional
  "contact_info": "{\"phone\":\"123-456-7890\"}"
}
```

---

## Important Notes:

- ✅ Passwords are hashed on the backend using Laravel's Hash::make()
- ✅ Email fields have unique validation
- ✅ Password is required when creating new schools/suppliers
- ✅ Password is optional when editing (leave blank to keep current)
- ✅ Minimum password length: 8 characters
- ✅ All existing schools/suppliers have temporary emails (e.g., "greenwoodhigh1@temp.com")
- ✅ Frontend built successfully with Vite

**Please refresh your browser** to see the new fields in the admin panel forms!
