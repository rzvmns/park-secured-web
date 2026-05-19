# ParkSecured Web

Interfata React pentru administrarea si monitorizarea accesului ParkSecured.
Frontend-ul este configurat sa consume API-ul cloud din `park-secured-cloud`.

## Configurare

```powershell
cd frontend
cp .env.example .env
```

Valoarea implicita pentru API-ul cloud hostat pe Render:

```text
VITE_API_BASE_URL=https://park-secured-cloud.onrender.com/api
```

Ruleaza:

```powershell
npm install
npm run dev
```

Cont initial, dupa initializarea bazei de date din cloud:

```text
email: admin@parksecure.local
password: admin123
```

## Integrare cloud

Frontend-ul foloseste:

```text
POST /api/auth/login
GET  /api/employees
POST /api/employees
PUT  /api/employees/:id
GET  /api/access-events
POST /api/access-events
GET  /api/reports/global
GET  /api/reports/division/:divisionId
GET  /api/divisions
```

Tokenul JWT primit la login este trimis automat in headerul:

```text
Authorization: Bearer <token>
```
