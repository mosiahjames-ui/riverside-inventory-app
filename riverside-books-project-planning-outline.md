# Riverside Books — Project Planning Outline

*Organized from team handwritten notebook pages + project brief*

## Menu
- [Project Brief](#project-brief)
- [Project Overview & Repo Structure](#project-overview--repo-structure)
- [Shared Data Sets](#shared-data-sets)
- [Design Language](#design-language)
- [Pain Points → Product Mapping](#pain-points--product-mapping)
- [Product A — Customer Ordering & Loyalty App (Erick)](#product-a--customer-ordering--loyalty-app-owner-erick)
- [Product B — Staff Inventory & Ops Dashboard (Mosiah)](#product-b--staff-inventory--ops-dashboard-owner-mosiah)
- [Product C — Customer Support Chatbot (Ishmam)](#product-c--customer-support-chatbot-owner-ishmam)
- [Product D — Marketing Content Generator (Mara)](#product-d--marketing-content-generator-owner-mara)
- [Open Questions / Follow-Ups](#open-questions--follow-ups)

---

## Project Brief

### Direct-to-Consumer Retail

**Business:** Riverside Books is a single-location independent bookstore selling new books, cards, and small gifts, and hosting occasional author events. The owner runs day-to-day operations with two part-time booksellers. Inventory, orders, and customer communication are currently managed through memory, sticky notes, and a basic spreadsheet. The goal is to modernize the customer experience and staff operations without becoming a large e-commerce business — customers still shop primarily by walking in or calling ahead.

**Business Model Type:** Direct sale (retail). The store sells physical products (books, gifts) and event tickets directly to individual customers, paid at point of sale — either online for a pre-order or in person at checkout.

### Customers & Users

- **Customers** — local residents and regulars who browse in-store or call ahead to check stock, place a pre-order, or ask about events.
- **Staff** — the owner and two part-time booksellers who manage inventory, fulfill orders, and answer customer questions throughout the day.

### Common Pain Points

1. Customers can't check if a specific book is in stock before making a trip, or place a pre-order online.
2. No loyalty/rewards system, so regulars have no incentive to keep shopping at this store specifically.
3. Staff track inventory by memory or paper log, so no one notices a book is out of stock until a customer asks.
4. Common questions (store hours, return policy, event schedule) get asked repeatedly and pull staff away from the register.
5. Social media posting is inconsistent because writing captions takes time nobody has.

### Product Suite & Assigned Roles

| Product | Description | Owner |
|---|---|---|
| A — Customer Ordering & Loyalty App | Search the catalog, see live stock, place a pre-order for pickup, and earn a loyalty stamp with each purchase | Erick |
| B — Staff Inventory & Ops Dashboard | Live view of stock levels by title, flags low/out-of-stock titles, lists pending pre-orders to prepare | Mosiah |
| C — Customer Support Chatbot | Answers customer questions using real-time inventory, hours, and policies — can confirm if a specific title is in stock right now | Ishmam |
| D — Marketing Content Generator | Given a book or event, generates a short social caption and post idea for staff to review and publish | Mara |

---

## Project Overview & Repo Structure

Not a single repo. This project is split into 5 separate repositories, each deployed independently. The landing page is a lightweight "hub" — it doesn't contain any product logic itself, it just links out to each product's live deployed URL.

| # | Repo | Contains | Deploys To |
|---|---|---|---|
| 0 | riverside-books-landing | Landing page — HTML/CSS/JS, cards grouped by audience | e.g. riversidebooks.com (group repo) |
| 1 | riverside-reader-app (Product A, Erick) | Customer Ordering & Loyalty App | Own deployed URL (e.g. Vercel/Netlify link) (Erick's repo) |
| 2 | riverside-inventory-app (Product B, Mosiah) | Staff Inventory & Ops Dashboard | Own deployed URL (Mosiah's repo) |
| 3 | riverside-chat-app (Product C, Ishmam) | Customer Support Chatbot | Own deployed URL (Ishmam's repo) |
| 4 | riverside-social-app (Product D, Mara) | Marketing Content Generator | Own deployed URL (Mara's repo) |

### How it works

1. User lands on the landing page repo (`riverside-books-landing`).
2. They see 4 cards, grouped into two sections: Customer and Staff.
3. Clicking a card sends them to that product's deployed URL, which lives in its own independent repo/codebase.
4. Each product repo has its own HTML/CSS/JS (and its own backend/database as needed) and can be built, deployed, and updated independently of the others.

**Why separate repos:** each teammate (Erick, Mosiah, Ishmam, Mara) owns one product end-to-end — their own codebase, their own deploy pipeline — without stepping on each other's code. The landing page is the only shared piece, and it only needs to know each product's live URL, not its internals.

### Landing Page Card Layout

**Customer Cards**

| Card | Links To |
|---|---|
| 🔍 Shop / Pre-order | Product A (Erick) deployed URL |
| 💬 Ask Us Anything (Chatbot) | Product C (Ishmam) deployed URL |

**Staff Cards**

| Card | Links To |
|---|---|
| 📦 Inventory Dashboard | Product B (Mosiah) deployed URL |
| 📣 Marketing Content Generator | Product D (Mara) deployed URL |

---

## Shared Data Sets

Even though each product is built and deployed as its own separate repo, they all need to read (and sometimes write) the same underlying data — otherwise the chatbot won't know real stock levels, the ops dashboard won't reflect real purchases, etc. This section defines that shared data once, so every product references the same structure instead of everyone inventing their own version.

We're working with 9 shared datasets. Each one should live as its own file/table so any repo can read or write to it via a shared database or a small internal API (see Open Questions). Every field below lists a **Type** so it's unambiguous whether it's a number, plain text, true/false, a date, a fixed set of options, or a link to another dataset.

| # | Dataset (file/table name) | What it holds | Used by |
|---|---|---|---|
| 1 | books | The book catalog | A (Erick), B (Mosiah), C (Ishmam), D (Mara) |
| 2 | merchandise | Non-book items: cards and small gifts | A (Erick) |
| 3 | customers | Customer profiles & contact info | A (Erick) |
| 4 | purchases | Transaction records, including pre-orders | A (Erick), B (Mosiah) |
| 5 | inventory | Live stock levels per book | B (Mosiah), C (Ishmam) |
| 6 | store_info | Hours, policies, reward rules, about/history text | C (Ishmam) |
| 7 | events | Author events / store events | C (Ishmam), D (Mara) |
| 8 | social_accounts | Social platform links | D (Mara) |
| 9 | social_posts | Individual posts — what, where, and when | D (Mara) |

Below, each dataset is written the way it should actually be structured, with a note wherever something was cleaned up or added.

### `books` — Book Catalog

| Field | Type | Notes |
|---|---|---|
| book_id | Text (ID) | Primary key |
| title | Text | Your notes listed both "Name" and "Title" as separate fields — merged into one, since they mean the same thing for a book. |
| author | Text | |
| isbn | Text | |
| genre | Text | |
| format | Enum: Hardcover / Softcover | |
| pub_date | Date | |
| blurb | Long Text | Description/summary |
| regular_price | Number | |
| rating | Number | e.g. 1–5 stars. Your notes had "Ratings/Recommendations" as one field — split "recommended" out since it's really the same idea as staff_pick below. |
| bestseller | Boolean (True/False) | |
| staff_pick | Boolean (True/False) | |

### `merchandise` — Gifts & Cards (new)

Your project brief mentions the store also sells cards and small gifts, not just books — the original brainstorm only had a schema for books. Rather than force gift items into the books table (which would leave fields like isbn/author blank and meaningless), this is a small, separate, intentionally simple dataset.

| Field | Type | Notes |
|---|---|---|
| item_id | Text (ID) | Primary key |
| item_name | Text | |
| item_type | Enum: Gift / Card | |
| price | Number | |

**Scope note:** this does not have live stock tracking like inventory does for books — no quantity, no reorder logic. Keeping it to name/type/price only for now, so books stay the only product with a full inventory system. Revisit if the store wants that level of detail for gifts too.

### `customers` — Customer Profiles

| Field | Type | Notes |
|---|---|---|
| customer_id | Text (ID) | Primary key |
| first_name | Text | |
| last_name | Text | |
| birthday | Date | |
| email | Text | New — needed to notify a customer when a pre-order is ready for pickup. |
| phone | Text | New — same reason as email. |
| rewards_card_number | Text | |
| stamp_count | Number | New — running total of loyalty stamps, lives directly on the customer record. Updated (+1) by Product A (Erick) each time that customer completes a purchase. |
| credit_card_info | Text | Since this is a class project, we're generating our own dummy database rather than handling real payments — so this can just be placeholder/fake card data. (In a real production version, you'd never store raw card numbers — you'd use a payment processor token instead.) |

> **Note:** your original notes listed "Purchases" as a field under Customer. It isn't a field — it's a relationship. A customer's purchase history is just every row in `purchases` where `customer_id` matches theirs.

### `purchases` — Transactions (including Pre-orders)

| Field | Type | Notes |
|---|---|---|
| purchase_id | Text (ID) | Primary key |
| customer_id | Foreign Key → customers | |
| purchase_type | Enum: Book / Merchandise / Event Ticket | New — needed since purchases can now be a book, a gift/card, or an event ticket, not just a book. |
| item_id | Foreign Key → books.book_id, merchandise.item_id, or events.event_id | Updated from book_id — which table it points to depends on purchase_type above. |
| quantity | Number | New — a purchase used to assume exactly 1 item; this allows buying multiple copies/items in one transaction. |
| order_type | Enum: In-store / Pre-order | New — this is the pre-order piece you asked about. |
| status | Enum: Pending / Ready for Pickup / Completed / Cancelled | New — this is what Product B (Mosiah) reads to know which pre-orders still need to be prepared. |
| date | Date | |
| original_price | Number | New — the catalog price at time of purchase (from books.regular_price or merchandise.price), so you can see it side-by-side with what was actually paid. |
| price_paid | Number | Actual price paid, including tax |
| discount_applied | Number | Dollar amount discounted, 0 if none |
| points_earned | Number | |
| receipt | Text (ID) | |

> **Note:** `original_price` and `price_paid` are kept side-by-side on purpose, so it's easy to see the discount at a glance without cross-referencing books or merchandise every time.

### `inventory` — Live Stock (Books Only)

| Field | Type | Notes |
|---|---|---|
| book_id | Foreign Key → books | |
| qty_in_stock | Number | How many copies are currently on the shelf |
| qty_sold | Number (derived) | Not stored directly — computed by counting matching purchases rows, so it can't go out of sync |
| last_order_qty | Number | New — how many copies were ordered the last time this book was restocked (e.g. 10) |
| last_order_date | Date | New — when that order was placed (e.g. July). Together with last_order_qty and qty_sold, this is what lets you say "we ordered 10 in July, 5 sold, 5 left." |
| qty_on_order | Number | Copies ordered from the supplier for the next restock, not yet arrived |
| low_stock_threshold | Number | New — the actual cutoff number (e.g. "anything at or below 3 copies counts as low"). stock_level below is calculated from this instead of being an arbitrary label. |
| stock_level | Enum: Low / Medium / High | Derived — Low if qty_in_stock ≤ low_stock_threshold |
| demand | Enum: High / Low | |
| needs_reorder | Boolean (True/False) | |
| reorder_qty | Number | How many to order when flagged |
| target_stock_qty | Number | How many to keep in stock going forward |

> **Note:** your notes had several overlapping/duplicate versions of "# in stock," "# sold," and "# purchased" across two sections, plus a confusing "T/F" arrow. Cleaned up above into one clear set of fields.

### `store_info` — Hours, Policies, Rewards

| Field | Type | Notes |
|---|---|---|
| hours | Text | Plain text field |
| return_policy | Long Text | Chatbot reads this as-is — actual return transactions aren't tracked as their own dataset for now (see Open Questions). |
| exchange_policy | Long Text | References inventory to confirm stock before allowing an exchange |
| reward_rule | Text | e.g. "X% off after every Y purchases" — a discount, not a free/complimentary book. Exact rule still TBD. |
| birthday_discount_rule | Text | Same idea as reward_rule, but triggered by a customer's birthday (in customers) instead of purchase count — a discount, not a free item. Exact rule still TBD. |
| about_text | Long Text | Store history / owner / seller bio |

### `events` — Store Events

| Field | Type | Notes |
|---|---|---|
| event_id | Text (ID) | Primary key |
| event_name | Text | |
| event_date | Date | |
| event_time | Time | |
| event_location | Text | |
| event_description | Long Text | |
| book_id | Foreign Key → books (Optional) | Most fields in this doc use a book link as required (a purchase or inventory row is about a book), but here it's optional since not every event ties to a specific title (e.g. a general "meet the owner" night). |
| ticket_price | Number (Optional) | New — your brief mentions the store sells event tickets; leave blank or 0 for free events. |

### `social_accounts` — Social Links

| Field | Type | Notes |
|---|---|---|
| instagram_link | URL | |
| tiktok_link | URL | |
| x_link | URL | |
| website_link | URL | |
| play_store_link | URL | |
| app_store_link | URL | |

### `social_posts` — Individual Posts (new)

`social_accounts` above is just static platform links — it has no record of an actual post. This new dataset tracks each piece of content Product D (Mara) generates: what it's about, where it's meant to go, and when.

| Field | Type | Notes |
|---|---|---|
| post_id | Text (ID) | Primary key |
| post_date | Date | When the post was (or will be) published |
| platform | Enum: Instagram / TikTok / X / Website | Where it's posted |
| related_type | Enum: Book / Event | What the post is about |
| related_id | Foreign Key → books.book_id or events.event_id | Which book or event, depending on related_type |
| caption_text | Long Text | The generated caption |

---

## Design Language

Since each product lives in its own repo, we need a shared design spec (not shared code) so all 5 sites still look like one cohesive brand:

- Fonts
- Colors

*(Also worth agreeing on: button styles, spacing/sizing, and any reusable UI components — so all 5 sites feel consistent even though they're built separately.)*

**Recommendation:** keep a shared `DESIGN.md` (or a small shared CSS/tokens file each repo copies in) with the agreed fonts, colors, and component styles, since there's no shared codebase to enforce this automatically.

---

## Pain Points → Product Mapping

| Pain Point | Addressed By |
|---|---|
| Can't check stock or pre-order remotely | Product A (Erick) |
| No loyalty/rewards system | Product A (Erick) |
| Inventory tracked by memory/paper, stockouts go unnoticed | Product B (Mosiah) |
| Repetitive questions (hours, policy, events) pull staff from register | Product C (Ishmam) |
| Inconsistent social media posting | Product D (Mara) |

---

## Product A — Customer Ordering & Loyalty App (Owner: Erick)

**Repo:** `riverside-books-ordering-app`

*The sections below are a starting point to help build this out — not a strict spec. Adjust as you actually build it.*

### Product Basics

| | |
|---|---|
| Product Name | Customer Ordering & Loyalty App |
| Builder | Erick |
| Team / Client Scenario | Riverside Books — Direct-to-Consumer Retail |
| Business Model Type | Direct sale (retail) |
| Which product | Product 1 of 4 — the customer-facing ordering & loyalty app |

**1. Problem Statement**
Regular customers have no way to check if a book is in stock before making a trip to the store, and no way to pre-order online — and since there's no loyalty system, regulars have no extra reason to keep coming back to this store specifically instead of a bigger chain.

**2. Target User**
A local regular of Riverside Books who wants to check availability or reserve a book before coming in, and who shops there often enough that a loyalty reward matters to them.

**3. Solution Description (Non-Technical)**
This app lets a customer look up a book from home, see whether it's actually on the shelf right now, and reserve a copy for pickup instead of calling or showing up and hoping. Every purchase also adds a stamp toward a future discount, so shopping here starts to pay off the more someone comes back.

**4. Core User Flow** *(a starting point — most flows land around 3–6 steps)*

1. Customer opens the app and searches/browses books or merchandise.
2. App shows whether the item is currently in stock.
3. Customer places an order — in-store pickup or pre-order.
4. Order is saved with a Pending status.
5. Once fulfilled, the customer's stamp count goes up by 1.
6. Customer can check their stamp progress and order history anytime.

**5. Data Connection**

| Column Name | Column Description | Purpose (Why This Product Needs It) |
|---|---|---|
| book_id, title, author, regular_price (books) | Core catalog info | To let customers search/browse and see what a book costs |
| item_name, price (merchandise) | Gift/card catalog info | To let customers browse non-book items too |
| qty_in_stock (inventory) | Live stock count | To show whether an item is actually available before letting someone order it |
| customer_id, stamp_count (customers) | Loyalty tracking | To display progress toward a reward and know who's ordering |
| purchase_id, order_type, status (purchases) | The order record itself | To create a new order and let the customer track its status |

**6. How This Connects to the Other 3 Products**
Every order this app creates is what Product B (Mosiah) reads to know what needs preparing and what's selling, and it depends on Product B's live inventory numbers to know what's actually in stock before allowing an order.

**Questions to Ask Yourself**
- What should happen if a customer tries to order something that's actually out of stock by the time they check out?
- Should a customer be able to cancel or edit a pending order themselves, or does that require staff?
- How will a customer know how close they are to their next reward?

**Prompt Ideas to Get Started**
- "Build a search bar that filters a list of books by title or author."
- "Create a book detail page that shows live stock status."
- "Build a form that creates a new pre-order and saves it with a Pending status."

**Questions to Ask Your Teammates**
- Ask Mosiah (Product B): "What format do you need order data in so your dashboard can read it correctly?"
- Ask Ishmam (Product C): "If your chatbot tells someone a book is in stock, will that match what my app shows in real time?"
- Ask Mara (Product D): "Should I flag which books are staff picks so you know what to prioritize promoting?"

---

## Product B — Staff Inventory & Ops Dashboard (Owner: Mosiah)

**Repo:** `riverside-books-ops-dashboard`

*The sections below are a starting point to help build this out — not a strict spec. Adjust as you actually build it.*

### Product Basics

| | |
|---|---|
| Product Name | Staff Inventory & Ops Dashboard |
| Builder | Mosiah |
| Team / Client Scenario | Riverside Books — Direct-to-Consumer Retail |
| Business Model Type | Direct sale (retail) |
| Which product | Product 2 of 4 — the staff-facing inventory dashboard |

**1. Problem Statement**
Staff currently track inventory by memory or a paper log, so no one notices a title is out of stock until a customer asks for it — and there's no single place to see which pre-orders still need to be pulled and prepped.

**2. Target User**
The owner or one of the two part-time booksellers, checking stock levels or prepping pre-orders during a shift.

**3. Solution Description (Non-Technical)**
This dashboard gives staff one screen that shows exactly how many copies of each book are on the shelf, which titles are running low and need reordering, and which customer pre-orders are waiting to be pulled and set aside — replacing sticky notes and guesswork with a live, accurate view.

**4. Core User Flow** *(a starting point — most flows land around 3–6 steps)*

1. Staff member opens the dashboard.
2. Sees a list of titles sorted or flagged by stock level (low/medium/high).
3. Sees which titles are flagged as needing a reorder.
4. Sees a separate list of pending pre-orders that need to be prepared.
5. Marks a pre-order as "Ready for Pickup" once it's pulled.
6. Updates stock numbers after a new shipment arrives.

**5. Data Connection**

| Column Name | Column Description | Purpose (Why This Product Needs It) |
|---|---|---|
| book_id, title (books) | Which book a stock row is about | To label inventory rows with a readable title, not just an ID |
| qty_in_stock, qty_sold, last_order_qty, last_order_date (inventory) | Core stock numbers | The main data this dashboard displays and manages |
| low_stock_threshold, needs_reorder (inventory) | Reorder flagging | To flag which titles need attention without staff doing the math themselves |
| purchase_id, status, item_id (purchases) | Order records | To list which pre-orders are pending and need to be prepared |

**6. How This Connects to the Other 3 Products**
This dashboard reads every order Product A (Erick) creates to know what's selling and what pre-orders need fulfilling, and the live stock numbers it maintains are what Product C's chatbot (Ishmam) reads to answer customer stock questions.

**Questions to Ask Yourself**
- How do I decide when a title actually needs to be reordered, not just "running low"?
- What happens to a pre-order once I mark it "Ready for Pickup" — does it move to a different list or disappear?
- Should I be able to manually adjust a stock number if a book gets damaged or lost, outside of a normal sale?

**Prompt Ideas to Get Started**
- "Build a table view listing every book with its current stock count and a low-stock flag."
- "Create a filtered view that only shows pending pre-orders."
- "Build a button that updates a book's stock count after a new shipment arrives."

**Questions to Ask Your Teammates**
- Ask Erick (Product A): "How quickly after a customer places an order should it show up on my dashboard?"
- Ask Ishmam (Product C): "Do you need real-time stock numbers, or is a periodic refresh okay?"
- Ask Mara (Product D): "Should I flag it if a book's stock gets too low to keep promoting?"

---

## Product C — Customer Support Chatbot (Owner: Ishmam)

**Repo:** `riverside-books-chatbot`

*The sections below are a starting point to help build this out — not a strict spec. Adjust as you actually build it.*

### Product Basics

| | |
|---|---|
| Product Name | Customer Support Chatbot |
| Builder | Ishmam |
| Team / Client Scenario | Riverside Books — Direct-to-Consumer Retail |
| Business Model Type | Direct sale (retail) |
| Which product | Product 3 of 4 — the customer-facing support chatbot |

**1. Problem Statement**
Staff get pulled away from the register repeatedly to answer the same questions — store hours, return policy, upcoming events, and whether a specific title is in stock — instead of helping the customer in front of them.

**2. Target User**
A customer who's browsing online or calling ahead with a quick question, before deciding whether to make the trip in.

**3. Solution Description (Non-Technical)**
This chatbot answers common customer questions instantly using the store's real, current information — not a generic script. If someone asks "do you have [book] in stock," it can actually check and answer "yes, 3 copies" instead of just telling them to call the store.

**4. Core User Flow** *(a starting point — most flows land around 3–6 steps)*

1. Customer opens the chatbot and types a question.
2. Chatbot figures out what kind of question it is (stock, hours, policy, event).
3. Chatbot looks up the relevant live data (e.g. inventory for a stock question).
4. Chatbot replies with a specific, current answer.
5. If it can't answer confidently, it suggests calling or visiting the store.

**5. Data Connection**

| Column Name | Column Description | Purpose (Why This Product Needs It) |
|---|---|---|
| hours, return_policy, exchange_policy, reward_rule (store_info) | Store info & policies | The core FAQ content the bot answers from |
| qty_in_stock (inventory) | Live stock count | To answer "is this book in stock" with a real number |
| title, author (books) | Book lookup | To match what a customer is asking about to an actual title |
| event_name, event_date, event_description (events) | Event info | To answer questions about upcoming events |

**6. How This Connects to the Other 3 Products**
This chatbot pulls live stock numbers from Product B's inventory (Mosiah), the shared book catalog everyone uses, and event info that Product D (Mara) also reads from when generating promotional content.

**Questions to Ask Yourself**
- What should the chatbot say if it genuinely doesn't know the answer?
- How specific should stock answers be — "in stock" versus "3 copies left"?
- Should the chatbot ever nudge someone toward placing a pre-order, or should it just answer questions?

**Prompt Ideas to Get Started**
- "Build a simple chat interface where a user types a question and gets a text response."
- "Write a function that matches a customer's question to a category: hours, policy, stock, or event."
- "Create a lookup that checks a book's stock count and returns a plain-language answer."

**Questions to Ask Your Teammates**
- Ask Mosiah (Product B): "How fresh does your inventory data need to be for my answers to stay accurate?"
- Ask Erick (Product A): "If I tell someone a book is available, should I point them to your app to place an order?"
- Ask Mara (Product D): "Should I be aware of upcoming promoted posts in case a customer asks about them?"

---

## Product D — Marketing Content Generator (Owner: Mara)

**Repo:** `riverside-books-content-generator`

*The sections below are a starting point to help build this out — not a strict spec. Adjust as you actually build it.*

### Product Basics

| | |
|---|---|
| Product Name | Marketing Content Generator |
| Builder | Mara |
| Team / Client Scenario | Riverside Books — Direct-to-Consumer Retail |
| Business Model Type | Direct sale (retail) |
| Which product | Product 4 of 4 — the staff-facing content generator |

**1. Problem Statement**
The store posts to social media inconsistently because writing captions takes time nobody on a two-person part-time staff actually has, so books and events don't get the promotion they'd benefit from.

**2. Target User**
A staff member (or the owner) who wants to post about a new book or upcoming event but doesn't have time to write the caption from scratch.

**3. Solution Description (Non-Technical)**
Given a specific book or event, this tool writes a short, ready-to-use social media caption and post idea. Staff just review it, tweak if needed, and post — turning a task that used to take real time into something that takes a minute.

**4. Core User Flow** *(a starting point — most flows land around 3–6 steps)*

1. Staff member picks a book or event to promote.
2. Tool pulls the relevant details (title/author/blurb, or event name/date/description).
3. Tool generates a caption and post idea.
4. Staff reviews and edits if needed.
5. Staff manually posts it to the platform.
6. The post gets logged (what it was about, platform, date) for reference.

**5. Data Connection**

| Column Name | Column Description | Purpose (Why This Product Needs It) |
|---|---|---|
| title, author, blurb (books) | Book details | Content to build a caption around |
| event_name, event_date, event_description (events) | Event details | Content to build an event promo around |
| instagram_link, tiktok_link, x_link, etc. (social_accounts) | Platform links | To know where a generated post is meant to go |
| post_date, platform, caption_text (social_posts) | The saved post record | To log what was generated, where, and when |

**6. How This Connects to the Other 3 Products**
This tool pulls book details from the shared catalog and event details from the same events dataset Product C's chatbot (Ishmam) also reads from, so the same information customers can ask about is what gets promoted.

**Questions to Ask Yourself**
- What tone should the generated captions have — playful, informative, warm?
- Should the tool generate one caption per request, or a few options to choose from?
- How much editing should staff realistically expect to do before publishing?

**Prompt Ideas to Get Started**
- "Build a form where staff pick a book or event and get back a generated caption."
- "Write a function that pulls a book's title, author, and blurb and turns them into a short caption."
- "Create a simple log that saves each generated post with its date and platform."

**Questions to Ask Your Teammates**
- Ask Erick (Product A): "Which books should I prioritize promoting — new arrivals, staff picks, or bestsellers?"
- Ask Ishmam (Product C): "Are there common customer questions I could turn into content ideas?"
- Ask Mosiah (Product B): "Should I avoid promoting a book that's about to run out of stock?"

---

## Open Questions / Follow-Ups

1. Pre-order data is now captured via `purchases.status`, but the actual staff workflow (how/when a customer gets notified their pickup is ready) is still undecided.
2. Finalize font & color palette for the design language.
3. Define full list of button design states/styles.
4. Decide the exact reward rule (what % off, and after how many purchases) and the exact birthday discount rule.
5. Decide the actual number for `low_stock_threshold` and `target_stock_qty` per book (or a store-wide default) — the fields exist now, but the specific numbers are still TBD.
6. How will the 9 shared datasets actually be hosted/shared across 5 separate repos? Options: (a) one shared external database (e.g. a hosted Postgres/Airtable/Firebase) all repos connect to, or (b) one product exposes a small internal API that the others call. Needs a decision before build starts.
7. Decide on hosting/deploy platform for all 5 repos (e.g. all on Vercel/Netlify) so URLs are consistent and easy to link from the landing page.
8. Return/exchange transactions are intentionally not tracked as their own dataset right now — `return_policy` stays a plain text field the chatbot reads as-is. Revisit later if the store wants to log actual returns.
9. `merchandise` (gifts/cards) intentionally has no live stock tracking yet — only books get a full inventory system for now. Revisit if the store wants that level of detail for gifts too.
10. For the demo: should we keep it simple with no sign-in/auth and no gating — landing page just groups the cards visually by audience and links straight to each deployed product? (Not established yet — open for discussion.)
