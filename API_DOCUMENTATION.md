# Laravel Multi-Vendor School Ecommerce Platform API Documentation

## Authentication

All protected endpoints require a Bearer Token.

### Login

`POST /api/auth/login`

- Body: `{ "email": "admin@platform.com", "password": "password" }`
- Response: `{ "message": "Login successful", "token": "...", "role": ["super_admin"] }`

### Register (Customer)

`POST /api/auth/register`

- Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password", "password_confirmation": "password" }`

### Register (School)

`POST /api/auth/register-school`

- Body:

  ```json
  {
    "admin_name": "Principal Name",
    "admin_email": "admin@school.com",
    "password": "password",
    "password_confirmation": "password",
    "school_name": "School Name",
    "subdomain": "schoolsubdomain"
  }
  ```

- Response: `201 Created` with school details and admin token.

### Logout

`POST /api/auth/logout` (Auth required)

## School Context

Most customer endpoints require a `school` subdomain context.
If testing locally with `localhost`, use `X-Test-Subdomain: greenwood` header (if implemented) OR rely on accessing via `greenwood.localhost`.
(Note: Middleware currently checks `Host` header. Configure your hosts file or use `greenwood.localhost:8000`).

## Public / Customer Endpoints

**Context**: School Subdomain (e.g., `greenwood.platform.com`)

### List Products

`GET /api/products`

- Query Params: `category_id` (optional)
- Returns: List of products available in this school with calculated dynamic pricing.

### Product Details

`GET /api/products/{id}`

### Categories

`GET /api/categories`

### Create Order (Customer)

`POST /api/order/create` (Auth: Customer)

- Body:

  ```json
  {
    "items": [
      { "product_id": 1, "quantity": 1, "customization": { "size": "M" } }
    ],
    "payment_provider": "razorpay" 
  }
  ```

- Response:

  ```json
  {
    "order": { ... },
    "payment": {
        "provider": "razorpay",
        "order_id": "order_mock_...",
        "amount": 38320,
        ...
    },
    "message": "Order initiated"
  }
  ```

### My Orders

`GET /api/my-orders` (Auth: Customer)

## School Admin Endpoints

**Auth**: School Role
**Context**: School Subdomain

### Select Product for Catalog

`POST /api/school/select-product`

- Body: `{ "product_id": 1, "school_margin": 150.00 }`

### View Incoming Orders

`GET /api/school/orders`

### View Reports

`GET /api/school/reports`

### Update School Profile

`POST /api/school/profile`

- Headers: `Content-Type: multipart/form-data`
- Body:
  - `name`: string (optional)
  - `logo`: file (image, optional)
  - `theme_color`: string (hex code, optional)
- Returns: Updated school profile with full logo URL.

### View Settlements

`GET /api/school/settlements`

- Returns: List of settlements (pending/settled) for this school.

## Supplier Endpoints

**Auth**: Supplier Role

### Create Product

`POST /api/supplier/product`

- Headers: `Content-Type: multipart/form-data`
- Body:
  - `category_id`: 1
  - `name`: "Product Name"
  - `base_price`: 500
  - `stock_quantity`: 100
  - `images[]`: file (multiple images allowed)

### View Orders (to be dispatched)

`GET /api/supplier/orders`

### Dispatch Order

`PATCH /api/supplier/order/{order_id}/dispatch`

## Super Admin Endpoints

**Auth**: Super Admin Role

### Create School

`POST /api/admin/create-school`

- Body: `{ "name": "New School", "email": "school@example.com", "password": "securepassword", "subdomain": "newschool", "commission_percentage": 5 }`

### Update School

`PUT /api/admin/school/{id}`

- Body: `{ "name": "Updated School", "email": "updated@example.com", "password": "newpassword" (optional), "subdomain": "updated", "contact_info": {"phone": "123-456-7890"} }`

### Create Supplier

`POST /api/admin/create-supplier`

- Body: `{ "name": "New Supplier", "email": "supplier@example.com", "password": "securepassword", "contact_info": "contact details" }`

### Update Supplier

`PUT /api/admin/supplier/{id}`

- Body: `{ "name": "Updated Supplier", "email": "updated@example.com", "password": "newpassword" (optional), "contact_info": "updated contact" }`

### Create Master Product

`POST /api/admin/create-product`

- Headers: `Content-Type: multipart/form-data`
- Body:
  - `supplier_id`: 1
  - `category_id`: 1
  - `name`: "Product Name"
  - `base_price`: 500
  - `stock_quantity`: 100
  - `images[]`: file (multiple images allowed)

### Analytics

`GET /api/admin/analytics`

### Create Category

`POST /api/admin/create-category`

- Body: `{ "name": "Uniforms" }`

### Settlements

`GET /api/admin/settlements`

### Update Settings

`POST /api/admin/settings`

- Body:

  ```json
  {
    "settings": [
      { "key": "gst_percentage", "value": "18" },
      { "key": "platform_service_charge", "value": "25" }
    ]
  }
  ```

## Webhooks

`POST /api/payment/webhook/{provider}` (Razorpay/Stripe)
