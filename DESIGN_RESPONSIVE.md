# 📱 Design Responsive - Guida Completa

Questa documentazione descrive il sistema responsive implementato per il progetto Viaggio Soul Dance.

## 🎯 Breakpoints Utilizzati

### Smartphone Piccolo
- **Max-width: 320px**
- Ottimizzazioni per dispositivi molto piccoli
- Font ridotti, padding minimizzati

### Smartphone
- **Max-width: 480px**
- Layout a colonna singola
- Header compatti
- Modals full-screen

### Tablet Piccolo
- **481px - 767px**
- Transizione tra mobile e tablet
- Grid a colonna singola per le card

### Tablet
- **768px - 1024px**
- Layout ibrido
- Grid responsive con 2 colonne
- Header ridotto ma navigabile

### Laptop
- **1024px - 1440px**
- Layout ottimizzato per schermi medi
- Grid a 3 colonne per le destinazioni
- Spaziatura confortevole

### Desktop
- **1440px+**
- Layout completo
- Grid a 4 colonne
- Massimo utilizzo dello spazio

## 🎨 Componenti Responsive

### Header
- **Desktop**: Header completo con tutti i link
- **Tablet**: Header ridotto, link nascosti
- **Mobile**: Header compatto, solo elementi essenziali
- Fixed header si nasconde durante lo scroll su mobile

### Hero Section
- **Desktop**: Layout orizzontale con elementi fluttuanti grandi
- **Tablet**: Layout verticale, elementi ridotti
- **Mobile**: Layout verticale compatto, animazioni semplificate

### Destinations Grid
- **Desktop**: 4 colonne (auto-fit, minmax 350px)
- **Laptop**: 3 colonne (minmax 300px)
- **Tablet**: 2 colonne o singola colonna
- **Mobile**: 1 colonna full-width

### Login Screen
- **Desktop**: Box centrato 450px
- **Tablet**: Box 90% width
- **Mobile**: Box 95% width, padding ridotto
- Input font-size 16px per prevenire zoom su iOS

### Modals
- **Desktop**: Max-width 800px, centrato
- **Tablet**: 95% width
- **Mobile**: 98% width, max-height 98vh
- Scroll ottimizzato per touch

### Admin Dashboard
- **Desktop**: Layout a griglia completo
- **Tablet**: Colonne ridotte, bottoni stack verticale
- **Mobile**: Layout verticale, tabella scrollabile orizzontale

## 📐 Dimensioni Font Responsive

### Hero Title
- Desktop: 3.5rem
- Tablet: 2.5rem
- Mobile: 2rem
- Mobile piccolo: 1.7rem

### Section Titles
- Desktop: 2.5rem
- Tablet: 2rem
- Mobile: 1.8rem

### Body Text
- Desktop: 1rem (default)
- Mobile: clamp(0.875rem, 2.5vw, 1rem) per leggibilità

## 🎯 Touch Optimizations

### Touch Targets
- Tutti i bottoni: minimo 44px x 44px (Apple HIG)
- Padding aumentato su mobile
- Spaziatura tra elementi cliccabili

### Gestures
- Smooth scrolling abilitato
- -webkit-overflow-scrolling: touch per scroll fluido
- Tap highlight color personalizzato

### Performance
- Animazioni pesanti disabilitate su mobile piccolo
- will-change ottimizzato
- Transform hardware-accelerated

## 🔧 Ottimizzazioni Specifiche

### iOS Safari
- Font-size 16px per input (previene zoom)
- -webkit-fill-available per viewport corretto
- Smooth scrolling ottimizzato

### Android Chrome
- Tap highlight personalizzato
- Scroll behavior smooth
- Font rendering ottimizzato

### Landscape Mode
- Hero height ridotto
- Login box ottimizzato
- Modals max-height ridotto

## 📊 Tabelle Responsive

Le tabelle nelle modals admin hanno:
- Scroll orizzontale su mobile
- Min-width per leggibilità
- Font-size ridotto proporzionalmente
- Touch scrolling ottimizzato

## 🎨 Breakpoint Strategy

Il sistema usa **Mobile-First** con media queries `max-width`:

1. Stili base per mobile
2. Progressive enhancement per schermi più grandi
3. Ottimizzazioni specifiche per ogni breakpoint

## ✅ Checklist Responsive

- [x] Header responsive su tutti i dispositivi
- [x] Hero section adattiva
- [x] Grid destinazioni responsive
- [x] Login screen ottimizzato
- [x] Modals full-screen su mobile
- [x] Admin dashboard responsive
- [x] Touch targets ottimizzati
- [x] Font sizing responsive
- [x] Spacing adattivo
- [x] Performance ottimizzate
- [x] iOS Safari fixes
- [x] Landscape orientation support
- [x] Table scroll ottimizzato

## 🚀 Testing

Per testare il responsive design:

1. **Chrome DevTools**:
   - F12 → Toggle device toolbar
   - Testa i breakpoint principali

2. **Dispositivi Reali**:
   - iPhone (320px, 375px, 414px)
   - iPad (768px, 1024px)
   - Android vari (360px - 480px)
   - Laptop (1366px, 1440px)

3. **Orientamenti**:
   - Portrait e Landscape
   - Rotazione dispositivo

## 📝 Note Importanti

- Il design è **touch-first** per mobile
- Le animazioni hover sono disabilitate su touch devices
- Tutti i testi sono leggibili senza zoom
- I form sono ottimizzati per keyboard mobile
- Le immagini sono responsive con object-fit

