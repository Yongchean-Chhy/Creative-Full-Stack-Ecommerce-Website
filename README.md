# DreamZZZ
 
A full-stack web app for a fictional "sleep outsourcing" service. Users place orders for professional sleeping services, track them, update shipping details, and cancel eligible orders — all through server-rendered pages and a REST-style API.

## Table of Contents
 
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Services & Pricing](#services--pricing)
- [Order Lifecycle](#order-lifecycle)
- [API Endpoints](#api-endpoints)
- [Page Routes](#page-routes)
- [Validation](#validation)
- [Client-Side JavaScript](#client-side-javascript)
- [Search & Filtering](#search--filtering)
- [Cookies & Personalization](#cookies--personalization)
- [Error Handling](#error-handling)
- [SSH Database Tunnel](#ssh-database-tunnel)
- [Getting Started](#getting-started)
- [Example User Flows](#example-user-flows)
- [Security Notes](#security-notes)
- [Future Improvements](#future-improvements)
- [Technical Concepts Demonstrated](#technical-concepts-demonstrated)
- [License](#license)

## Features
 
| | |
|---|---|
| **Service Ordering** | Choose a service and quantity, pick a shipping option, enter sender/delivery info, see a live-calculated total |
| **Order Tracking** | Look up an order by ID; view product, status, and cost; see a countdown before it ships |
| **Order Management** | Update delivery address or shipping option, or cancel — while the order is still `Placed` |
| **Order Search** | Admin page to search by sender name and filter by status |
| **Personalization** | Cookie stores the last-used sender name and pre-fills it next time |
| **Input Validation** | Validates fields, product/shipping selections, quantities, and length limits |
| **Server-Side Rendering** | Pug templates, Express routing, static CSS/JS/image assets |
 
## Tech Stack
 
| Layer | Technologies |
|---|---|
| Backend | Node.js, Express.js (CommonJS) |
| Frontend | Pug, HTML, CSS, vanilla JavaScript, Fetch API |
| Other | `cookie-parser`, SSH tunneling (`tunnel-ssh`) into the University of Minnesota CSE database environment |

 ## Architecture
 
```text
Browser
   │
   ├── Pug Pages
   └── Client JavaScript
         │
         ▼
   Express Server
   ├── Page Routes
   ├── API Routes ── Order Management
   └── Static Files
         │
         ▼
   In-Memory Orders
```
 
> Orders are currently stored **in memory** on the server, not persisted to a database.

## Project Structure
 
```text
├── server.js                 # Main Express application
├── tunnel.js                 # SSH tunnel configuration
├── package.json              # Project dependencies
├── package-lock.json
│
├── templates/
│   ├── layout.pug            # Shared page layout
│   ├── link.pug              # Shared resources
│   ├── page_header.pug       # Shared navigation/header
│   ├── about.pug             # DreamZZZ landing/about page
│   ├── order.pug             # Order creation page
│   ├── tracking.pug          # Order tracking page
│   ├── orders.pug            # Order management template
│   ├── render_orders.pug     # Dynamic order search results
│   ├── render_success.pug    # Successful order page
│   └── 404.pug               # Not-found page
│
└── resources/
    ├── css/
    │   └── main.css
    ├── js/
    │   ├── order.js          # Order form behavior and API calls
    │   └── update.js         # Tracking, cancellation, and updates
    ├── images/
    │   └── ...
    └── database/
        └── schema.sql
```

> `node_modules/` is included in the submitted ZIP but should **not** be committed to GitHub — install with `npm install` instead.
 
## Services & Pricing
 
| Service | Price |
|---|---:|
| Power Nap Package | $1,000.00 |
| Overnight Coverage | $30,000.00 |
| Dream Customization | $100.00 |
 
Total cost is computed server-side:
 
```javascript
cost = prices[order.product] * order.quantity
```
 
The frontend mirrors this calculation live as the product or quantity selection changes.

## Order Lifecycle
 
**Placing an order:**
 
```text
Select product → quantity → sender info → address → shipping option
   → Submit → POST /api/order → Validate → Create order → Return order ID
```
 
New orders start in the `Placed` state:
 
```text
Placed
   ├── Cancelled
   └── Shipped → Delivered
```
 
Newly placed orders also show a **five-minute countdown**; when it hits zero, the client updates the displayed status to `Shipped`.

## API Endpoints
 
**Create an order** — `POST /api/order`
 
```json
{
  "product": "Power Nap Package",
  "quantity": 1,
  "shipping": "flat rate",
  "from_name": "Satoru Gojo",
  "address": "Satoru Gojo 123 Spirit Ave SE Bobo Lake, FL 99099"
}
```
Validates content type, required fields, product, shipping option, quantity, name, and address length. Returns an order ID on success.
 
**Update an order** — `POST /api/update` (only while `Placed`)
 
```json
{
  "order_id": 2,
  "new_addr": "New Address",
  "shipping_option": "overnight shipping"
}
```
 
**Cancel an order** — `DELETE /api/cancel_order` (only while `Placed`)
 
```json
{ "order_id": 2 }
```
Sets the order's status to `Cancelled`.

## Page Routes
 
| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | DreamZZZ home/about page |
| `GET` | `/about` | About page |
| `GET` | `/order` | Order form |
| `GET` | `/tracking/:id` | Track a specific order |
| `GET` | `/admin/orders` | Search and manage orders |
| `*` | `/*` | 404 page |
 
## Validation
 
| Field | Rule |
|---|---|
| Product | Must be one of: `Power Nap Package`, `Overnight Coverage`, `Dream Customization` |
| Shipping | Must be one of: `flat rate`, `overnight shipping`, `asap` |
| Quantity | Integer, greater than zero |
| Sender name | Non-empty, ≤ 64 characters |
| Address | Non-empty, ≤ 1024 characters |
 
Requests violating these rules return an appropriate HTTP error. A `process_address()` helper also reformats a single-line address into a structured, three-line display format (recipient / street / city, state, ZIP).

 ## Client-Side JavaScript
 
**`order.js`** — product/quantity selection, live price calculation, form submission and API calls, success/error messages, date/time display, form prefill.
 
```javascript
fetch('/api/order', {
  method: "POST",
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```
 
**`update.js`** — countdown timer, cancellation, shipping/address updates, UI state changes, API requests.
 
## Search & Filtering
 
The admin order-management page (`/admin/orders`) supports:
 
- **Search by sender:** `?query=Harry` (case-insensitive)
- **Filter by status:** `?status=shipped` — one of `all`, `placed`, `shipped`, `delivered`
Filters can be combined.
 
## Cookies & Personalization
 
After a successful order, the sender's name is stored in a `name` cookie for **7 days** and used to pre-fill the sender field on future visits to the order page.
 ## Error Handling
 
| Status | When |
|---|---|
| `400 Bad Request` | Invalid or missing request data |
| `404 Not Found` | Nonexistent order or page (dedicated Pug 404 page) |
| `413 Payload Too Large` | Sender name or address exceeds the allowed size |
 
## SSH Database Tunnel
 
`tunnel.js` opens an SSH tunnel to the University of Minnesota CSE database environment, forwarding a local port to the remote MySQL server:
 
```text
Local Machine --SSH--> login05.cselabs.umn.edu --forward--> cse-mysql-classes-02.cse.umn.edu:3306
```
 
Built with `tunnel-ssh` and `prompt`, letting a local instance of the app talk to the remote MySQL server through SSH.

## Getting Started
 
### Prerequisites
- Node.js and npm
- Access to the University of Minnesota CSE environment (only if database tunneling is needed)
### 1. Clone and install
 
```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd hw6
npm install
```
 
### 2. Start the server
 
```bash
node server.js
```
 
Visit **http://localhost:4131**.
 
### 3. (Optional) Run the SSH tunnel
 
```bash
node tunnel.js
```
 
Prompts for your University of Minnesota username and sets up port forwarding.

## Example User Flows
 
**Place an order**
```text
Order page → select service → quantity → sender info → address →
shipping option → submit → receive order ID
```
 
**Track an order**
```text
/tracking/:id → view order ID, product, status, cost → manage if still Placed
```
 
**Manage an order** (only while `Placed`)
```text
Cancel  |  Update address  |  Update shipping option
```
Once shipped, these actions are no longer available.
 
## Security Notes
 
This is an educational project and **not production-ready**. Before deploying publicly:
 
- Add authentication/authorization to admin routes
- Move configuration to environment variables
- Add CSRF protection and rate limiting
- Validate and sanitize all user input
- Use secure cookie settings
- Persist order data in a real database
- Avoid exposing internal infrastructure details
- Strip unnecessary dependencies/dev files from the repo

## Future Improvements
 
- Persist orders in MySQL
- User accounts and authentication
- Real-time order status updates (replace client-only countdown)
- Automated tests and API documentation
- Stronger request validation, CSRF protection, rate limiting
- Authenticated admin dashboard
- Docker support and cloud deployment
- Improved mobile responsiveness
## Technical Concepts Demonstrated
 
Express routing and REST-style API design · HTTP methods/status codes · JSON handling · Pug templating · Fetch API and client-server communication · DOM manipulation and form handling · Cookie management · Input validation and error handling · URL/query parameters · State management · SSH port forwarding
 
## License
 
This project was created for educational purposes.
