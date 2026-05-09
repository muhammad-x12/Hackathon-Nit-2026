# School Ecommerce & Logistics Platform (Multi-Tenant)

[![Laravel](https://img.shields.io/badge/Laravel-12.x-red.svg)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-blue.svg)](https://php.net)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance, multi-tenant backend built with Laravel and React, designed to empower educational institutions with dedicated, branded digital marketplaces while streamlining the supply chain for uniforms, books, and stationery.

---

## 🚩 Problem Statement

Educational institutions often struggle with managing specialized retail operations. Parents face fragmented experiences buying uniforms, books, and accessories from various offline vendors, while schools lack a centralized system to monitor sales, manage branding, or ensure timely delivery.

**Key Challenges:**
- **Fragmentation:** Separate vendors for different items leading to logistical chaos.
- **Brand Consistency:** Schools cannot easily provide a unified, branded shopping experience to their students.
- **Operational Overhead:** Manual tracking of commissions, settlements, and inventory.
- **Logistical Hurdles:** Real-time shipping calculation and fulfillment tracking across multiple suppliers are complex to implement.

## 💡 Our Solution

We have built a **Multi-Tenant SaaS Platform** that serves as a bridge between Schools, Suppliers, and Parents. 

### How we solve it:
1. **Subdomain-Based Isolation:** Each school gets its own unique digital storefront (e.g., `greenwood.myschoolstore.in`) with independent branding (logos, colors, banners).
2. **Unified Backend, Distributed Frontend:** A single Laravel instance handles multiple "Tenants" (Schools) using a sophisticated middleware layer that resolves the context based on the subdomain.
3. **Automated Logistics Engine:** Integrated with major providers like **Shiprocket** and **Delhivery** to provide real-time shipping quotes, serviceability checks, and automated label generation.
4. **Financial Transparency:** A built-in Wallet and Settlement system that automatically calculates school commissions and supplier payouts, ensuring clear financial reconciliation.
5. **Supplier-to-Doorstep Workflow:** Orders are automatically routed to the correct supplier, who can then fulfill the order using the integrated logistics service.

---

## 🚀 Key Features

### 🏗️ Multi-Tenancy Architecture
- **Tenant Isolation:** Schools are logically isolated. Customers only see products and settings relevant to their school's subdomain.
- **Dynamic Resolution:** Middleware automatically detects the `current_school` from the host URL or custom headers.
- **Custom Branding:** Schools can configure their own themes, logos, and academic year settings.

### 🛒 E-Commerce Excellence
- **Role-Based Access (RBAC):** Distinct workflows for Super Admins, School Admins, Suppliers, and Customers.
- **Product Mapping:** Suppliers can map products to specific schools with custom margins.
- **Order Management:** Full lifecycle tracking from "Pending" to "Delivered".

### 📦 Integrated Logistics (Shiprocket & Delhivery)
- **Real-time Quoting:** Dynamic shipping cost calculation based on weight, dimensions, and destination pincode.
- **Serviceability:** Automated checks to ensure delivery is possible before the order is placed.
- **Shipment Creation:** One-click ad-hoc shipment creation via Shiprocket API.

### 💰 Financial & Wallet System
- **Escrow-style Payments:** Funds are held and then settled to School/Supplier wallets.
- **Commission Management:** Automated calculation of platform and school fees.
- **Settlement Tracking:** Detailed history of payouts and balance adjustments.

---

## 🛠️ Technical Stack

- **Backend:** Laravel 12.x
- **Frontend:** React 18.x with Vite & Tailwind CSS v4
- **Authentication:** Laravel Sanctum (SPA & API Auth)
- **Permissions:** Spatie Laravel Permission
- **Database:** MySQL (Tenant-ID based isolation)
- **APIs:** Integrated with Shiprocket (Logistics), Delhivery, and Cashfree (Payments).

---

## 💻 Installation & Setup

1. **Clone the Project:**
   ```bash
   git clone https://github.com/muhammad-x12/Hackathon-Nit-2026.git
   cd Hackathon-Nit-2026
   ```

2. **Dependencies:**
   ```bash
   composer install
   npm install
   ```

3. **Environment Config:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database & Seeding:**
   ```bash
   php artisan migrate --seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🌐 Testing Subdomains Locally

To test the multi-tenant resolution on your local machine:

### Method 1: Hostname Mapping (Recommended)
Add entries to your `hosts` file (e.g., `C:\Windows\System32\drivers\etc\hosts`):
```text
127.0.0.1 school-a.myschoolstore.in
127.0.0.1 school-b.myschoolstore.in
```
Then visit `http://school-a.myschoolstore.in:8000`.

### Method 2: X-Test-Subdomain Header
For Postman/Insomnia testing, you don't need host mapping. Simply add the following header:
- **Key:** `X-Test-Subdomain`
- **Value:** `greenwood` (or any valid school subdomain)

---

## 📖 API Documentation
Detailed API documentation is available at [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
