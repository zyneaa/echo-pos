# PROJECT OVERVIEW: Modern POS System
Goal: Develop a fast, responsive Point of Sale (POS) application with barcode/QR scanning capabilities, inventory management, and real-time checkout.
Target Currency: Myanmar Kyat (MMK) - ensure all price variables handle large integers and use comma-separated UI formatting (e.g., 15,000 MMK). No decimal fractions required.

Target Currency: Myanmar Kyat (MMK) - ensure all price variables handle large integers and use comma-separated UI formatting (e.g., 15,000 MMK). No decimal fractions required.

## 1. TECH STACK (Recommended)

Frontend: React Native (Expo) OR Flutter (for seamless mobile/tablet camera integration for scanning).

Backend/Database: Firebase (Firestore) OR Supabase (PostgreSQL). Agent Note: Priority on offline-sync capabilities.

State Management: Redux Toolkit, Zustand, or Provider/Riverpod.

## 2. DATABASE SCHEMA DESIGN
Agents must implement the following core tables/collections:

Products Table:

id (UUID/String)

barcode_id (String - Scanned QR/Barcode value)

name (String)

image_url (String)

price_mmk (Integer)

stock_quantity (Integer)

cost_price_mmk (Integer - for profit analysis)

created_at (Timestamp)

Transactions Table:

transaction_id (UUID/String)

total_amount_mmk (Integer)

payment_method (String - Cash, KPay, WavePay)

items (Array of Objects: [ { product_id, quantity, price_at_time_of_sale } ])

timestamp (Timestamp)

## 3. CORE WORKFLOWS & REQUIREMENTS

A. Inventory Management (Admin)

Implement camera integration to read Barcodes/QR codes.

Form to input: Product Name, Price (MMK), Stock Quantity, and upload an image.

On save, push to DB. If the barcode_id already exists, prompt to update stock instead of creating a new entry.

B. Product Lookup & Analytics

Create a search bar with dual input: text-based search (by name) or camera-based search (by scanning).

Display a product details card showing: Current Stock, Total Sales Volume (calculated from Transactions table), and recent sale rate.

C. Fast Checkout System (Cashier)

Must be highly optimized for speed.

UI should have a constant camera viewport or a hardware-scanner listener.

Scanning an item instantly adds it to a "Cart" state and increments quantity if scanned multiple times.

Fetch ONLY name and price_mmk from DB to minimize latency.

Calculate total instantly.

On "Complete Sale": Batch write to DB -> Insert into Transactions AND decrement stock_quantity in Products.

## 4. IMPLEMENTATION TASKS FOR AGENT

Initialize the project repository with the chosen frontend framework.

Set up the database schema and offline-sync configuration.

Implement the Camera/Scanner module (ensure permissions are handled).

Build the Inventory Input Screen (Create/Update operations).

Build the Fast Checkout Screen (Cart state management, rapid scanning, batch DB updates).

Build the Dashboard/Lookup screen (Analytics and search queries).
