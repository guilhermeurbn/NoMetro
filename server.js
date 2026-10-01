const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const METRO_API_TOKEN = process.env.METRO_API_TOKEN;
const METRO_API_HOST = 'api.metrolisboa.pt';
const METRO_API_PORT = 8243;
const METRO_BASE_PATH = '/estadoServicoML/1.0.1';

app.use(cors());
app.use(express.json());

// Enforce HTTPS behind reverse proxies (Render, Cloudflare, etc.)
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML não deve ficar em cache longo para garantir atualizações imediatas do app
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      // JS, CSS, imagens, webmanifest e SVGs cacheados por 1 dia (e utilizáveis enquanto revalida em 7 dias)
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
}));

// Privacy Policy Route (App Store compliance)
app.get('/privacidade', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'privacidade.html'));
});

// In-memory cache store
const cache = {
  status: { data: null, timestamp: 0, ttl: 15 * 1000 },
  stations: { data: null, timestamp: 0, ttl: 3600 * 1000 },
  waitTimes: { data: null, timestamp: 0, ttl: 10 * 1000 },
  intervals: { data: null, timestamp: 0, ttl: 3600 * 1000 }
};

// Line stations in geographic order
const LINE_STATIONS_ORDER = {
  Azul: [
    'RB', 'AS', 'AF', 'PO', 'CA', 'CM', 'AH', 'LA', 'JZ', 'PE',
    'SS', 'PA', 'MP', 'AV', 'RE', 'BC', 'TP', 'SP'
  ],
  Amarela: [
    'OD', 'SR', 'AX', 'LU', 'QC', 'CG', 'CU', 'EC', 'CP', 'SA', 'PI', 'MP', 'RA'
  ],
  Verde: [
    'TE', 'CG', 'AL', 'RM', 'AE', 'AM', 'AR', 'AN', 'IN', 'MM', 'RO', 'BC', 'CS'
  ],
  Vermelha: [
    'SS', 'SA', 'AM', 'OL', 'BV', 'CH', 'OS', 'CR', 'OR', 'MO', 'EN', 'AP'
  ]
};

const LINE_COLORS = {
  Azul: '#0084c9',
  Amarela: '#f6b21b',
  Verde: '#009e54',
  Vermelha: '#e30613'
};

const LINE_TERMINALS = {
  Azul: { dir1: 'Reboleira', dir2: 'Santa Apolónia' },
  Amarela: { dir1: 'Odivelas', dir2: 'Rato' },
  Verde: { dir1: 'Telheiras', dir2: 'Cais do Sodré' },
  Vermelha: { dir1: 'São Sebastião', dir2: 'Aeroporto' }
};

// Official Metropolitano de Lisboa Destination Codes Mapping
const METRO_DESTINATIONS = {
  // Linha Azul
  '33': { line: 'Azul', destination: 'Reboleira', dirKey: 'dir1' },
  '42': { line: 'Azul', destination: 'Santa Apolónia', dirKey: 'dir2' },
  '41': { line: 'Azul', destination: 'Pontinha', dirKey: 'dir1' },
  '44': { line: 'Azul', destination: 'Amadora Este', dirKey: 'dir1' },

  // Linha Amarela
  '43': { line: 'Amarela', destination: 'Odivelas', dirKey: 'dir1' },
  '48': { line: 'Amarela', destination: 'Rato', dirKey: 'dir2' },
  '49': { line: 'Amarela', destination: 'Campo Grande', dirKey: 'dir1' },

  // Linha Verde
  '50': { line: 'Verde', destination: 'Telheiras', dirKey: 'dir1' },
  '54': { line: 'Verde', destination: 'Cais do Sodré', dirKey: 'dir2' },

  // Linha Vermelha
  '38': { line: 'Vermelha', destination: 'São Sebastião', dirKey: 'dir1' },
  '60': { line: 'Vermelha', destination: 'Aeroporto', dirKey: 'dir2' },
  '40': { line: 'Vermelha', destination: 'Oriente', dirKey: 'dir2' },
  '39': { line: 'Vermelha', destination: 'Alameda', dirKey: 'dir1' }
};

function enrichTrainData(rawTrains) {
  if (!Array.isArray(rawTrains)) return [];
  return rawTrains.map(t => {
    const destInfo = METRO_DESTINATIONS[String(t.destino)] || null;
    const sec1 = (t.tempoChegada1 !== '--' && t.tempoChegada1 !== null && t.tempoChegada1 !== undefined) 
      ? parseInt(t.tempoChegada1, 10) 
      : null;
    const sec2 = (t.tempoChegada2 !== '--' && t.tempoChegada2 !== null && t.tempoChegada2 !== undefined) 
      ? parseInt(t.tempoChegada2, 10) 
      : null;
    const sec3 = (t.tempoChegada3 !== '--' && t.tempoChegada3 !== null && t.tempoChegada3 !== undefined) 
      ? parseInt(t.tempoChegada3, 10) 
      : null;

    return {
      ...t,
      lineName: destInfo ? destInfo.line : null,
      destinationName: destInfo ? destInfo.destination : null,
      dirKey: destInfo ? destInfo.dirKey : null,
      seconds1: !isNaN(sec1) ? sec1 : null,
      seconds2: !isNaN(sec2) ? sec2 : null,
      seconds3: !isNaN(sec3) ? sec3 : null
    };
  });
}

