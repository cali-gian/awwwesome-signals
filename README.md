# 🚀 Binance Trading Monitor + Discord Integration

Sistema automatico di monitoraggio trading per Binance con rilevazione segnali basati su indicatori tecnici e **alert Discord in tempo reale** su multipli timeframes.

## 📋 Funzionalità

- **Monitoraggio multi-asset**: Traccia 100+ criptovalute simultaneamente
- **Multi-timeframe**: Supporta 5m, 15m, 30m, 37m, 1h, 2h, 3h, 1d
- **Scheduling intelligente**: Ogni timeframe si aggiorna alla frequenza appropriata
- **Canali Discord dedicati**: Un webhook Discord per ogni timeframe
- **Indicatori tecnici**: EMA4, EMA8, SMA22, RSI14
- **Rilevazione crossover**: Identifica automaticamente SETUP_LONG e SETUP_SHORT
- **Alert Discord formattati**: Messaggi Discord embed belli e leggibili
- **Rate limiting ottimizzato**: ~100 req/min invece di 4,848 req/min!
- **Gestione errori**: Continua a funzionare anche in caso di errori di rete
- **No duplicati**: Sistema intelligente per evitare alert ripetuti per timeframe

### 🚀 Caratteristica Principale: Scheduling Intelligente

**Il problema:** Ogni simbolo su ogni timeframe richiede una chiamata API separata a Binance. Con 100 simboli e 8 timeframes, servirebbero 800 richieste ogni ciclo - **impossibile rispettare i limiti API!**

**La soluzione:** Invece di aggiornare tutti i timeframes contemporaneamente, il sistema aggiorna ogni timeframe solo quando necessario:
- Timeframe 5m → ogni 2 minuti (veloce, reagisce subito)
- Timeframe 1h → ogni 20 minuti (lento, non serve aggiornarlo spesso)
- Timeframe 1d → ogni 2 ore (molto lento)

Questo riduce le richieste API da **~4,848/min a ~100/min** rimanendo entro i limiti Binance! ✅

## 🔧 Installazione

### Prerequisiti

- Node.js >= 18.0.0
- npm o yarn

### Setup

```bash
# 1. Clona o scarica il progetto
cd binance-trading-monitor

# 2. Installa le dipendenze
npm install

# 3. Configura i webhook Discord (vedi sezione Configurazione Discord)

# 4. Avvia il monitor
npm start
```

### Configurazione Discord

#### Crea i Webhook Discord

Per ogni timeframe che vuoi monitorare, devi creare un webhook Discord:

1. Vai sul tuo server Discord
2. Vai su **Impostazioni Server** → **Integrazioni** → **Webhook**
3. Clicca **Nuovo Webhook**
4. Assegna un nome (es. "Signals 5m", "Signals 15m", etc.)
5. Seleziona il canale dove inviare gli alert
6. Copia l'**URL del Webhook**
7. Ripeti per ogni timeframe

#### Esempio URL Webhook

```
https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

## ⚙️ Configurazione

Modifica i parametri all'inizio del file `monitor.js`:

```javascript
// Webhook Discord - UN WEBHOOK PER OGNI TIMEFRAME
const DISCORD_WEBHOOKS = {
  '5m': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_5M/YOUR_WEBHOOK_TOKEN_5M',
  '15m': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_15M/YOUR_WEBHOOK_TOKEN_15M',
  '30m': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_30M/YOUR_WEBHOOK_TOKEN_30M',
  '37m': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_37M/YOUR_WEBHOOK_TOKEN_37M',
  '1h': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_1H/YOUR_WEBHOOK_TOKEN_1H',
  '2h': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_2H/YOUR_WEBHOOK_TOKEN_2H',
  '3h': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_3H/YOUR_WEBHOOK_TOKEN_3H',
  '1d': 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID_1D/YOUR_WEBHOOK_TOKEN_1D'
};

// Intervallo del loop principale (quanto spesso controllare cosa aggiornare)
const LOOP_INTERVAL_MS = 30000; // 30 secondi

