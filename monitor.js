/**
 * 🚀 Binance Trading Monitor con Indicatori Tecnici + Discord Integration
 *
 * COME ESEGUIRE:
 * 1. npm install
 * 2. Configura i webhook Discord (vedi DISCORD_WEBHOOKS)
 * 3. node monitor.js
 *
 * PARAMETRI CONFIGURABILI:
 * - DISCORD_WEBHOOKS: webhook Discord per ogni timeframe (riga 21)
 * - SYMBOLS: array di simboli da monitorare (riga 34)
 * - REFRESH_INTERVAL_MS: frequenza di aggiornamento in millisecondi (riga 31)
 * - MAX_REQUESTS_PER_MINUTE: limite rate per API Binance (riga 32)
 */

import axios from 'axios';
import { EMA, SMA, RSI } from 'technicalindicators';

// ==================== CONFIGURAZIONE ====================

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

const BINANCE_API = 'https://api.binance.com/api/v3/klines';
const REFRESH_INTERVAL_MS = 10000; // 10 secondi
const MAX_REQUESTS_PER_MINUTE = 1200;
const CANDLES_LIMIT = 50;
const TIMEFRAMES = Object.keys(DISCORD_WEBHOOKS);

// Lista di 100+ simboli popolari su Binance
const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT',
  'XRPUSDT', 'DOTUSDT', 'UNIUSDT', 'LINKUSDT', 'LTCUSDT',
  'SOLUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'XLMUSDT',
  'VETUSDT', 'ICPUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT',
  'THETAUSDT', 'ALGOUSDT', 'FTMUSDT', 'AXSUSDT', 'MANAUSDT',
  'SANDUSDT', 'EGLDUSDT', 'AAVEUSDT', 'EOSUSDT', 'XTZUSDT',
  'NEOUSDT', 'MKRUSDT', 'CAKEUSDT', 'KSMUSDT', 'COMPUSDT',
  'SNXUSDT', 'RUNEUSDT', 'DASHUSDT', 'ZECUSDT', 'WAVESUSDT',
  'YFIUSDT', 'BATUSDT', 'ENJUSDT', 'CHZUSDT', 'ZENUSDT',
  'SUSHIUSDT', 'CRVUSDT', 'BALUSDT', 'HBARUSDT', 'ZILUSDT',
  'CELRUSDT', 'ONEUSDT', 'RENUSDT', 'ZRXUSDT', 'OMGUSDT',
  'LRCUSDT', 'SKLUSDT', 'QNTUSDT', 'ANKRUSDT', 'OCEANUSDT',
  'IOTAUSDT', 'KAVAUSDT', 'RSRUSDT', 'BANDUSDT', 'STORJUSDT',
  'SRMUSDT', 'REEFUSDT', 'BELUSDT', 'KLAYUSDT', 'ARPAUSDT',
  'CTSIUSDT', 'LPTUSDT', 'ENSUSDT', 'NEARUSDT', 'PEOPLEUSDT',
  'ROSEUSDT', 'DENTUSDT', 'IDEXUSDT', 'LQTYUSDT', 'HIGHUSDT',
  'IMXUSDT', 'BLURUSDT', 'HOOKUSDT', 'MAGICUSDT', 'WLDUSDT',
  'PENDLEUSDT', 'ARKMUSDT', 'ARBUSDT', 'OPUSDT', 'TIAUSDT',
  'ORDIUSDT', 'SUIUSDT', 'INJUSDT', 'SEIUSDT', 'APTUSDT',
  'LDOUSDT', 'STXUSDT', 'WIFUSDT', 'TAOUSDT', 'RENDERUSDT',
  'PEPEUSDT', 'FLOKIUSDT', 'SHIBUSDT', 'BONKUSDT', 'JUPUSDT'
];

// ==================== STATE MANAGEMENT ====================

// Salva l'ultimo stato di ogni simbolo per evitare alert duplicati
const lastSignalState = {};

// Rate limiter
let requestCount = 0;
let rateLimiterInterval = null;

// ==================== RATE LIMITER ====================

function initRateLimiter() {
  rateLimiterInterval = setInterval(() => {
    requestCount = 0;
  }, 60000); // Reset ogni minuto
}

