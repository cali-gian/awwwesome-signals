# 🚀 Binance Trading Monitor

Sistema automatico di monitoraggio trading per Binance con rilevazione segnali basati su indicatori tecnici e alert in tempo reale.

## 📋 Funzionalità

- **Monitoraggio multi-asset**: Traccia 100+ criptovalute simultaneamente
- **Indicatori tecnici**: EMA4, EMA8, SMA22, RSI14
- **Rilevazione crossover**: Identifica automaticamente SETUP_LONG e SETUP_SHORT
- **Alert webhook**: Invia notifiche JSON a n8n o altri sistemi
- **Rate limiting**: Rispetta i limiti API di Binance (1200 req/min)
- **Gestione errori**: Continua a funzionare anche in caso di errori di rete
- **No duplicati**: Sistema intelligente per evitare alert ripetuti

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

# 3. Configura il webhook (vedi sezione Configurazione)

# 4. Avvia il monitor
npm start
```

## ⚙️ Configurazione

Modifica i parametri all'inizio del file `monitor.js`:

```javascript
// URL del tuo webhook n8n o altro endpoint
const WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/trading-signals';

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
| `WEBHOOK_URL` | Endpoint per ricevere alert | N/A | Il tuo webhook n8n |
| `REFRESH_INTERVAL_MS` | Frequenza scansione (ms) | 10000 | 10000-30000 |
| `MAX_REQUESTS_PER_MINUTE` | Limite rate Binance | 1200 | 1200 (max safe) |
| `CANDLES_LIMIT` | Numero candele da scaricare | 50 | 50-100 |
| `SYMBOLS` | Array simboli da tracciare | 100+ | Personalizza |

## 📊 Formato Alert

Quando viene rilevato un segnale, il webhook riceve un JSON nel seguente formato:

```json
{
  "symbol": "BTCUSDT",
  "interval": "1m",
  "event": "SETUP_LONG",
  "price": 67500.32,
  "ema4": 67495.21,
  "ema8": 67490.44,
  "sma22": 67320.87,
  "rsi14": 61.23,
  "time": "2025-10-21T20:43:00Z"
}
```

### Eventi Supportati

- **SETUP_LONG**: EMA4 incrocia verso l'alto EMA8 (possibile trend rialzista)
- **SETUP_SHORT**: EMA4 incrocia verso il basso EMA8 (possibile trend ribassista)

## 🎯 Come Funziona

1. **Fetch dati**: Scarica le ultime 50 candele da Binance per ogni simbolo
2. **Calcolo indicatori**: Calcola EMA4, EMA8, SMA22, RSI14 su ogni asset
3. **Rilevazione crossover**: Confronta EMA4 ed EMA8 per trovare incroci
4. **Invio alert**: Quando trova un nuovo segnale, invia POST al webhook
5. **Loop**: Ripete il processo ogni `REFRESH_INTERVAL_MS`

## 📝 Log Output

Il programma stampa log chiari nella console:

```
🚀 Binance Trading Monitor avviato!
📊 Monitoraggio di 101 simboli
⏱️  Intervallo di aggiornamento: 10s
🌐 Webhook: https://your-webhook.com
📈 Indicatori: EMA4, EMA8, SMA22, RSI14
────────────────────────────────────────────────────────

🔄 Scansione di 101 simboli...
[20:43:00] 🔔 BTCUSDT → SETUP_LONG @ 67500.32 (RSI 61.23)
[20:43:02] 🔔 ETHUSDT → SETUP_SHORT @ 3420.15 (RSI 42.87)
✅ Scansione completata in 3421ms (0 errori)
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

- **100 simboli** monitorati
- **Intervallo 10s** → 6 scansioni/minuto
- **~600 richieste/minuto** (entro i limiti Binance)
- **Memoria**: ~50-100MB RAM
- **CPU**: Minimo impatto

## 🔧 Troubleshooting

### Il monitor non invia alert

- Verifica che `WEBHOOK_URL` sia corretto
- Controlla i log per errori di rete
- Testa il webhook manualmente con curl

### Rate limit errors

- Riduci il numero di simboli in `SYMBOLS`
- Aumenta `REFRESH_INTERVAL_MS` (es. 15000 o 20000)
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