// Intervalli di refresh per ogni timeframe
const TIMEFRAME_INTERVALS = {
  '5m': 2 * 60 * 1000,      // 2 minuti
  '15m': 5 * 60 * 1000,     // 5 minuti
  '30m': 10 * 60 * 1000,    // 10 minuti
  '37m': 10 * 60 * 1000,    // 10 minuti
  '1h': 20 * 60 * 1000,     // 20 minuti
  '2h': 30 * 60 * 1000,     // 30 minuti
  '3h': 60 * 60 * 1000,     // 1 ora
  '1d': 2 * 60 * 60 * 1000  // 2 ore
};

// Lista simboli da monitorare
const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', ...
];
```

### Parametri Configurabili

| Parametro | Descrizione | Default | Raccomandato |
|-----------|-------------|---------|--------------|
| `DISCORD_WEBHOOKS` | Webhook Discord per timeframe | N/A | Configura tutti i timeframes |
| `LOOP_INTERVAL_MS` | Frequenza loop principale (ms) | 30000 | 30000 (30 secondi) |
| `TIMEFRAME_INTERVALS` | Refresh rate per ogni timeframe | Vedi sopra | Personalizza in base alle necessità |
| `MAX_REQUESTS_PER_MINUTE` | Limite rate Binance | 1200 | 1200 (max safe) |
| `CANDLES_LIMIT` | Numero candele da scaricare | 50 | 50-100 |
| `SYMBOLS` | Array simboli da tracciare | 101 | Personalizza |

## 📊 Formato Alert Discord

Quando viene rilevato un segnale, il bot invia un **Discord embed** formattato nel canale corrispondente al timeframe:

### Esempio Alert LONG

```
🟢 SETUP LONG
BTCUSDT detected on 5m timeframe

💰 Price: $67,500.32    📊 RSI: 61.23

📈 EMA4: 67,495.21      📉 EMA8: 67,490.44      📊 SMA22: 67,320.87

Binance Trading Monitor • 20:43:00
```

### Esempio Alert SHORT

```
🔴 SETUP SHORT
ETHUSDT detected on 1h timeframe

💰 Price: $3,420.15     📊 RSI: 42.87

📈 EMA4: 3,418.56       📉 EMA8: 3,422.31       📊 SMA22: 3,445.12

