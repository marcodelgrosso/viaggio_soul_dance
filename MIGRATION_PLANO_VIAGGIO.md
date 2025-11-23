# Piano di Migrazione: Da "Luoghi da Visitare" a "Piano di Viaggio"

## Analisi Impatto

### 1. Database
**Tabella**: `adventure_destination_places`
- ✅ **Nessuna modifica necessaria** - La struttura attuale supporta già il concetto di "giorni":
  - `name`: può essere il titolo del giorno (es: "Giorno 1", "Primo giorno a Parigi")
  - `visit_date`: data del giorno (già presente, opzionale)
  - `description`: tappe del giorno (separate da newline)
  - `order_index`: ordine dei giorni

**Conclusione**: Nessuna migrazione database necessaria.

### 2. Struttura Dati TypeScript
**File**: `src/types/adventures.ts`
- `AdventureDestinationPlace` - può rimanere uguale
- `AdventureDestinationWithPlaces` - può rimanere uguale
- Internamente possiamo usare alias o wrapper per chiarezza

**Conclusione**: Nessuna modifica necessaria, solo chiarezza semantica.

### 3. Componenti da Modificare

#### A. EditDestinationPage.tsx
- ✅ Cambiare label "Luoghi da Visitare" → "Piano di Viaggio"
- ✅ Cambiare "Luogo X" → "Giorno X"
- ✅ Variabile `places` → `days` o `travelPlanDays` (opzionale, per chiarezza)
- ✅ Messaggi e placeholder
- ✅ Logica di salvataggio rimane uguale

#### B. DestinationDetailPage.tsx
- ✅ Cambiare "Luoghi da Visitare" → "Piano di Viaggio"
- ✅ Cambiare visualizzazione per enfatizzare i giorni
- ✅ Messaggi vuoti

#### C. EditDestinationModal.tsx
- ✅ Cambiare label e messaggi

#### D. AdventureDetail.tsx
- ✅ Cambiare label se presente

#### E. EditAdventurePage.tsx
- ✅ Statistiche: "totalPlaces" → "totalDays" o "totalPlanDays"

### 4. Stili CSS/SCSS
**File**: `src/styles/components/EditAdventureSection.scss`
- ✅ `.places-list` → può rimanere o diventare `.travel-plan-days`
- ✅ `.place-item` → può rimanere o diventare `.day-item`
- ✅ Classi CSS possono rimanere per retrocompatibilità

### 5. API e Servizi
**File**: `src/services/MeggieEngineAPI.ts`
- ✅ `generatePlaces()` → può rimanere o diventare `generateTravelPlan()`
- ✅ La risposta API può continuare a usare `places` internamente

**File**: `AI_PROMPT_GENERATE_PLACES.md`
- ✅ Aggiornare il prompt per enfatizzare "giorni" invece di "luoghi"
- ✅ La struttura JSON può rimanere la stessa

### 6. Altri File
- ✅ `CreateAdventureModal.tsx` - se usa places
- ✅ Qualsiasi altro componente che visualizza places

## Piano di Implementazione

### Fase 1: Cambio Label e Testi (Basso Rischio)
1. Cambiare tutte le label "Luoghi da Visitare" → "Piano di Viaggio"
2. Cambiare "Luogo X" → "Giorno X"
3. Aggiornare placeholder e messaggi
4. Aggiornare tooltip e title

### Fase 2: Miglioramento Visualizzazione (Medio Rischio)
1. Enfatizzare la data del giorno nella visualizzazione
2. Raggruppare visivamente per giorno se necessario
3. Migliorare la UI per mostrare meglio la struttura "giorno per giorno"

### Fase 3: Refactoring Variabili (Opzionale, Alto Rischio)
1. Rinominare `places` → `days` o `travelPlanDays` (se si vuole maggiore chiarezza)
2. Richiede modifiche in molti file
3. **Raccomandazione**: Mantenere `places` internamente per retrocompatibilità, ma usare "giorni" nell'UI

## Raccomandazione Finale

**Approccio Conservativo** (Raccomandato):
- ✅ Cambiare solo label e testi nell'UI
- ✅ Mantenere struttura dati e variabili esistenti
- ✅ Enfatizzare "giorni" nella visualizzazione
- ✅ Nessuna modifica al database
- ✅ Retrocompatibilità garantita

**Vantaggi**:
- Basso rischio di bug
- Implementazione rapida
- Nessuna migrazione dati
- Facile rollback

