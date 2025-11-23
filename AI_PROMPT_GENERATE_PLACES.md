# Prompt per Generazione Piano di Viaggio con AI

## Scopo
Generare un piano di viaggio completo organizzato per giorni, con luoghi e attività da visitare per una destinazione, distribuiti sulle date dell'avventura.

## Input Richiesti

### Parametri Obbligatori:
1. **destination** (string): Nome della destinazione (es: "Parigi", "Tokyo", "Roma")
2. **departure_date** (string, formato ISO: YYYY-MM-DD): Data di partenza da casa/inizio viaggio
3. **return_date** (string, formato ISO: YYYY-MM-DD): Data di ritorno a casa/fine viaggio

### Esempio Input:
```json
{
  "destination": "Parigi",
  "departure_date": "2024-12-06",
  "return_date": "2024-12-08"
}
```

## Output Atteso

### Formato JSON:
```json
{
  "data": {
    "places": [
      {
        "name": "Titolo del Giorno",
        "visit_date": "2024-12-06",
        "steps": [
          "Tappa 1 descrizione",
          "Tappa 2 descrizione",
          "Tappa 3 descrizione"
        ]
      },
      {
        "name": "Altro Luogo",
        "visit_date": "2024-12-07",
        "steps": [
          "Tappa 1 descrizione",
          "Tappa 2 descrizione"
        ]
      }
    ]
  }
}
```

## Istruzioni per l'AI

### 1. Analisi delle Date
- Calcola il numero di giorni tra `departure_date` e `return_date` (inclusi)
- Distribuisci i luoghi in modo equilibrato tra i giorni disponibili
- Ogni giorno dovrebbe avere almeno 1-2 luoghi principali
- Considera che il primo giorno (departure_date) è il giorno di partenza e l'ultimo giorno (return_date) è il giorno di ritorno

### 2. Generazione Piano di Viaggio
Per ogni giorno dell'avventura, genera:

**Titolo del Giorno:**
- Crea un titolo descrittivo per ogni giorno (es: "Giorno 1: Esplorazione del centro", "Giorno 2: Arte e cultura", "Giorno 3: Quartieri storici")
- Il titolo deve essere informativo e dare un'idea del tema della giornata

**Luoghi e Attività:**
- Per ogni giorno, scegli 1-3 luoghi iconici/famosi della destinazione
- Nomi specifici e riconoscibili (es: "Torre Eiffel", "Museo del Louvre", "Notre-Dame")
- Evita nomi generici (es: "Museo", "Piazza")

**Tappe per ogni Luogo:**
- Genera 2-5 tappe dettagliate per ogni luogo
- Ogni tappa deve essere un'attività specifica o un punto di interesse
- Le tappe devono essere in ordine logico (es: entrata, visita, punti salienti, uscita)
- Usa descrizioni concise ma informative (max 100 caratteri per tappa)

### 3. Distribuzione Temporale
- **Giorno 1 (arrivo)**: Luoghi più leggeri, adatti al jet lag
- **Giorni centrali**: Luoghi principali e più impegnativi
- **Ultimo giorno**: Luoghi più leggeri, adatti alla partenza

### 4. Qualità e Rilevanza
- I luoghi devono essere realmente esistenti e visitabili
- Considera la logistica: luoghi vicini nello stesso giorno
- Bilanciare cultura, storia, relax, gastronomia
- Evita luoghi chiusi o non accessibili

### 5. Formato Output
- **name**: Titolo descrittivo del giorno (es: "Giorno 1: Esplorazione del centro storico") (string)
- **visit_date**: Data in formato ISO YYYY-MM-DD (string)
- **steps**: Array di stringhe, ognuna descrive una tappa/attività/luogo da visitare durante quel giorno

## Esempio Completo

### Input:
```json
{
  "destination": "Parigi",
  "departure_date": "2024-12-06",
  "return_date": "2024-12-08"
}
```

### Output Atteso:
```json
{
  "data": {
    "places": [
      {
        "name": "Torre Eiffel",
        "visit_date": "2024-12-06",
        "steps": [
          "Arrivo alla Torre Eiffel e acquisto biglietti",
          "Salita al primo livello per ammirare la vista",
          "Visita al secondo livello (opzionale)",
          "Fotografie dalla base della torre",
          "Passeggiata nei giardini del Champ de Mars"
        ]
      },
      {
        "name": "Museo del Louvre",
        "visit_date": "2024-12-07",
        "steps": [
          "Ingresso dal Pyramid principale",
          "Visita alla Gioconda (Sala 711)",
          "Esplorazione delle antichità egizie",
          "Passeggiata nella Galleria Apollo",
          "Visita alle sculture greche e romane"
        ]
      },
      {
        "name": "Notre-Dame e Île de la Cité",
        "visit_date": "2024-12-07",
        "steps": [
          "Visita esterna alla Cattedrale Notre-Dame",
          "Passeggiata intorno all'Île de la Cité",
          "Visita alla Sainte-Chapelle",
          "Passeggiata lungo la Senna"
        ]
      },
      {
        "name": "Montmartre e Sacré-Cœur",
        "visit_date": "2024-12-08",
        "steps": [
          "Salita a Montmartre (o funicolare)",
          "Visita alla Basilica del Sacré-Cœur",
          "Passeggiata in Place du Tertre",
          "Visita agli artisti di strada",
          "Panorama di Parigi dalla terrazza"
        ]
      }
    ]
  }
}
```

## Note Importanti

1. **Lingua**: Tutti i testi devono essere in **italiano**
2. **Realismo**: I luoghi devono essere realmente visitabili nella destinazione
3. **Varietà**: Bilanciare musei, monumenti, quartieri, esperienze
4. **Pragmatismo**: Considerare tempi di visita realistici
5. **Flessibilità**: Se le date non sono specificate, distribuire su 3 giorni di default

## Gestione Errori

Se l'input non è valido o mancante:
- Restituisci un array vuoto `[]` per `places`
- Includi un campo `error` con la descrizione del problema

## Validazione Output

Ogni luogo deve avere:
- ✅ `name`: stringa non vuota
- ✅ `visit_date`: formato ISO valido (YYYY-MM-DD)
- ✅ `steps`: array con almeno 2 elementi, ogni elemento stringa non vuota

