# Viaggio Soul Dance - React + Vite + TypeScript

Una moderna applicazione web per promuovere viaggi europei del weekend 6-8 dicembre 2024, costruita con React, Vite, TypeScript e Node.js.

## 🎯 Caratteristiche

- **4 Destinazioni Europee**: Londra, Birmingham, Ginevra e Siviglia
- **Prezzi Voli Reali**: Collegamenti diretti a Skyscanner
- **Itinerari Dettagliati**: Programmi di 3 giorni per ogni destinazione
- **Sistema di Votazione**: Gli utenti possono votare e commentare le destinazioni
- **Dashboard Admin**: Visualizzazione delle votazioni e statistiche
- **Design Responsive**: Ottimizzato per desktop, tablet e mobile
- **TypeScript**: Tipizzazione completa per maggiore sicurezza del codice
- **SCSS**: Stili organizzati e modulari

## 🚀 Stack Tecnologico

### Frontend
- **React 18** con TypeScript
- **Vite** come build tool
- **SCSS** per gli stili
- **React Context** per la gestione dello stato

### Backend
- **Node.js** con Express
- **TypeScript** per il server
- **Nodemon** per il live-reload

### Database
- **Supabase** per il backend as a service

## 📦 Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Avvia il server di sviluppo (frontend + backend):
```bash
npm run dev:all
```

Oppure avvia separatamente:
```bash
# Frontend (porta 5173)
npm run dev

# Backend (porta 3000)
npm run server
```

## 🛠️ Script Disponibili

- `npm run dev` - Avvia il frontend in modalità sviluppo
- `npm run server` - Avvia il server Node con live-reload
- `npm run dev:all` - Avvia sia frontend che backend contemporaneamente
- `npm run build` - Build di produzione
- `npm run preview` - Preview della build di produzione

## 📁 Struttura del Progetto

```
viaggio-soul-dance/
├── src/
│   ├── components/       # Componenti React
│   ├── context/          # Context API (Auth)
│   ├── hooks/           # Custom hooks
│   ├── styles/          # File SCSS organizzati
│   ├── config/          # Configurazioni (Supabase, Auth)
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Componente principale
│   └── main.tsx         # Entry point
├── server/              # Server Node.js
│   └── index.ts         # Server Express
├── public/              # File statici
├── index.html           # HTML principale
├── vite.config.ts      # Configurazione Vite
├── tsconfig.json       # Configurazione TypeScript
└── package.json        # Dipendenze e script
```

## 🔐 Autenticazione

Il sistema di autenticazione è gestito tramite:
- **AuthContext**: Context React per lo stato di autenticazione
- **auth.config.ts**: Configurazione utenti e password
- **SessionStorage**: Persistenza della sessione nel browser

## 🎨 Stili

Gli stili sono organizzati in SCSS modulare:
- `_variables.scss`: Variabili globali
- `_base.scss`: Reset e stili base
- `components/*.scss`: Stili per ogni componente
- `_responsive.scss`: Media queries responsive

## ✈️ Destinazioni

### Londra, Regno Unito
- **Prezzo volo**: €89-120
- **Durata**: 6-8 Dicembre 2024
- **Highlights**: Big Ben, British Museum, Tower of London

### Birmingham, Regno Unito
- **Prezzo volo**: €95-130
- **Durata**: 6-8 Dicembre 2024
- **Highlights**: Musei industriali, canali, Cadbury World

### Ginevra, Svizzera
- **Prezzo volo**: €110-150
- **Durata**: 6-8 Dicembre 2024
- **Highlights**: Lago di Ginevra, montagne, lusso

### Siviglia, Spagna
- **Prezzo volo**: €75-100
- **Durata**: 6-8 Dicembre 2024
- **Highlights**: Flamenco, architettura moresca, clima mite

## 🌐 Configurazione

### Supabase
Configura le credenziali in `src/config/supabase.config.ts`

### Autenticazione
Configura utenti e password in `src/config/auth.config.ts`

## 📱 Responsive Design

L'applicazione è completamente responsive e ottimizzata per:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🔧 Live Reload

Il progetto utilizza:
- **Vite HMR** per il frontend (hot module replacement)
- **Nodemon** per il backend (restart automatico su cambiamenti)

## 📞 Contatti

Per informazioni sui viaggi:
- Email: info@viaggiosouldance.com
- Telefono: +39 123 456 7890

---

© 2024 Viaggio Soul Dance. Tutti i diritti riservati.
