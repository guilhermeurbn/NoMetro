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
app.use(express.static(path.join(__dirname, 'public')));

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

// 1. Line Status endpoint (/api/status)
app.get('/api/status', async (req, res) => {
  const now = Date.now();
  if (cache.status.data && (now - cache.status.timestamp < cache.status.ttl)) {
    return res.json({ ...cache.status.data, cached: true });
  }

  try {
    const apiRes = await fetchMetroApi('/estadoLinha/todos');
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
  const now = Date.now();
  if (cache.stations.data && (now - cache.stations.timestamp < cache.stations.ttl)) {
    return res.json(cache.stations.data);
  }

  try {
    const apiRes = await fetchMetroApi('/infoEstacao/todos');
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

// 3. Real-time wait times endpoint (/api/tempo-espera)
app.get('/api/tempo-espera', async (req, res) => {
  const serviceStatus = getLisbonServiceStatus();
  const now = Date.now();

  if (serviceStatus.isClosed) {
    return res.json({
      success: true,
      serviceStatus,
      trains: [],
      timestamp: new Date().toISOString()
    });
  }

  if (cache.waitTimes.data && (now - cache.waitTimes.timestamp < cache.waitTimes.ttl)) {
    return res.json({ ...cache.waitTimes.data, serviceStatus, cached: true });
  }

  try {
    const apiRes = await fetchMetroApi('/tempoEspera/Estacao/todos');
    const liveData = (apiRes && Array.isArray(apiRes.resposta)) ? apiRes.resposta : [];

    const data = {
      success: true,
      serviceStatus,
      trains: liveData,
      timestamp: new Date().toISOString()
    };

    cache.waitTimes = { data, timestamp: now, ttl: 10000 };
    return res.json(data);
  } catch (err) {
    console.error('Error fetching wait times:', err.message);
    return res.json({
      success: true,
      serviceStatus,
      trains: [],
      error: 'Instabilidade temporária na telemetria',
      timestamp: new Date().toISOString()
    });
  }
});

// 4. Station specific wait times (/api/tempo-espera/:id)
app.get('/api/tempo-espera/:id', async (req, res) => {
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

  try {
    const apiRes = await fetchMetroApi(`/tempoEspera/Estacao/${stationId}`);
    return res.json({
      success: true,
      stationId,
      serviceStatus,
      trains: (apiRes && Array.isArray(apiRes.resposta)) ? apiRes.resposta : [],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, serviceStatus });
  }
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚇 Servidor NoMetro rodando em http://localhost:${PORT}`);
  console.log(`📱 Acesso no telemóvel: http://192.168.1.232:${PORT}`);
});
