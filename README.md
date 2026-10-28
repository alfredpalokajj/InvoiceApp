# Faturimi — Invoice Automation System (MVP)

This app replaces manual invoicing. It tracks each invoice from creation, through courier delivery, to payment by the client. Each role sees only what it is allowed to see.

```
[Created] ─Finance─▶ [Ready for Delivery] ─Courier─▶ [In Transit] ─Courier─▶ [Delivered / Unpaid] ─Client─▶ [Paid]
```

| Role | What they can do |
|---|---|
| **Finance** (Financat) | Add clients and pin their location on a map. Add couriers. Create and edit invoices while they are *Created*. Download PDFs. Assign a courier and mark *Ready for Delivery*. See every invoice, with live status updates. |
| **Courier** (Postieri) | See only invoices assigned to them; *Ready for Delivery* appears as *Pending*. See their own live location and the client's location. Mark *In Transit*, then *Delivered*. |
| **Client** (Klienti) | See only their own invoices, once delivered. Confirm payment, which moves the invoice to *Paid*. |

The UI is in Albanian by default, with an English toggle. PDFs follow the selected language.

## Stack

- **Backend:** ASP.NET Core 10 Web API (`backend/InvoiceApp.Api`)
  - EF Core with SQLite
  - JWT auth with role-based access
  - SignalR for real-time updates
  - QuestPDF for PDF generation
- **Frontend:** React 19, Vite and TypeScript (`frontend/`)
  - TanStack Query, React Router, i18next, Tailwind CSS
- **Maps:** Google Maps when an API key is set. Otherwise OpenStreetMap: Leaflet for the map, Nominatim for address search.

## Running locally

Prerequisites: .NET SDK 10 and Node.js 20+.

```bash
# 1. API → http://localhost:5080
cd backend/InvoiceApp.Api
dotnet run

# 2. Frontend → http://localhost:5173 (a second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

In Development, the API creates `invoiceapp.db` on first start, applies migrations, and seeds demo data. To start fresh, stop the API, delete `backend/InvoiceApp.Api/invoiceapp.db*`, and run it again.

### Demo accounts

All demo accounts use the password `Demo123!`. In dev mode, the login page also lists them as one-click shortcuts.

| Email | Role |
|---|---|
| finance@demo.com | Finance |
| postieri1@demo.com | Courier (Arben Krasniqi) |
| postieri2@demo.com | Courier (Blerim Gashi) |
| alfa@demo.com, beta@demo.com, gama@demo.com | Clients |

### Google Maps (optional)

Without a key, the app uses OpenStreetMap. To switch to Google Maps:

1. In Google Cloud, enable **Maps JavaScript API** and **Geocoding API**, then create an API key.
2. Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_GOOGLE_MAPS_API_KEY=...`.
3. Restart `npm run dev`.

## Tests

```bash
cd backend
dotnet test
```

The integration tests run the real API against a private in-memory SQLite database. They cover:

- every allowed status transition
- out-of-order transitions, which return `409`
- courier isolation and client isolation
- role checks on Finance endpoints
- PDF access
- input validation

For the frontend, run `npm run build`, which type-checks and then builds.

## Project layout

```
backend/
  InvoiceApp.Api/
    Domain/Entities.cs            User, Client, Invoice, Role, InvoiceStatus
    Data/                         AppDbContext, DbSeeder
    Migrations/                   EF Core migrations
    Services/
      InvoiceWorkflow.cs          all invoice writes and the status lifecycle rules
      InvoiceVisibility.cs        the single row-level access rule per role
      InvoiceNotifier.cs          SignalR push to Finance, assigned courier, client
      InvoicePdfService.cs        sq/en PDF
      TokenService.cs             JWT issuing
    Hubs/InvoiceHub.cs            /hubs/invoices
    Controllers/                  auth, clients, couriers, invoices
  InvoiceApp.Tests/               integration tests
frontend/src/
  api/                            axios client, types, React Query hooks
  auth/                           session + role guards
  i18n/                           sq.ts (default), en.ts (type-checked against sq)
  maps/                           LocationPicker / DeliveryMap (Google + Leaflet)
  realtime/useInvoiceHub.ts       SignalR → refetch invoices
  pages/finance|courier|client/   screens per role
```

## API summary

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/login` | anyone |
| GET | `/api/auth/me` | signed in |
| GET, POST | `/api/clients` | Finance |
| GET, PUT | `/api/clients/{id}` | Finance |
| GET, POST | `/api/couriers` | Finance |
| GET | `/api/invoices` | all roles, each filtered to what that role may see |
| GET | `/api/invoices/{id}` | all roles, each filtered to what that role may see |
| GET | `/api/invoices/{id}/pdf?lang=sq\|en` | all roles, each filtered to what that role may see |
| POST | `/api/invoices` | Finance |
| PUT | `/api/invoices/{id}` | Finance, only while the invoice is *Created* |
| POST | `/api/invoices/{id}/ready` with body `{ courierId }` | Finance |
| POST | `/api/invoices/{id}/start` | assigned Courier |
| POST | `/api/invoices/{id}/deliver` | assigned Courier |
| POST | `/api/invoices/{id}/pay` | owning Client |

Errors are returned as ProblemDetails with a stable `code` field (for example `invalid_transition` or `email_taken`), which the UI translates.

## Before going to production

- **JWT key.** Set `Jwt__Key` (32+ characters) as an environment variable. The key in `appsettings.Development.json` is for development only.
- **Database.** Switch from SQLite to SQL Server or PostgreSQL by changing the EF provider and connection string. Run migrations as a deploy step; the app applies them automatically only in Development.
- **HTTPS.** Serve the app over HTTPS. Browsers only allow geolocation on secure origins, so the courier location needs it on phones (localhost is exempt).
- **Geocoding.** Nominatim's free service limits usage, so use a Google key or your own geocoder for real traffic.
- **Payment.** "Pay" records the client's confirmation; there is no payment gateway in this MVP.
