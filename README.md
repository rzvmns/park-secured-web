# 🅿️ ParkSecured — Web & Backend 

Modulul central de backend (**Node.js + Express**) și interfața web destinate administrării, monitorizării și controlului fluxului de acces în parcare.

Sistemul folosește o arhitectură modernă de securitate bazată pe **Sesiuni Hardware Criptografice Rotative**, eliminând complet utilizarea token-urilor statice vulnerabile.

---

## 📋 Cuprins

- [Configurare și Rulare Locală](#️-configurare-și-rulare-locală)
- [Logica de Autentificare](#-logica-unificată-de-autentificare-și-sesiune)
- [Endpoint-uri REST API](#-endpoint-uri-active-și-rutare-rest-api)
- [Structura Bazei de Date](#-structura-bazei-de-date-sincronizate-render)

---

## ⚙️ Configurare și Rulare Locală

### 1. Navigare și Instalare Dependințe

Asigură-te că te afli în folderul corect și instalează modulele necesare (inclusiv pachetele de securitate pentru baze de date și criptare):

```bash
cd backend
npm install
```

### 2. Pornire Server

```bash
node index.js
```

> Serverul va rula local pe **portul 5001** și va asculta conexiunile venite de la aplicația Mobile sau Embedded.

---

## 🔐 Logica Unificată de Autentificare și Sesiune

Sistemul utilizează o singură instanță Cloud Render (PostgreSQL). Parolele utilizatorilor sunt stocate securizat sub formă de hash-uri BCrypt.

### Fluxul Securizat de Acces

| Pas | Acțiune |
|-----|---------|
| **1. Identificare** | Angajatul introduce credențialele pe dispozitivul mobil (`accounts`) |
| **2. Validare Criptografică** | Backend-ul verifică hash-ul parolei folosind `bcrypt.compare` |
| **3. Garanția Unicității** | La fiecare logare reușită, se șterge forțat orice sesiune anterioară (`DELETE FROM smartphones`), asigurând regula: **1 Angajat = 1 Sesiune Activă** |
| **4. Emitere `accessSeed`** | Generare criptografică a unui cod opac aleatoriu de 64 de caractere, salvat în `smartphones` și transmis pe telefon pentru deblocarea barierei |

---

## 🌐 Endpoint-uri Active și Rutare REST API

Sistemul expune următoarele rute esențiale care consumă direct datele din tabela `accounts`.

### 📱 Segmentul Mobile Securizat

#### `POST /api/mobile/login-secure`

Autentificare inițială prin BCrypt și înregistrare unică a amprentei hardware.

**Payload:**
```json
{
  "email": "string",
  "password": "string",
  "platform": "string",
  "deviceIdentifier": "string"
}
```

**Răspuns:** Returnează codul secret de sesiune `accessSeed`.

---

#### `POST /api/validate-access`

Validarea instantanee a seed-ului pentru deschiderea fizică a barierei.

**Payload:**
```json
{
  "accessSeed": "string"
}
```

**Acțiune:** Schimbă starea porții în mod dinamic și inserează logul de audit în tabela `access_events`.

---

### 🖥️ Segmentul Web & Rapoarte Analytics

#### `GET /api/export-csv`

Export complet, dinamic și securizat al jurnalului de accesări.

- Formatează automat timestamp-urile în format ISO standardizat
- Generează fișierul `raport_accesari_parksecured.csv`

---

## 📁 Structura Bazei de Date Sincronizate (Render)

Toate operațiunile se execută live pe instanța hostată, interogând următoarele entități corelate:

| Tabelă | Descriere |
|--------|-----------|
| `accounts` | E-mail, hash parolă (BCrypt), rol și cheie străină `employee_id` → `personal` |
| `employees` | Date de identificare, intervale orare și permisiuni ale personalului autorizat |
| `smartphones` | Amprentă hardware (`device_identifier`), platformă și jetonul curent de sesiune (`access_seed`) |
| `access_events` | Jurnal istoric complet de audit (intrări/ieșiri, status) pentru rapoarte manageriale |