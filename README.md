# ParkSecured Web & Backend unificat

Modulul central de backend (Node.js + Express) și interfața web destinate administrării, monitorizării și controlului fluxului de acces în parcare. Sistemul folosește o arhitectură modernă de securitate bazată pe **Sesiuni Hardware Criptografice Rotative**, eliminând complet utilizarea token-urilor statice vulnerabile.

---

## 🛠️ Configurare și Rulare Backend Local

### 1. Navigare și Dependințe
Asigură-te că te afli în folderul corect și instalează modulele necesare (inclusiv pachetele de securitate pentru baze de date și criptare):
```bash
cd backend
npm install
```

### 2. Pornire Server
Pornește instanța de backend sincronizată cu baza de date din cloud:
```
node index.js

```

Serverul va rula local pe portul 5001 și va asculta conexiunile venite de la aplicația Mobile sau Embedded.

### 🔐 Logica Unificată de Autentificare și Sesiune (Mobile & Web)
    Sistemul utilizează o singură Cloud Render (PostgreSQL). Parolele utilizatorilor sunt stocate securizat sub formă de hash-uri BCrypt.
Fluxul Securizat de Acces:
1. Identificare: Angajatul introduce credențialele pe dispozitivul mobil (accounts).
2. Validare Criptografică: Backend-ul verifică hash-ul parolei folosind bcrypt.compare.
3. Garanția Unicității: La fiecare logare reușită, sistemul șterge forțat orice sesiune anterioară (DELETE FROM smartphones) asociată angajatului sau amprentei hardware respective, asigurând regula: 1 Angajat = 1 Sesiune Activă.
4. Emitere accessSeed: Generarea criptografică a unui cod opac aleatoriu de 64 de caractere, salvat în tabela smartphones și transmis local pe telefon pentru deblocarea barierei.

### 🌐 Endpoint-uri Active și Rutare REST API
Sistemul expune următoarele rute esențiale care consumă direct datele din tabela refactorizată accounts:

🔹 Segmentul Mobile Securitizat
POST /api/mobile/login-secure
    Rol: Autentificare inițială prin BCrypt și înregistrare unică a amprentei hardware.
    Payload: { email, password, platform, deviceIdentifier }
    Răspuns: Returnează codul secret de sesiune accessSeed.
POST /api/validate-access
    Rol: Validarea instantanee a seed-ului pentru deschiderea fizică a barierei.
    Payload: { accessSeed }
    Acțiune: Schimbă starea porții în mod dinamic și inserează logul de audit în tabela access_events.

🔹 Segmentul Web & Rapoarte Analytics
GET /api/export-csv
    Rol: Exportul complet, dinamic și securizat al jurnalului de accesări.
    Comportament: Formatează automat timestamp-urile în format ISO standardizat și generează fișierul raport_accesari_parksecured.csv.
    
### 📁 Structura Bazei de Date Sincronizate (Render)
Toate operațiunile se execută live pe instanța hostată, interogând următoarele entități corelate:
🗂️ accounts - Stochează e-mailul, hash-ul parolei (BCrypt), rolul și legătura directă 1:1 prin cheie străină (employee_id) către personal.
👥 employees - Datele de identificare, intervalele orare și permisiunile de bază ale personalului autorizat.
📱 smartphones - Găzduiește amprenta unică a terminalului (device_identifier), platforma și jetonul curent de sesiune rotativă (access_seed).
📊 access_events - Jurnalul istoric complet de audit (intrări/ieșiri, status de acces) utilizat la generarea rapoartelor manageriale.
"""