// Helper for Metro API HTTPS request
function fetchMetroApi(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: METRO_API_HOST,
      port: METRO_API_PORT,
      path: `${METRO_BASE_PATH}${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${METRO_API_TOKEN}`,
        'Accept': 'application/json'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: data, error: 'JSON parse error' });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(6000, () => {
      req.destroy();
      reject(new Error('Timeout connecting to Metro Lisboa API'));
    });

    req.end();
  });
}

// In-flight request deduplication map (prevents cache stampede / thundering herd)
const inflightRequests = new Map();

function fetchMetroApiDeduped(endpoint) {
  if (inflightRequests.has(endpoint)) {
    return inflightRequests.get(endpoint);
  }
  const promise = fetchMetroApi(endpoint).finally(() => {
    inflightRequests.delete(endpoint);
  });
  inflightRequests.set(endpoint, promise);
  return promise;
}

// 1. Line Status endpoint (/api/status)
app.get('/api/status', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=5');
  const now = Date.now();
  if (cache.status.data && (now - cache.status.timestamp < cache.status.ttl)) {
    return res.json({ ...cache.status.data, cached: true });
  }

  try {
    const apiRes = await fetchMetroApiDeduped('/estadoLinha/todos');
    if (apiRes && apiRes.resposta) {
      const data = {
        success: true,
        lines: {
          Azul: {
            status: apiRes.resposta.azul_curta || 'normal',
            message: apiRes.resposta.azul || 'Ok',
            code: apiRes.resposta.tipo_msg_az || '0',
            color: LINE_COLORS.Azul
          },
          Amarela: {
            status: apiRes.resposta.amarela_curta || 'normal',
            message: apiRes.resposta.amarela || 'Ok',
            code: apiRes.resposta.tipo_msg_am || '0',
            color: LINE_COLORS.Amarela
          },
          Verde: {
            status: apiRes.resposta.verde_curta || 'normal',
            message: apiRes.resposta.verde || 'Ok',
            code: apiRes.resposta.tipo_msg_vd || '0',
            color: LINE_COLORS.Verde
          },
          Vermelha: {
            status: apiRes.resposta.vermelha_curta || 'normal',
            message: apiRes.resposta.vermelha || 'Ok',
            code: apiRes.resposta.tipo_msg_vm || '0',
            color: LINE_COLORS.Vermelha
          }
        },
        timestamp: new Date().toISOString()
      };
      cache.status = { data, timestamp: now, ttl: 15000 };
      return res.json(data);
    }
  } catch (err) {
    console.error('Error fetching status:', err.message);
  }

  // Fallback if Metro API temporarily fails
  if (cache.status.data) {
    return res.json({ ...cache.status.data, fallback: true });
  }

  res.json({
    success: true,
    lines: {
      Azul: { status: 'normal', message: 'Ok', color: LINE_COLORS.Azul },
      Amarela: { status: 'normal', message: 'Ok', color: LINE_COLORS.Amarela },
      Verde: { status: 'normal', message: 'Ok', color: LINE_COLORS.Verde },
      Vermelha: { status: 'normal', message: 'Ok', color: LINE_COLORS.Vermelha }
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Stations metadata endpoint (/api/estacoes)
app.get('/api/estacoes', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  const now = Date.now();
  if (cache.stations.data && (now - cache.stations.timestamp < cache.stations.ttl)) {
    return res.json(cache.stations.data);
  }

  try {
    const apiRes = await fetchMetroApiDeduped('/infoEstacao/todos');
    if (apiRes && Array.isArray(apiRes.resposta)) {
      const stations = apiRes.resposta.map(s => {
        // Parse "[Verde, Vermelha]" -> ["Verde", "Vermelha"]
        let lines = [];
        if (typeof s.linha === 'string') {
          lines = s.linha.replace(/[\[\]]/g, '').split(',').map(l => l.trim()).filter(Boolean);
        }
        return {
          id: s.stop_id,
          name: s.stop_name,
          lat: parseFloat(s.stop_lat),
          lon: parseFloat(s.stop_lon),
          url: s.stop_url,
          lines: lines,
          zone: s.zone_id
        };
      });

      const data = {
        success: true,
        stations,
        lineOrders: LINE_STATIONS_ORDER,
        lineTerminals: LINE_TERMINALS,
        colors: LINE_COLORS
      };
      cache.stations = { data, timestamp: now, ttl: cache.stations.ttl };
      return res.json(data);
    }
  } catch (err) {
    console.error('Error fetching stations:', err.message);
  }

  if (cache.stations.data) {
    return res.json(cache.stations.data);
  }

  res.status(500).json({ success: false, error: 'Could not load stations' });
});

// Helper: Calculate accurate Lisbon Metro service operating status & countdown
function getLisbonServiceStatus() {
  const lisbonStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" });
  const lisbonDate = new Date(lisbonStr);
  const hours = lisbonDate.getHours();
  const minutes = lisbonDate.getMinutes();
  const seconds = lisbonDate.getSeconds();

  // Official Metro de Lisboa operating hours: 06:30 - 01:00
  // Night closure: between 01:00:00 and 06:29:59
  const isClosed = (hours >= 1 && hours < 6) || (hours === 6 && minutes < 30);

  // Target reopening is 06:30:00 Lisbon time
  const targetReopen = new Date(lisbonDate);
  targetReopen.setHours(6, 30, 0, 0);
  if (hours > 6 || (hours === 6 && minutes >= 30)) {
    // If called during daylight hours, next reopening is tomorrow morning
    targetReopen.setDate(targetReopen.getDate() + 1);
  }

  const diffMs = Math.max(0, targetReopen - lisbonDate);
  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formattedHoursMinutes = `${remainingHours}h ${remainingMinutes < 10 ? '0' : ''}${remainingMinutes}m`;
  const formattedColon = `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  return {
    isClosed,
    currentLisbonTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    hours,
    minutes,
    seconds,
    diffMs,
    remainingHours,
    remainingMinutes,
    remainingSeconds,
    formattedHoursMinutes,
    formattedColon,
    reopenTime: '06:30',
    scheduleInfo: '06:30 — 01:00'
  };
}

// Helper to retrieve wait times with memory caching and stale fallback
async function getGlobalWaitTimes() {
  const now = Date.now();
  // Se o cache tiver menos de 12 segundos, usa direto da memória
  if (cache.waitTimes.data && (now - cache.waitTimes.timestamp < 12000)) {
    return cache.waitTimes.data;
  }

  try {
    const apiRes = await fetchMetroApiDeduped('/tempoEspera/Estacao/todos');
    const rawList = (apiRes && Array.isArray(apiRes.resposta)) ? apiRes.resposta : [];
    if (rawList.length > 0) {
      const liveData = enrichTrainData(rawList);
      cache.waitTimes = {
        data: liveData,
        timestamp: now,
        ttl: 12000
      };
      return liveData;
    }
  } catch (err) {
    console.error('Error fetching global wait times:', err.message);
  }

  // Fallback: se a API falhar ou der timeout, retorna o último dado válido em cache
  if (cache.waitTimes.data) {
    return cache.waitTimes.data;
  }

  return [];
}

// Pre-warm wait times cache every 12s when metro service is running
setInterval(async () => {
  const status = getLisbonServiceStatus();
  if (!status.isClosed) {
    try {
      await getGlobalWaitTimes();
    } catch (e) {}
  }
}, 12000);

// 3. Real-time wait times endpoint (/api/tempo-espera)
app.get('/api/tempo-espera', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=5');
  const serviceStatus = getLisbonServiceStatus();

  if (serviceStatus.isClosed) {
    return res.json({
      success: true,
      serviceStatus,
      trains: [],
      timestamp: new Date().toISOString()
    });
  }

  const trains = await getGlobalWaitTimes();
  return res.json({
    success: true,
    serviceStatus,
    trains,
    cached: true,
    timestamp: new Date().toISOString()
  });
});

// 4. Station specific wait times (/api/tempo-espera/:id)
app.get('/api/tempo-espera/:id', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=5');
  const stationId = req.params.id.toUpperCase();
  const serviceStatus = getLisbonServiceStatus();

  if (serviceStatus.isClosed) {
    return res.json({
      success: true,
      stationId,
      serviceStatus,
      trains: [],
      timestamp: new Date().toISOString()
    });
  }

  // Fast response from pre-warmed global cache (always < 3ms)
  const allTrains = await getGlobalWaitTimes();
  let stationTrains = allTrains.filter(t => t.stop_id === stationId);

  // Fallback if specific station wasn't returned in global batch
  if (stationTrains.length === 0) {
    try {
      const apiRes = await fetchMetroApiDeduped(`/tempoEspera/Estacao/${stationId}`);
      const rawList = (apiRes && Array.isArray(apiRes.resposta)) ? apiRes.resposta : [];
      if (rawList.length > 0) {
        stationTrains = enrichTrainData(rawList);
      }
    } catch (err) {
      console.warn(`Station ${stationId} single fetch fallback failed:`, err.message);
    }
  }

  return res.json({
    success: true,
    stationId,
    serviceStatus,
    trains: stationTrains,
    timestamp: new Date().toISOString()
  });
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚇 Servidor NoMetro rodando em http://localhost:${PORT}`);
  console.log(`📱 Acesso no telemóvel: http://192.168.1.232:${PORT}`);
});
