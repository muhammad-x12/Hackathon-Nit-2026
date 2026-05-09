import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { CartProvider } from './store/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetails from './pages/ProductDetails';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import StaticPage from './pages/StaticPage';
import Schools from './pages/Schools';

// Dashboard Pages
import AdminOverview from './pages/AdminOverview';
import SchoolManagement from './pages/admin/SchoolManagement';
import AddEditSchool from './pages/admin/AddEditSchool';
import SupplierManagement from './pages/admin/SupplierManagement';
import AddEditSupplier from './pages/admin/AddEditSupplier';
import ProductManagement from './pages/admin/ProductManagement';
import AddEditProduct from './pages/admin/AddEditProduct';
import SettlementManagement from './pages/admin/SettlementManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminOrders from './pages/admin/AdminOrders';
import HomepageSetup from './pages/admin/HomepageSetup';
import StaticPageManagement from './pages/admin/StaticPageManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import TestimonialManagement from './pages/admin/TestimonialManagement';

import SchoolOverview from './pages/SchoolOverview';
import SchoolCatalog from './pages/SchoolCatalog';
import AddEditSchoolProduct from './pages/AddEditSchoolProduct';
import SchoolOrders from './pages/SchoolOrders';
import SchoolSettlements from './pages/SchoolSettlements';
import SchoolStoreSettings from './pages/school/SchoolStoreSettings';

import SupplierOverview from './pages/SupplierOverview';
import SupplierInventory from './pages/SupplierInventory';
import AddEditSupplierProduct from './pages/AddEditSupplierProduct';
import SupplierOrders from './pages/supplier/SupplierOrders';
import SchoolSetups from './pages/supplier/SchoolSetups';
import SupplierSchoolCatalog from './pages/supplier/SchoolCatalog';
import SchoolSetupDetails from './pages/supplier/SchoolSetupDetails';

import ProfileSettings from './pages/ProfileSettings';
import Profile from './pages/Profile';
import ProfileLayout from './pages/profile/ProfileLayout';
import UserInfo from './pages/profile/UserInfo';
import SavedAddress from './pages/profile/SavedAddress';
import OrdersList from './pages/profile/OrdersList';
import OrderDetails from './pages/profile/OrderDetails';
import ProfileNotFound from './pages/profile/NotFound';
import PlatformSettings from './pages/PlatformSettings';
import ShippingSettings from './pages/ShippingSettings';
import WalletManagement from './pages/admin/WalletManagement';
import WhatsAppFloat from './components/WhatsAppFloat';

const App = () => {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <WhatsAppFloat />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<StaticPage title="About Us" slug="about" />} />
                        <Route path="/schools" element={<Schools />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetails />} />
                        <Route path="/pricing" element={<Pricing />} />

                        {/* Static Pages */}
                        <Route path="/mission" element={<StaticPage title="Our Mission" slug="mission" />} />
                        <Route path="/press" element={<StaticPage title="Press" slug="press" />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/create-store" element={<StaticPage title="Create Your Store" slug="create-store" />} />
                        <Route path="/wholesale" element={<StaticPage title="Wholesale Marketplace" slug="wholesale" />} />
                        <Route path="/commission" element={<StaticPage title="Commission Model" slug="commission" />} />
                        <Route path="/help" element={<StaticPage title="Help Center" slug="help" />} />
                        <Route path="/faqs" element={<StaticPage title="FAQs" slug="faqs" />} />
                        <Route path="/shipping-policy" element={<StaticPage title="Shipping Policy" slug="shipping-policy" />} />
                        <Route path="/refund-policy" element={<StaticPage title="Refund Policy" slug="refund-policy" />} />
                        <Route path="/privacy-policy" element={<StaticPage title="Privacy Policy" slug="privacy-policy" />} />
                        <Route path="/terms" element={<StaticPage title="Terms & Conditions" slug="terms" />} />
                        <Route path="/gst" element={<StaticPage title="GST Information" slug="gst" />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={
                            <ProtectedRoute allowedRoles={['customer', 'school', 'supplier', 'super_admin']}>
                                <Checkout />
                            </ProtectedRoute>
                        } />
                        <Route path="/order-success/:id" element={<OrderSuccess />} />
                        <Route path="/order-failed/:id" element={<OrderFailed />} />
                        <Route path="/order-failed" element={<OrderFailed />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/profile/*" element={
                            <ProtectedRoute allowedRoles={['customer', 'school', 'supplier', 'super_admin']}>
                                <ProfileLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<UserInfo />} />
                            <Route path="address" element={<SavedAddress />} />
                            <Route path="orders" element={<OrdersList />} />
                            <Route path="orders/:id" element={<OrderDetails />} />
                            <Route path="*" element={<ProfileNotFound />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['super_admin']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminOverview />} />
                            <Route path="schools" element={<SchoolManagement />} />
                            <Route path="schools/add" element={<AddEditSchool />} />
                            <Route path="schools/edit/:id" element={<AddEditSchool />} />
                            <Route path="suppliers" element={<SupplierManagement />} />
                            <Route path="suppliers/add" element={<AddEditSupplier />} />
                            <Route path="suppliers/edit/:id" element={<AddEditSupplier />} />
                            <Route path="products" element={<ProductManagement />} />
                            <Route path="products/add" element={<AddEditProduct />} />
                            <Route path="products/edit/:id" element={<AddEditProduct />} />
                            <Route path="categories" element={<CategoryManagement />} />
                            <Route path="wallets" element={<WalletManagement />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="settlements" element={<SettlementManagement />} />
                            <Route path="static-pages" element={<StaticPageManagement />} />
                            <Route path="settings" element={<PlatformSettings />} />
                            <Route path="homepage" element={<HomepageSetup />} />
                            <Route path="reviews" element={<ReviewManagement />} />
                            <Route path="testimonials" element={<TestimonialManagement />} />
                        </Route>

                        {/* School Admin Routes */}
                        <Route path="/school" element={
                            <ProtectedRoute allowedRoles={['school']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<SchoolOverview />} />
                            <Route path="catalog" element={<SchoolCatalog />} />
                            <Route path="catalog/setup/:id" element={<AddEditSchoolProduct />} />
                            <Route path="orders" element={<SchoolOrders />} />
                            <Route path="settlements" element={<SchoolSettlements />} />
                            <Route path="store-settings" element={<SchoolStoreSettings />} />
                            <Route path="settings" element={<ProfileSettings />} />
                        </Route>

                        {/* Supplier Routes */}
                        <Route path="/supplier" element={
                            <ProtectedRoute allowedRoles={['supplier']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<SupplierOverview />} />
                            <Route path="inventory" element={<SupplierInventory />} />
                            <Route path="products/add" element={<AddEditSupplierProduct />} />
                            <Route path="products/edit/:id" element={<AddEditSupplierProduct />} />
                            <Route path="orders" element={<SupplierOrders />} />
                            <Route path="school-setups" element={<SchoolSetups />} />
                            <Route path="school/:schoolId/catalog" element={<SupplierSchoolCatalog />} />
                            <Route path="school-setup/:schoolProductId" element={<SchoolSetupDetails />} />
                            <Route path="settings" element={<ProfileSettings />} />
                        </Route>

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
};

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
