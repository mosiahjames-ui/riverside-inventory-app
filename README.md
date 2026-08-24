# Riverside Books Inventory Dashboard

The Staff Inventory & Ops Dashboard is the core operational hub for Riverside Books. It enables bookstore staff to monitor real-time stock levels, update inventory counts, and manage customer order fulfillment.

## Role in Team Suite
Our product acts as the shared database dashboard for Riverside Books:
- **Product A (Customer Ordering & Loyalty):** Receives customer pre-orders and in-store pickup requests, sending them to the Ops Dashboard as `Pending`. Staff mark them `Ready for Pickup` once fulfilled.
- **Product C (Customer Support Chatbot):** Queries real-time `qty_in_stock` and order `status` managed in this dashboard to answer customer queries accurately.
- **Product D (Marketing Content Generator):** Reads stock level updates from this dashboard to trigger auto-generated promotional content for restocked or low-inventory titles.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

## Deploy

This is a Vite static site. Set the hosting provider's build command to `npm run build` and its output directory to `dist`.
