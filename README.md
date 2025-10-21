# 🚀 Binance Trading Monitor + Discord Integration

Sistema automatico di monitoraggio trading per Binance con rilevazione segnali basati su indicatori tecnici e **alert Discord in tempo reale** su multipli timeframes.

## 📋 Funzionalità

- **Monitoraggio multi-asset**: Traccia 100+ criptovalute simultaneamente
- **Multi-timeframe**: Supporta 5m, 15m, 30m, 37m, 1h, 2h, 3h, 1d
- **Canali Discord dedicati**: Un webhook Discord per ogni timeframe
- **Indicatori tecnici**: EMA4, EMA8, SMA22, RSI14
- **Rilevazione crossover**: Identifica automaticamente SETUP_LONG e SETUP_SHORT
- **Alert Discord formattati**: Messaggi Discord embed belli e leggibili
- **Rate limiting**: Rispetta i limiti API di Binance (1200 req/min)
- **Gestione errori**: Continua a funzionare anche in caso di errori di rete
- **No duplicati**: Sistema intelligente per evitare alert ripetuti per timeframe

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

// Intervallo di aggiornamento (millisecondi)
const REFRESH_INTERVAL_MS = 10000; // 10 secondi

// Limite rate richieste API
const MAX_REQUESTS_PER_MINUTE = 1200;

// Lista simboli da monitorare
const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', ...
];
```

### Parametri Configurabili

| Parametro | Descrizione | Default | Raccomandato |
|-----------|-------------|---------|--------------|
| `DISCORD_WEBHOOKS` | Webhook Discord per timeframe | N/A | Configura tutti i timeframes |
| `REFRESH_INTERVAL_MS` | Frequenza scansione (ms) | 10000 | 10000-30000 |
| `MAX_REQUESTS_PER_MINUTE` | Limite rate Binance | 1200 | 1200 (max safe) |
| `CANDLES_LIMIT` | Numero candele da scaricare | 50 | 50-100 |
| `SYMBOLS` | Array simboli da tracciare | 100+ | Personalizza |

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

1. **Fetch dati**: Scarica le ultime 50 candele da Binance per ogni simbolo su ogni timeframe
2. **Calcolo indicatori**: Calcola EMA4, EMA8, SMA22, RSI14 su ogni asset per ogni timeframe
3. **Rilevazione crossover**: Confronta EMA4 ed EMA8 per trovare incroci
4. **Invio alert Discord**: Quando trova un nuovo segnale, invia un embed Discord al canale specifico del timeframe
5. **Loop**: Ripete il processo ogni `REFRESH_INTERVAL_MS`

### Esempio Flow

```
Simbolo: BTCUSDT
  ├─ 5m  → Scarica candele → Calcola indicatori → Rileva crossover → Alert Discord #signals-5m
  ├─ 15m → Scarica candele → Calcola indicatori → Rileva crossover → Alert Discord #signals-15m
  ├─ 30m → Scarica candele → Calcola indicatori → (nessun segnale)
  ├─ 37m → Scarica candele → Calcola indicatori → (nessun segnale)
  ├─ 1h  → Scarica candele → Calcola indicatori → Rileva crossover → Alert Discord #signals-1h
  ├─ 2h  → Scarica candele → Calcola indicatori → (nessun segnale)
  ├─ 3h  → Scarica candele → Calcola indicatori → (nessun segnale)
  └─ 1d  → Scarica candele → Calcola indicatori → (nessun segnale)

Ripeti per ETHUSDT, BNBUSDT, ... (101 simboli)
```

## 📝 Log Output

Il programma stampa log chiari nella console:

```
🚀 Binance Trading Monitor + Discord Integration
────────────────────────────────────────────────────────
📊 Simboli: 101
⏰ Timeframes: 5m, 15m, 30m, 37m, 1h, 2h, 3h, 1d
🔔 Canali Discord configurati: 8
⏱️  Intervallo di aggiornamento: 10s
📈 Indicatori: EMA4, EMA8, SMA22, RSI14
🎯 Segnali: SETUP_LONG (EMA4 > EMA8), SETUP_SHORT (EMA4 < EMA8)
────────────────────────────────────────────────────────

🔄 Scansione di 101 simboli su 8 timeframes (808 combinazioni)...
[20:43:00] 🟢 BTCUSDT (5m) → SETUP_LONG @ $67,500.32 (RSI 61.23)
[20:43:02] 🔴 ETHUSDT (1h) → SETUP_SHORT @ $3,420.15 (RSI 42.87)
[20:43:05] 🟢 BNBUSDT (15m) → SETUP_LONG @ $412.56 (RSI 58.91)
✅ Scansione completata in 8752ms (0 errori)
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

## ⚡ Performance

Con le impostazioni di default:

- **101 simboli** × **8 timeframes** = **808 combinazioni**
- **Intervallo 10s** → 6 scansioni/minuto
- **~4,848 richieste API/minuto** (potrebbe superare i limiti!)
- **Memoria**: ~100-200MB RAM
- **CPU**: Medio impatto

### ⚠️ IMPORTANTE: Rate Limiting

Con 808 combinazioni ogni 10s, potresti superare il limite Binance. Considera:

1. **Aumentare REFRESH_INTERVAL_MS**: es. 30000 (30s) → ~1,600 req/min ✅
2. **Ridurre simboli**: Monitora solo i più importanti (es. 30 simboli)
3. **Ridurre timeframes**: Rimuovi alcuni timeframes meno importanti
4. **Usare Binance weight-based caching**: Implementa cache locale

### Calcolo Richieste

```
Richieste/minuto = (Simboli × Timeframes × 60) / REFRESH_INTERVAL_MS * 1000

Esempio con 101 simboli, 8 timeframes, 30s interval:
= (101 × 8 × 60) / 30000 × 1000
= 1,616 req/min ✅ (sotto limite 1200 con margine)
```

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

- **CRITICO**: Aumenta `REFRESH_INTERVAL_MS` a 30000 o 60000
- Riduci il numero di simboli in `SYMBOLS` (es. 30-50)
- Rimuovi alcuni timeframes da `DISCORD_WEBHOOKS`
- Verifica di non avere altri script che usano l'API Binance

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