async function waitForRateLimit() {
  while (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.log('⚠️  Rate limit raggiunto, attendo...');
    await sleep(1000);
  }
  requestCount++;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== FETCH CANDLES ====================

async function fetchCandles(symbol, interval) {
  try {
    await waitForRateLimit();

    const response = await axios.get(BINANCE_API, {
      params: {
        symbol: symbol,
        interval: interval,
        limit: CANDLES_LIMIT
      },
      timeout: 5000
    });

    // Binance restituisce: [openTime, open, high, low, close, volume, closeTime, ...]
    const candles = response.data.map(candle => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6]
    }));

    return candles;
  } catch (error) {
    console.error(`❌ Errore fetch ${symbol} ${interval}:`, error.message);
    return null;
  }
}

// ==================== CALCOLO INDICATORI ====================

function calculateIndicators(candles) {
  try {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // Calcolo EMA4
    const ema4Values = EMA.calculate({
      period: 4,
      values: closes
    });

    // Calcolo EMA8
    const ema8Values = EMA.calculate({
      period: 8,
      values: closes
    });

    // Calcolo SMA22
    const sma22Values = SMA.calculate({
      period: 22,
      values: closes
    });

    // Calcolo RSI14
    const rsi14Values = RSI.calculate({
      period: 14,
      values: closes
    });

    // Prendiamo gli ultimi valori validi
    const ema4 = ema4Values[ema4Values.length - 1];
    const ema8 = ema8Values[ema8Values.length - 1];
    const sma22 = sma22Values[sma22Values.length - 1];
    const rsi14 = rsi14Values[rsi14Values.length - 1];

    // Valori precedenti per rilevare crossover
    const ema4Prev = ema4Values[ema4Values.length - 2];
    const ema8Prev = ema8Values[ema8Values.length - 2];

    return {
      price: closes[closes.length - 1],
      time: new Date(candles[candles.length - 1].closeTime).toISOString(),
      ema4: ema4 || null,
      ema8: ema8 || null,
      sma22: sma22 || null,
      rsi14: rsi14 || null,
      ema4Prev: ema4Prev || null,
      ema8Prev: ema8Prev || null
    };
  } catch (error) {
    console.error('❌ Errore calcolo indicatori:', error.message);
    return null;
  }
}

// ==================== RILEVAZIONE SEGNALI ====================

function detectSignals(symbol, interval, indicators) {
  if (!indicators || !indicators.ema4 || !indicators.ema8 ||
      !indicators.ema4Prev || !indicators.ema8Prev) {
    return null;
  }

  const { ema4, ema8, ema4Prev, ema8Prev } = indicators;

  let signal = null;

  // SETUP_LONG: EMA4 incrocia verso l'alto EMA8
  // Era sotto e ora è sopra
  if (ema4Prev <= ema8Prev && ema4 > ema8) {
    signal = 'SETUP_LONG';
  }

  // SETUP_SHORT: EMA4 incrocia verso il basso EMA8
  // Era sopra e ora è sotto
  if (ema4Prev >= ema8Prev && ema4 < ema8) {
    signal = 'SETUP_SHORT';
  }

  // Controllo se è un segnale nuovo (evita duplicati)
  // Usa chiave composta symbol+interval
  const stateKey = `${symbol}_${interval}`;
  const lastSignal = lastSignalState[stateKey];

  if (signal && signal !== lastSignal) {
    lastSignalState[stateKey] = signal;
    return signal;
  }

  return null;
}

// ==================== INVIO ALERT DISCORD ====================

