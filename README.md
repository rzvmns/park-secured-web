# ParkSecured Web

Web dashboard for ParkSecured administration, access monitoring, employee management, reports and gate status.

## Live deployment

```text
Frontend Render: https://park-secure-vrxr.onrender.com/
Cloud API:       https://park-secured-cloud-r62j.onrender.com/api
Cloud API docs:  https://park-secured-cloud-r62j.onrender.com/api/docs
```

The web dashboard uses the cloud backend from `park-secured-cloud`. The old local backend in `backend/` is kept only as historical/compatibility code.

## Frontend development

```bash
cd frontend
npm install
npm run dev
```

Optional API override:

```bash
VITE_API_BASE_URL=https://park-secured-cloud-r62j.onrender.com/api
```

## Build

```bash
cd frontend
npm run build
```

## Main features

- Admin and division manager login
- Employee and division management
- Access logs and reports
- Device change request review
- Gate status display
- CSV audit export through the cloud API