Binance Trading Monitor • 20:45:30
```

### Eventi Supportati

- **🟢 SETUP_LONG**: EMA4 incrocia verso l'alto EMA8 (possibile trend rialzista)
- **🔴 SETUP_SHORT**: EMA4 incrocia verso il basso EMA8 (possibile trend ribassista)

## 🎯 Come Funziona

### Sistema di Scheduling Intelligente

Il bot utilizza un **sistema di refresh differenziato**: ogni timeframe viene aggiornato alla frequenza appropriata, evitando richieste inutili e rispettando i limiti API di Binance.

**Perché?** Non ha senso controllare il grafico 1D ogni 30 secondi! Ogni timeframe ha la sua velocità naturale:

- **5m**: Si aggiorna ogni **2 minuti** (timeframe veloce)
- **15m**: Si aggiorna ogni **5 minuti**
- **30m**: Si aggiorna ogni **10 minuti**
- **1h**: Si aggiorna ogni **20 minuti**
- **2h**: Si aggiorna ogni **30 minuti**
- **3h**: Si aggiorna ogni **1 ora**
- **1d**: Si aggiorna ogni **2 ore** (timeframe lento)

### Flow di Esecuzione

```
Loop Principale (ogni 30 secondi):
  │
  ├─ Controlla quali timeframes devono essere aggiornati
  │  (in base al tempo trascorso dall'ultimo update)
  │
  ├─ Esempio Ciclo 1 (t=0):
  │  └─ Aggiorna TUTTI i timeframes (primo run)
  │     └─ 101 simboli × 8 timeframes = 808 richieste
  │
  ├─ Esempio Ciclo 2 (t=30s):
  │  └─ Nessun timeframe da aggiornare (troppo presto)
  │
  ├─ Esempio Ciclo 3 (t=2min):
  │  └─ Aggiorna solo 5m
  │     └─ 101 simboli × 1 timeframe = 101 richieste
  │
  ├─ Esempio Ciclo 4 (t=5min):
  │  └─ Aggiorna 5m + 15m
  │     └─ 101 simboli × 2 timeframes = 202 richieste
  │
  └─ E così via...
```

### Processo per Ogni Combinazione Symbol+Timeframe

1. **Fetch dati**: Scarica le ultime 50 candele da Binance
2. **Calcolo indicatori**: Calcola EMA4, EMA8, SMA22, RSI14
3. **Rilevazione crossover**: Confronta EMA4 ed EMA8 per trovare incroci
4. **Invio alert Discord**: Se trova un nuovo segnale, invia un embed Discord al canale specifico del timeframe
5. **State tracking**: Salva lo stato per evitare duplicati

## 📝 Log Output

Il programma stampa log chiari nella console con il nuovo sistema di scheduling:

```
🚀 Binance Trading Monitor + Discord Integration
────────────────────────────────────────────────────────
📊 Simboli: 101
⏰ Timeframes: 5m, 15m, 30m, 37m, 1h, 2h, 3h, 1d
🔔 Canali Discord configurati: 8
⏱️  Intervallo loop principale: 30s
📈 Indicatori: EMA4, EMA8, SMA22, RSI14
🎯 Segnali: SETUP_LONG (EMA4 > EMA8), SETUP_SHORT (EMA4 < EMA8)

📅 Intervalli di refresh per timeframe:
   5m   → ogni 2 minuti
   15m  → ogni 5 minuti
   30m  → ogni 10 minuti
   37m  → ogni 10 minuti
   1h   → ogni 20 minuti
   2h   → ogni 30 minuti
   3h   → ogni 60 minuti
   1d   → ogni 120 minuti
────────────────────────────────────────────────────────

🔄 Scansione di 101 simboli su 8 timeframes: [5m, 15m, 30m, 37m, 1h, 2h, 3h, 1d]
   (808 combinazioni)
[20:00:15] 🟢 BTCUSDT (5m) → SETUP_LONG @ $67,500.32 (RSI 61.23)
[20:00:18] 🔴 ETHUSDT (1h) → SETUP_SHORT @ $3,420.15 (RSI 42.87)
✅ Scansione completata in 8752ms (0 errori)

📅 Prossimi aggiornamenti:
   5m   → tra 2 minuti
   15m  → tra 5 minuti
   30m  → tra 10 minuti
   37m  → tra 10 minuti
   1h   → tra 20 minuti
   2h   → tra 30 minuti
   3h   → tra 60 minuti
   1d   → tra 120 minuti

⏭️  Nessun timeframe da aggiornare in questo ciclo
⏭️  Nessun timeframe da aggiornare in questo ciclo

🔄 Scansione di 101 simboli su 1 timeframes: [5m]
   (101 combinazioni)
[20:02:15] 🟢 BNBUSDT (5m) → SETUP_LONG @ $412.56 (RSI 58.91)
✅ Scansione completata in 3421ms (0 errori)

📅 Prossimi aggiornamenti:
   5m   → tra 2 minuti
   15m  → tra 3 minuti
   ...
```

## 🛡️ Gestione Errori

Il sistema gestisce automaticamente:

- ❌ Errori di rete (timeout, connessioni fallite)
- ⚠️ Rate limiting (attende automaticamente quando necessario)
- 🔄 Simboli non validi (li salta e continua con gli altri)
- 💾 Crash dell'applicazione (retry automatico)

## 🔒 Limitazioni API Binance

Binance ha limiti di rate:

- **Weight limit**: 1200 richieste/minuto (IP-based)
- **Order limit**: Non applicabile (solo lettura)

Il monitor rispetta automaticamente questi limiti tramite il rate limiter integrato.

## 📦 Dipendenze

- **axios**: HTTP client per chiamate API
- **technicalindicators**: Libreria per calcolo indicatori tecnici

## 🚦 Comandi

```bash
# Avvia il monitor
npm start

# Sviluppo con auto-reload (Node 18+)
npm run dev

# Stop
CTRL+C
```

## ⚡ Performance e Rate Limiting

### ✅ Sistema di Scheduling Intelligente

Con il nuovo sistema, **ogni timeframe viene aggiornato solo quando necessario**, riducendo drasticamente le richieste API:

**Configurazione di default:**
- **101 simboli**
- **8 timeframes** con intervalli diversificati
- **Loop principale**: ogni 30 secondi

### Calcolo Richieste API (Caso Reale)

Invece di 808 richieste ogni ciclo, il sistema distribuisce le richieste nel tempo:

```
PRIMO CICLO (t=0):
- Tutti i timeframes: 101 × 8 = 808 richieste

CICLI SUCCESSIVI (esempio su 1 ora):
- t=2min:  5m                → 101 richieste
- t=4min:  5m                → 101 richieste
- t=5min:  5m, 15m           → 202 richieste
- t=6min:  5m                → 101 richieste
- t=8min:  5m                → 101 richieste
- t=10min: 5m, 15m, 30m, 37m → 404 richieste
- t=12min: 5m                → 101 richieste
- ...e così via

MEDIA RICHIESTE/MINUTO ≈ 250-400 richieste ✅
```

**Molto sotto il limite Binance di 1,200 req/min!**

### Distribuzione Carico nel Tempo

| Timeframe | Intervallo | Richieste/ora | Richieste/min |
|-----------|------------|---------------|---------------|
| 5m | 2 min | 30 × 101 = 3,030 | ~50 |
| 15m | 5 min | 12 × 101 = 1,212 | ~20 |
| 30m | 10 min | 6 × 101 = 606 | ~10 |
| 37m | 10 min | 6 × 101 = 606 | ~10 |
| 1h | 20 min | 3 × 101 = 303 | ~5 |
| 2h | 30 min | 2 × 101 = 202 | ~3 |
| 3h | 60 min | 1 × 101 = 101 | ~2 |
| 1d | 120 min | 0.5 × 101 = ~50 | ~1 |
| **TOTALE** | | **~6,110/ora** | **~100/min** ✅ |

**Risorse Sistema:**
- **Memoria**: ~100-200MB RAM
- **CPU**: Basso-Medio impatto (picchi durante le scansioni)

## 🔧 Troubleshooting

### Il monitor non invia alert Discord

- Verifica che i webhook Discord in `DISCORD_WEBHOOKS` siano corretti
- Controlla i log per errori di rete
- Testa il webhook manualmente:
  ```bash
  curl -X POST "https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"content": "Test message"}'
  ```

### Rate limit errors (429 Too Many Requests)

Con il sistema di scheduling intelligente, **questo problema non dovrebbe verificarsi**. Se accade:

- Verifica di non avere altri script che usano l'API Binance contemporaneamente
- Aumenta gli intervalli in `TIMEFRAME_INTERVALS` (es. raddoppia tutti i valori)
- Riduci il numero di simboli in `SYMBOLS` se necessario
- Controlla i log per vedere quali timeframes causano il problema

### Personalizzare gli intervalli di refresh

Puoi modificare `TIMEFRAME_INTERVALS` in base alle tue esigenze:

```javascript
// Esempio: refresh più frequenti
const TIMEFRAME_INTERVALS = {
  '5m': 1 * 60 * 1000,    // 1 minuto (più frequente)
  '15m': 3 * 60 * 1000,   // 3 minuti
  // ...
};

// Esempio: refresh più lenti (meno richieste API)
const TIMEFRAME_INTERVALS = {
  '5m': 5 * 60 * 1000,    // 5 minuti
  '15m': 10 * 60 * 1000,  // 10 minuti
  // ...
};
```

### Dati mancanti per alcuni simboli

- Alcuni simboli potrebbero non esistere o essere delisted
- Verifica su Binance che il simbolo sia attivo
- Rimuovi simboli problematici dall'array `SYMBOLS`

## 🎓 Indicatori Tecnici Spiegati

### EMA (Exponential Moving Average)
Media mobile esponenziale che dà più peso ai prezzi recenti.

- **EMA4**: Veloce, reagisce rapidamente ai cambiamenti
- **EMA8**: Più lenta, filtra il rumore di mercato

### SMA22 (Simple Moving Average)
Media mobile semplice su 22 periodi, utile per identificare il trend di medio periodo.

### RSI14 (Relative Strength Index)
Oscillatore di momentum che varia da 0 a 100:

- **> 70**: Ipercomprato (possibile inversione ribassista)
- **< 30**: Ipervenduto (possibile inversione rialzista)

### Crossover EMA4/EMA8
Strategia classica di trading:

- **Golden Cross** (EMA4 > EMA8): Segnale rialzista
- **Death Cross** (EMA4 < EMA8): Segnale ribassista

## 📄 Licenza

MIT

## ⚠️ Disclaimer

Questo software è fornito a scopo educativo. Il trading di criptovalute comporta rischi significativi. Non utilizzare questo sistema senza una adeguata comprensione dei mercati finanziari. L'autore non è responsabile per eventuali perdite finanziarie.