async function sendDiscordAlert(symbol, interval, event, indicators) {
  const webhookUrl = DISCORD_WEBHOOKS[interval];

  if (!webhookUrl) {
    console.error(`❌ Webhook non configurato per timeframe ${interval}`);
    return;
  }

  // Formattazione valori
  const price = parseFloat(indicators.price.toFixed(2));
  const ema4 = parseFloat(indicators.ema4.toFixed(2));
  const ema8 = parseFloat(indicators.ema8.toFixed(2));
  const sma22 = indicators.sma22 ? parseFloat(indicators.sma22.toFixed(2)) : null;
  const rsi14 = indicators.rsi14 ? parseFloat(indicators.rsi14.toFixed(2)) : null;

  // Colore e emoji in base al tipo di segnale
  const isLong = event === 'SETUP_LONG';
  const color = isLong ? 5763719 : 15548997; // verde per LONG, rosso per SHORT
  const emoji = isLong ? '🟢' : '🔴';
  const title = isLong ? '🟢 SETUP LONG' : '🔴 SETUP SHORT';

  // Formattazione prezzo con separatore migliaia
  const priceFormatted = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Costruzione embed Discord
  const embed = {
    title: title,
    description: `**${symbol}** detected on **${interval}** timeframe`,
    color: color,
    fields: [
      {
        name: '💰 Price',
        value: priceFormatted,
        inline: true
      },
      {
        name: '📊 RSI',
        value: rsi14 ? rsi14.toString() : 'N/A',
        inline: true
      },
      {
        name: '\u200b', // Campo vuoto per layout
        value: '\u200b',
        inline: true
      },
      {
        name: '📈 EMA4',
        value: ema4.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inline: true
      },
      {
        name: '📉 EMA8',
        value: ema8.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inline: true
      },
      {
        name: '📊 SMA22',
        value: sma22 ? sma22.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A',
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Binance Trading Monitor'
    }
  };

  const payload = {
    embeds: [embed]
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    const timestamp = new Date().toTimeString().split(' ')[0];
    const rsiStr = rsi14 ? `RSI ${rsi14}` : 'RSI N/A';

    console.log(`[${timestamp}] ${emoji} ${symbol} (${interval}) → ${event} @ ${priceFormatted} (${rsiStr})`);
  } catch (error) {
    console.error(`❌ Errore invio Discord webhook ${symbol} ${interval}:`, error.message);
  }
}

// ==================== ANALISI SINGOLO SIMBOLO SU UN TIMEFRAME ====================

async function analyzeSymbol(symbol, interval) {
  try {
    // 1. Scarica le candele
    const candles = await fetchCandles(symbol, interval);
    if (!candles || candles.length < CANDLES_LIMIT) {
      return;
    }

    // 2. Calcola indicatori
    const indicators = calculateIndicators(candles);
    if (!indicators) {
      return;
    }

    // 3. Rileva segnali
    const signal = detectSignals(symbol, interval, indicators);

    // 4. Invia alert Discord se c'è un nuovo segnale
    if (signal) {
      await sendDiscordAlert(symbol, interval, signal, indicators);
    }

  } catch (error) {
    console.error(`❌ Errore analisi ${symbol} ${interval}:`, error.message);
  }
}

// ==================== LOOP PRINCIPALE ====================

async function monitorAllSymbols() {
  const totalCombinations = SYMBOLS.length * TIMEFRAMES.length;
  console.log(`\n🔄 Scansione di ${SYMBOLS.length} simboli su ${TIMEFRAMES.length} timeframes (${totalCombinations} combinazioni)...`);

  const startTime = Date.now();

  // Crea array di tutte le combinazioni symbol + timeframe
  const tasks = [];
  for (const symbol of SYMBOLS) {
    for (const interval of TIMEFRAMES) {
      tasks.push(analyzeSymbol(symbol, interval));
    }
  }

  // Usa Promise.allSettled per gestire tutte le combinazioni in parallelo
  // senza che un errore blocchi gli altri
  const results = await Promise.allSettled(tasks);

  const failed = results.filter(r => r.status === 'rejected').length;
  const elapsed = Date.now() - startTime;

  console.log(`✅ Scansione completata in ${elapsed}ms (${failed} errori)`);
}

async function startMonitoring() {
  console.log('🚀 Binance Trading Monitor + Discord Integration');
  console.log('─'.repeat(60));
  console.log(`📊 Simboli: ${SYMBOLS.length}`);
  console.log(`⏰ Timeframes: ${TIMEFRAMES.join(', ')}`);
  console.log(`🔔 Canali Discord configurati: ${TIMEFRAMES.length}`);
  console.log(`⏱️  Intervallo di aggiornamento: ${REFRESH_INTERVAL_MS / 1000}s`);
  console.log(`📈 Indicatori: EMA4, EMA8, SMA22, RSI14`);
  console.log(`🎯 Segnali: SETUP_LONG (EMA4 > EMA8), SETUP_SHORT (EMA4 < EMA8)`);
  console.log('─'.repeat(60));

  // Inizializza il rate limiter
  initRateLimiter();

  // Loop infinito
  while (true) {
    try {
      await monitorAllSymbols();
    } catch (error) {
      console.error('❌ Errore nel loop principale:', error.message);
    }

    // Attendi prima del prossimo ciclo
    await sleep(REFRESH_INTERVAL_MS);
  }
}

// ==================== GESTIONE ERRORI E CLEANUP ====================

process.on('SIGINT', () => {
  console.log('\n\n👋 Arresto del monitor...');
  if (rateLimiterInterval) {
    clearInterval(rateLimiterInterval);
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Errore non gestito:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejection non gestita:', reason);
});

// ==================== AVVIO ====================

startMonitoring().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
