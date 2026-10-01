// ========================================================
// NoMetro • Lisboa - Controller (Inline Rede Page & Tab Bar)
// ========================================================

// Garantir HTTPS para suporte a geolocalização e Service Worker em produção
if (typeof location !== 'undefined' && location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.href = location.href.replace('http:', 'https:');
}

// Native App Bridge (Capacitor iOS / Android)
const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor !== undefined ||
  window.location?.protocol === 'capacitor:' ||
  Boolean(window.location?.origin && window.location.origin.includes('capacitor://'))
);
const API_BASE = isNativeApp ? 'https://nometro.pt' : '';

// Native Haptic Feedback (Taptic Engine)
function triggerHaptic(style = 'light') {
  try {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
      const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
      if (style === 'light') {
        Haptics.impact({ style: ImpactStyle.Light });
      } else if (style === 'medium') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else if (style === 'selection') {
        Haptics.selectionChanged();
      }
    } else if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (e) {}
}

// Utility para sanitização e escape de strings em HTML (prevenção de XSS)
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const I18N = {
  pt: {
    searchPlaceholder: 'Pesquisar estação...',
    gpsTitle: 'Estação mais próxima',
    themeTitle: 'Tema Claro / Escuro',
    langToggle: 'EN',
    towards: 'Sentido',
    line: 'Linha',
    atStation: 'Na Estação',
    approaching: 'A aproximar-se',
    arriving: 'A chegar',
    stop1: '1 paragem',
    stops: 'paragens',
    next: 'Seguinte:',
    minutes: 'min',
    prevStationDefault: 'Estação Anterior',
    tabMetro: 'Metro',
    tabNetwork: 'Linhas',
    normalStatus: 'Normal',
    allLinesNormal: 'Circulação Normal',
    serviceAlert: 'Com Avisos',
    noStationFound: 'Nenhuma estação encontrada',
    frequency: 'Frequência ~4 min',
    activeStationTag: 'Ativa',
    recentStations: 'Pesquisas Recentes',
    networkTitle: 'Rede do Metro',
    networkSubtitle: 'Linhas, paragens e correspondências',
    filterStationPlaceholder: 'Filtrar estação na linha...',
    towardsPrefix: 'Para',
    openInMainView: 'Ver no Próximo Metro',
    interchanges: 'correspondências',
    close: 'Fechar',
    metroClosedTitle: 'Serviço encerrado neste momento',
    metroReopensIn: 'Reabre em',
    scheduledReopenPrefix: 'Reabertura prevista às',
    operatingHoursLabel: 'Horário habitual de circulação',
    operatingHoursValue: '06:30 — 01:00 (todos os dias)',
    nightServiceClosed: 'Serviço Noturno Encerrado',
    lineStatusClosed: 'Encerrada',
    serviceAffected: 'Serviço afetado',
    delayedStatusText: 'Perturbação • Circulação irregular',
    modeReal: 'Real',
    modeSim: 'Sim',
    modeDelayed: 'Atraso',
    allLines: 'Todas',
    waitingNetwork: 'A aguardar rede • Estimativa baseada no último sinal'
  },
  en: {
    searchPlaceholder: 'Search station...',
    gpsTitle: 'Nearest station',
    themeTitle: 'Light / Dark Theme',
    langToggle: 'PT',
    towards: 'Towards',
    line: 'Line',
    atStation: 'At Station',
    approaching: 'Approaching',
    arriving: 'Arriving',
    stop1: '1 stop',
    stops: 'stops',
    next: 'Next:',
    minutes: 'min',
    prevStationDefault: 'Previous Station',
    tabMetro: 'Metro',
    tabNetwork: 'Lines',
    normalStatus: 'Normal',
    allLinesNormal: 'Normal Service',
    serviceAlert: 'Service Alerts',
    noStationFound: 'No station found',
    frequency: 'Frequency ~4 min',
    activeStationTag: 'Active',
    recentStations: 'Recent Searches',
    networkTitle: 'Metro Network',
    networkSubtitle: 'Lines, stops and transfers',
    filterStationPlaceholder: 'Filter station in line...',
    towardsPrefix: 'To',
    openInMainView: 'Open in Next Train',
    interchanges: 'transfers',
    close: 'Close',
    metroClosedTitle: 'Metro currently out of service',
    metroReopensIn: 'Reopens in',
    scheduledReopenPrefix: 'Scheduled reopening at',
    operatingHoursLabel: 'Regular operating hours',
    operatingHoursValue: '06:30 — 01:00 (daily)',
    nightServiceClosed: 'Night Service Closed',
    lineStatusClosed: 'Closed',
    serviceAffected: 'Service affected',
    delayedStatusText: 'Delayed • Irregular service',
    modeReal: 'Real',
    modeSim: 'Sim',
    modeDelayed: 'Delay',
    allLines: 'All',
    waitingNetwork: 'Waiting for network • Estimated from last signal'
  }
};

const TRANSIT_HUBS = {
  // Azul
  RB: { hubLabel: 'CP Sintra' },
  CM: { hubLabel: 'Terminal' },
  JZ: { hubLabel: 'Sete Rios (CP/Fertagus)' },
  SS: { metro: ['Vermelha'] },
  MP: { metro: ['Amarela'] },
  RE: { hubLabel: 'Rossio (CP)' },
  BC: { metro: ['Verde'] },
  TP: { hubLabel: 'Barcos Barreiro' },
  SP: { hubLabel: 'CP Santa Apolónia' },

  // Amarela
  OD: { hubLabel: 'Terminal' },
  SR: { hubLabel: 'Terminal' },
  CG: { metro: ['Verde'], hubLabel: 'Terminal' },
  EC: { hubLabel: 'Entrecampos (CP/Fertagus)' },
  SA: { metro: ['Vermelha'] },
  RA: { hubLabel: 'Carris Hub' },

  // Verde
  RM: { hubLabel: 'Roma-Areeiro (CP)' },
  AE: { hubLabel: 'Roma-Areeiro (CP)' },
  AM: { metro: ['Vermelha'] },
  RO: { hubLabel: 'CP Rossio' },
  CS: { hubLabel: 'Cascais • Cacilhas' },

  // Vermelha
  OR: { hubLabel: 'Gare Oriente • Terminal' },
  AP: { hubLabel: 'Aeroporto' }
};

const staticMetroData = (typeof window !== 'undefined' && window.STATIC_METRO_DATA) || {};
const initialStationsMap = {};
if (Array.isArray(staticMetroData.stations)) {
  staticMetroData.stations.forEach(s => { initialStationsMap[s.id] = s; });
}

const STATE = {
  stations: staticMetroData.stations || [],
  stationsMap: initialStationsMap,
  lineOrders: staticMetroData.lineOrders || {},
  lineTerminals: staticMetroData.lineTerminals || {},
  colors: staticMetroData.colors || {
    Azul: '#0084c9',
    Amarela: '#f6b21b',
    Verde: '#009e54',
    Vermelha: '#e30613'
  },
  selectedStationId: (typeof localStorage !== 'undefined' && localStorage.getItem('nometro_last_station')) || 'MP',
  selectedTimelineLine: 'Azul',
  currentView: 'next-train',
  simulationMode: false,
  currentTheme: (function() {
    const custom = localStorage.getItem('nometro_theme_custom');
    if (custom) return custom;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  })(),
  currentLang: localStorage.getItem('nometro_lang') || 'pt',
  userLocation: null,
  simulatedTrains: {},
  networkDirection: 'forward', // 'forward' or 'backward'
  networkSearchQuery: '',
  activeSheetStationId: null,
  isServiceClosed: false,
  secondsUntilReopen: 0,
  serviceStatus: null,
  appMode: 'normal', // Sempre dados reais da API oficial em produção
  selectedStationLineFilter: 'ALL',
  isWaitingForNetwork: false,
  lastSuccessfulSync: null
};

// Limpa qualquer modo de simulação antigo retido no localStorage do navegador
try { localStorage.removeItem('nometro_app_mode'); } catch (e) {}

// Suporte a parâmetro de URL apenas para testes locais de desenvolvimento: ?mode=sim
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('mode')) {
  const m = urlParams.get('mode').toLowerCase();
  if (['normal', 'real'].includes(m)) STATE.appMode = 'normal';
  else if (['sim', 'simulation'].includes(m)) STATE.appMode = 'simulation';
  else if (['delayed', 'atraso', 'afetado'].includes(m)) STATE.appMode = 'delayed';
}

function t(key) {
  return I18N[STATE.currentLang][key] || key;
}

// DOM Elements
const dom = {
  viewNextTrain: document.getElementById('view-next-train'),
  viewNetwork: document.getElementById('view-network'),
  activeStationHero: document.getElementById('active-station-hero'),
  activeStationName: document.getElementById('active-station-name'),
  activeStationBadges: document.getElementById('active-station-badges'),
  stationDistBadge: document.getElementById('station-dist-badge'),
  stationLineFilter: document.getElementById('station-line-filter'),
  networkWaitingPill: document.getElementById('network-waiting-pill'),
  waitingNetworkText: document.getElementById('waiting-network-text'),
  stationSearch: document.getElementById('station-search'),
  stationDropdown: document.getElementById('station-dropdown'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  btnGps: document.getElementById('btn-gps'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnTheme: document.getElementById('btn-theme'),
  themeIconMoon: document.querySelector('.theme-icon.moon'),
  themeIconSun: document.querySelector('.theme-icon.sun'),
  btnLang: document.getElementById('btn-lang'),
  langLabel: document.getElementById('lang-label'),
  btnModeToggle: document.getElementById('btn-mode-toggle'),
  modeLabel: document.getElementById('mode-label'),
  trainDirectionsContainer: document.getElementById('train-directions-container'),
  navBtns: document.querySelectorAll('.nav-btn'),
  networkLineTabs: document.querySelectorAll('.line-tab-btn'),
  bannerLineTag: document.getElementById('banner-line-tag'),
  bannerTerminals: document.getElementById('banner-terminals'),
  bannerStatusPill: document.getElementById('banner-status-pill'),
  schematicTrackContainer: document.getElementById('schematic-track-container'),
  lineBannerCard: document.getElementById('line-banner-card'),
  networkViewTitle: document.getElementById('network-view-title'),
  networkViewSubtitle: document.getElementById('network-view-subtitle'),
  networkGlobalStatus: document.getElementById('network-global-status'),
  networkGlobalStatusText: document.getElementById('network-global-status-text'),
  chipStops: document.getElementById('chip-stops'),
  dirBtnForward: document.getElementById('dir-btn-forward'),
  dirBtnBackward: document.getElementById('dir-btn-backward'),
  dirLabelForward: document.getElementById('dir-label-forward'),
  dirLabelBackward: document.getElementById('dir-label-backward'),
  stationDetailSheet: document.getElementById('station-detail-sheet'),
  sheetStationLines: document.getElementById('sheet-station-lines'),
  sheetStationName: document.getElementById('sheet-station-name'),
  sheetCloseBtn: document.getElementById('sheet-close-btn'),
  sheetConnections: document.getElementById('sheet-connections'),
  sheetLiveTrains: document.getElementById('sheet-live-trains'),
  sheetBtnSelect: document.getElementById('sheet-btn-select'),
  sheetSelectLabel: document.getElementById('sheet-select-label')
};

// Theme Switcher (Detects white or black system theme automatically)
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function applyTheme(theme, isManual = false) {
  STATE.currentTheme = theme;
  if (isManual) {
    localStorage.setItem('nometro_theme_custom', theme);
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');

  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (metaTheme) metaTheme.setAttribute('content', '#f2f2f7');
    if (dom.themeIconMoon) dom.themeIconMoon.style.display = 'none';
    if (dom.themeIconSun) dom.themeIconSun.style.display = 'block';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (metaTheme) metaTheme.setAttribute('content', '#000000');
    if (dom.themeIconMoon) dom.themeIconMoon.style.display = 'block';
    if (dom.themeIconSun) dom.themeIconSun.style.display = 'none';
  }

  // Native iOS StatusBar update
  try {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('StatusBar')) {
      const { StatusBar, Style } = window.Capacitor.Plugins;
      StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark });
    }
  } catch (e) {}
}

function toggleTheme() {
  triggerHaptic('selection');
  const nextTheme = STATE.currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme, true);
}

// Auto-detect and listen for system dark/light mode changes (e.g. automatic iOS/Android sunset theme)
function setupSystemThemeListener() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  
  const handleSystemThemeChange = (e) => {
    // Only adapt automatically if the user hasn't explicitly locked a custom preference via the toggle button
    const hasCustomOverride = localStorage.getItem('nometro_theme_custom');
    if (!hasCustomOverride) {
      applyTheme(e.matches ? 'light' : 'dark', false);
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemThemeChange);
  }
}

// Language Switcher
function applyLanguage(lang) {
  const safeLang = (I18N && I18N[lang]) ? lang : 'pt';
  STATE.currentLang = safeLang;
  localStorage.setItem('nometro_lang', safeLang);

  if (dom.langLabel) dom.langLabel.textContent = I18N[safeLang].langToggle;
  if (dom.stationSearch) dom.stationSearch.placeholder = t('searchPlaceholder');

  // Nav buttons
  const navSpans = document.querySelectorAll('.nav-btn span');
  if (navSpans.length >= 2) {
    navSpans[0].textContent = t('tabMetro');
    navSpans[1].textContent = t('tabNetwork');
  }

  // Network view translations
  if (dom.networkViewTitle) dom.networkViewTitle.textContent = t('networkTitle');
  if (dom.networkViewSubtitle) dom.networkViewSubtitle.textContent = t('networkSubtitle');
  if (dom.sheetSelectLabel) dom.sheetSelectLabel.textContent = t('openInMainView');

  updateModeButtonUI();
  updateActiveStationUI();
  renderSchematicTrack();
}

function toggleLanguage() {
  const nextLang = STATE.currentLang === 'pt' ? 'en' : 'pt';
  applyLanguage(nextLang);
}

// Mode Switcher (Tempo Real / Simulação / Atraso)
function updateModeButtonUI() {
  if (!dom.btnModeToggle || !dom.modeLabel) return;
  dom.btnModeToggle.classList.remove('mode-simulation', 'mode-delayed');
  if (STATE.appMode === 'normal') {
    dom.modeLabel.textContent = t('modeReal');
    dom.btnModeToggle.title = 'Modo: Tempo Real (API). Clique para alternar.';
  } else if (STATE.appMode === 'simulation') {
    dom.btnModeToggle.classList.add('mode-simulation');
    dom.modeLabel.textContent = t('modeSim');
    dom.btnModeToggle.title = 'Modo: Simulação Normal. Clique para alternar.';
  } else if (STATE.appMode === 'delayed') {
    dom.btnModeToggle.classList.add('mode-delayed');
    dom.modeLabel.textContent = t('modeDelayed');
    dom.btnModeToggle.title = 'Modo: Simulação com Atraso / Serviço Afetado. Clique para alternar.';
  }
}

function cycleMode() {
  if (STATE.appMode === 'normal') {
    setMode('simulation');
  } else if (STATE.appMode === 'simulation') {
    setMode('delayed');
  } else {
    setMode('normal');
  }
}

function setMode(mode) {
  if (['normal', 'simulation', 'delayed'].includes(mode)) {
    STATE.appMode = mode;
    localStorage.setItem('nometro_app_mode', mode);
    updateModeButtonUI();
    updateActiveStationUI();
    renderSchematicTrack();
  }
}

window.setMode = setMode;

// View Switcher (Metro vs Rede)
function switchView(viewName) {
  triggerHaptic('selection');
  STATE.currentView = viewName;
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (viewName === 'network') {
    document.body.classList.remove('view-metro-active');
    document.body.classList.add('view-network-active');
    dom.viewNextTrain.style.display = 'none';
    dom.viewNetwork.style.display = 'block';
    dom.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === 'network'));
    renderSchematicTrack();
  } else {
    document.body.classList.remove('view-network-active');
    document.body.classList.add('view-metro-active');
    dom.viewNextTrain.style.display = 'block';
    dom.viewNetwork.style.display = 'none';
    dom.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === 'next-train'));
  }
}

// Hide App Splash Screen with smooth fade
function hideSplashScreen() {
  const splash = document.getElementById('app-splash');
  if (!splash || splash.classList.contains('splash-hidden')) return;
  splash.classList.add('splash-hidden');
  setTimeout(() => {
    try { splash.remove(); } catch (e) {}
  }, 450);

  // Native Capacitor Splash Hide
  try {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('SplashScreen')) {
      window.Capacitor.Plugins.SplashScreen.hide();
    }
  } catch (e) {}
}

// Initialize
async function init() {
  setupEventListeners();
  setupSystemThemeListener();
  applyTheme(STATE.currentTheme, false);
  applyLanguage(STATE.currentLang);
  switchView(STATE.currentView || 'next-train');
  updateModeButtonUI();

  // Draw UI immediately on frame 0 (Zero blank screen delay)
  updateActiveStationUI();
  renderSchematicTrack();

  // Fast splash screen reveal
  const safetyTimeout = setTimeout(hideSplashScreen, 1200);
  const startTime = Date.now();

  try {
    const stationsRes = await fetch(`${API_BASE}/api/estacoes`).then(r => r.json());
    if (stationsRes && stationsRes.success && Array.isArray(stationsRes.stations)) {
      STATE.stations = stationsRes.stations;
      if (stationsRes.lineOrders) STATE.lineOrders = stationsRes.lineOrders;
      if (stationsRes.lineTerminals) STATE.lineTerminals = stationsRes.lineTerminals;
      if (stationsRes.colors) STATE.colors = stationsRes.colors;

      stationsRes.stations.forEach(s => {
        STATE.stationsMap[s.id] = s;
      });

      try {
        localStorage.setItem('nometro_cached_stations_v2', JSON.stringify(stationsRes));
      } catch (e) {}

      // Restore last searched station if valid
      try {
        const lastStation = localStorage.getItem('nometro_last_station');
        if (lastStation && STATE.stationsMap[lastStation]) {
          STATE.selectedStationId = lastStation;
        }
      } catch (e) {}
    }

    // Auto-request location permission on startup for instant exact nearest station
    autoLocateOnStartup();

    await fetchNetworkStatus();
    await updateActiveStationUI();
    renderSchematicTrack();
  } catch (err) {
    console.error('Init error:', err);
  } finally {
    clearTimeout(safetyTimeout);
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 350 - elapsed);
    setTimeout(hideSplashScreen, remainingDelay);
  }

  setInterval(tickTrains, 1000);
  setInterval(async () => {
    await fetchNetworkStatus();
    await fetchWaitTimes();
    if (STATE.isServiceClosed) {
      renderServiceClosedCard();
    }
  }, 15000);
}

// Fetch Lines Status
async function fetchNetworkStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`).then(r => r.json());
    if (res.success && res.lines) {
      STATE.lineStatuses = res.lines;
      renderSchematicTrack();
      if (STATE.currentView === 'home' && !STATE.isServiceClosed) {
        renderTrainCards();
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Network Waiting Indicator UI
function updateNetworkWaitingUI() {
  if (!dom.networkWaitingPill) return;
  if (STATE.isServiceClosed) {
    dom.networkWaitingPill.style.display = 'none';
    return;
  }

  if (STATE.isWaitingForNetwork) {
    dom.networkWaitingPill.style.display = 'inline-flex';
    if (dom.waitingNetworkText) dom.waitingNetworkText.textContent = t('waitingNetwork');
  } else {
    dom.networkWaitingPill.style.display = 'none';
  }
}

// Extrapolate seconds left using wall clock when offline / in tunnel
function extrapolateOfflineTrains() {
  if (!STATE.simulatedTrains) return;
  const now = Date.now();
  Object.keys(STATE.simulatedTrains).forEach(key => {
    const train = STATE.simulatedTrains[key];
    if (train && train.targetArrivalTime) {
      train.secondsLeft = Math.max(0, Math.floor((train.targetArrivalTime - now) / 1000));
    }
  });
}

// Station Line Filter (Shown when a station has 2 or more lines)
function renderStationLineFilter() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!dom.stationLineFilter) return;

  if (!station || station.lines.length <= 1 || STATE.isServiceClosed) {
    dom.stationLineFilter.style.display = 'none';
    dom.stationLineFilter.innerHTML = '';
    STATE.selectedStationLineFilter = null;
    return;
  }

  // Default to first line if none or invalid line selected
  if (!STATE.selectedStationLineFilter || !station.lines.includes(STATE.selectedStationLineFilter)) {
    STATE.selectedStationLineFilter = station.lines[0];
  }

  dom.stationLineFilter.style.display = 'flex';

  let html = '';
  station.lines.forEach(line => {
    const isActive = STATE.selectedStationLineFilter === line;
    const col = STATE.colors[line] || '#0084c9';
    html += `
      <button class="filter-pill-btn ${isActive ? 'active' : ''}" data-line="${line}" style="--pill-color: ${col}">
        <span class="filter-pill-dot"></span>
        <span>Linha ${line}</span>
      </button>
    `;
  });

  dom.stationLineFilter.innerHTML = html;
  dom.stationLineFilter.querySelectorAll('.filter-pill-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.selectedStationLineFilter = btn.dataset.line;
      renderStationLineFilter();
      renderTrainCards();
    };
  });
}

// Active Station UI & Train Generation
async function updateActiveStationUI() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  dom.activeStationName.textContent = station.name;
  if (station.lines.length > 1) {
    dom.activeStationBadges.innerHTML = '';
    dom.activeStationBadges.style.display = 'none';
  } else {
    dom.activeStationBadges.style.display = 'flex';
    dom.activeStationBadges.innerHTML = station.lines.map(line => {
      return `<span class="line-badge ${line.toLowerCase()}">${line}</span>`;
    }).join('');
  }

  if (STATE.userLocation) {
    const dist = calculateDistance(
      STATE.userLocation.lat, STATE.userLocation.lon,
      station.lat, station.lon
    );
    dom.stationDistBadge.style.display = 'block';
    dom.stationDistBadge.innerHTML = dist < 1000 
      ? `<span>${Math.round(dist)}m</span>` 
      : `<span>${(dist / 1000).toFixed(1)}km</span>`;
  } else {
    dom.stationDistBadge.style.display = 'none';
  }

  if (dom.activeStationHero) {
    dom.activeStationHero.style.display = STATE.isServiceClosed ? 'none' : 'flex';
  }

  updateNetworkWaitingUI();
  renderStationLineFilter();

  // Instant local cache restore for this station (0ms response time)
  try {
    const cachedStation = localStorage.getItem(`nometro_trains_${STATE.selectedStationId}`);
    if (cachedStation) {
      const parsed = JSON.parse(cachedStation);
      if (parsed && Array.isArray(parsed.trains) && parsed.trains.length > 0) {
        parseRealTrains(parsed.trains);
      }
    }
  } catch (e) {}

  // 1. Render immediately with available or estimated trains (Zero delay)
  renderTrainCards();

  // 2. Fetch fresh telemetry in background and update smoothly
  fetchWaitTimes().then(() => {
    if (STATE.currentView === 'home' || STATE.currentView === 'next-train') {
      renderTrainCards();
    }
  });
}

async function fetchWaitTimes() {
  if (STATE.appMode === 'simulation' || STATE.appMode === 'delayed') {
    STATE.isServiceClosed = false;
    STATE.isWaitingForNetwork = false;
    updateNetworkWaitingUI();
    setupSimulatedTrains();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/tempo-espera/${STATE.selectedStationId}`).then(r => r.json());
    if (res && res.success && res.serviceStatus) {
      STATE.serviceStatus = res.serviceStatus;
      STATE.isServiceClosed = res.serviceStatus.isClosed;
      STATE.isWaitingForNetwork = false;
      updateNetworkWaitingUI();

      if (typeof res.serviceStatus.diffMs === 'number') {
        STATE.secondsUntilReopen = Math.floor(res.serviceStatus.diffMs / 1000);
      }

      if (!STATE.isServiceClosed && Array.isArray(res.trains) && res.trains.length > 0) {
        parseRealTrains(res.trains);
        try {
          localStorage.setItem(`nometro_trains_${STATE.selectedStationId}`, JSON.stringify({
            trains: res.trains,
            timestamp: Date.now()
          }));
        } catch (e) {}
      } else if (!STATE.isServiceClosed) {
        setupSimulatedTrains();
      }
    } else {
      if (!STATE.isServiceClosed && (!STATE.simulatedTrains || Object.keys(STATE.simulatedTrains).length === 0)) {
        setupSimulatedTrains();
      }
    }
  } catch (err) {
    console.warn('Instabilidade de rede ao obter tempos:', err.message);
    if (!STATE.isServiceClosed) {
      STATE.isWaitingForNetwork = true;
      updateNetworkWaitingUI();
      extrapolateOfflineTrains();
      if (!STATE.simulatedTrains || Object.keys(STATE.simulatedTrains).length === 0) {
        setupSimulatedTrains();
      }
    }
  }
}

function setupSimulatedTrains() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  station.lines.forEach(lineName => {
    ['dir1', 'dir2'].forEach(dirKey => {
      const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
      const isDelayed = (STATE.appMode === 'delayed' && lineName === 'Azul' && dirKey === 'dir1');

      if (!STATE.simulatedTrains[key] || isDelayed) {
        if (isDelayed) {
          STATE.simulatedTrains[key] = {
            secondsLeft: 705, // 11m 45s
            targetArrivalTime: Date.now() + (705 * 1000),
            initialSeconds: 780,
            subsequentMinutes: 14,
            isAffected: true
          };
        } else {
          if (!STATE.simulatedTrains[key] || STATE.simulatedTrains[key].isAffected) {
            const rSec = Math.floor(Math.random() * 120) + 60;
            STATE.simulatedTrains[key] = {
              secondsLeft: rSec,
              targetArrivalTime: Date.now() + (rSec * 1000),
              initialSeconds: 240,
              subsequentMinutes: 4,
              isAffected: false
            };
          }
        }
      }
    });
  });
}

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

function parseRealTrains(trainList) {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  station.lines.forEach(lineName => {
    ['dir1', 'dir2'].forEach(dirKey => {
      const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
      const terminals = STATE.lineTerminals[lineName] || {};
      const targetTerminal = (terminals[dirKey] || '').toLowerCase().trim();

      // Find matching train in live telemetry for this specific line and direction
      const match = trainList.find(t => {
        if (t.dirKey && t.lineName) {
          return t.dirKey === dirKey && t.lineName === lineName;
        }
        const destInfo = METRO_DESTINATIONS[String(t.destino)];
        if (destInfo) {
          return destInfo.line === lineName && destInfo.dirKey === dirKey;
        }
        const tDest = (t.destinationName || t.destino || '').toLowerCase().trim();
        return tDest === targetTerminal || tDest.includes(targetTerminal);
      });

      if (match) {
        const raw1 = match.seconds1 !== undefined && match.seconds1 !== null ? match.seconds1 : match.tempoChegada1;
        const sec1 = (raw1 !== '--' && raw1 !== null && raw1 !== undefined) ? parseInt(raw1, 10) : NaN;
        
        const raw2 = match.seconds2 !== undefined && match.seconds2 !== null ? match.seconds2 : match.tempoChegada2;
        const sec2 = (raw2 !== '--' && raw2 !== null && raw2 !== undefined) ? parseInt(raw2, 10) : NaN;

        if (!isNaN(sec1) && sec1 >= 0) {
          const prev = STATE.simulatedTrains[key];
          const initialSec = (prev && prev.initialSeconds && prev.initialSeconds > sec1)
            ? prev.initialSeconds
            : Math.max(sec1, 240);

          STATE.simulatedTrains[key] = {
            secondsLeft: sec1,
            targetArrivalTime: Date.now() + (sec1 * 1000),
            initialSeconds: initialSec,
            subsequentMinutes: (!isNaN(sec2) && sec2 > 0) ? Math.round(sec2 / 60) : 5,
            isAffected: false
          };
          STATE.lastSuccessfulSync = Date.now();
          return;
        }
      }

      // If no live telemetry exists for this direction yet:
      if (!STATE.simulatedTrains[key]) {
        STATE.simulatedTrains[key] = {
          secondsLeft: 180,
          targetArrivalTime: Date.now() + 180000,
          initialSeconds: 240,
          subsequentMinutes: 5,
          isAffected: false
        };
      }
    });
  });
}

function renderServiceClosedCard() {
  const secondsLeft = Math.max(0, STATE.secondsUntilReopen || 0);
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  
  const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  dom.trainDirectionsContainer.innerHTML = `
    <div class="service-closed-card">
      <h3 class="closed-card-title">${t('metroClosedTitle')}</h3>

      <div class="closed-main-countdown">
        <span class="closed-countdown-prefix">${t('metroReopensIn')}</span>
        <div class="closed-countdown-value" id="closed-countdown-val">
          <span class="digits">${timeFormatted}</span>
          <span class="seconds-unit">${String(s).padStart(2, '0')}s</span>
        </div>
        <div class="closed-countdown-sub">
          ${t('scheduledReopenPrefix')} <strong class="reopen-hour">06:30</strong>
        </div>
      </div>

      <div class="closed-footer-minimal">
        <span>${t('operatingHoursLabel')}: <strong>06:30 — 01:00</strong></span>
      </div>
    </div>
  `;
}

function updateClosedCountdownDisplay() {
  const container = document.getElementById('closed-countdown-val');
  if (!container) return;
  const secondsLeft = Math.max(0, STATE.secondsUntilReopen || 0);
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  container.innerHTML = `
    <span class="digits">${timeFormatted}</span>
    <span class="seconds-unit">${String(s).padStart(2, '0')}s</span>
  `;
}

function renderTrainCards() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  renderStationLineFilter();

  dom.trainDirectionsContainer.innerHTML = '';

  document.body.classList.toggle('service-closed', Boolean(STATE.isServiceClosed));
  if (dom.activeStationHero) {
    dom.activeStationHero.style.display = STATE.isServiceClosed ? 'none' : 'flex';
  }

  if (STATE.isServiceClosed) {
    renderServiceClosedCard();
    return;
  }

  station.lines.forEach(lineName => {
    // Multi-line filter: show only active line if station has multiple lines
    if (station.lines.length > 1 && STATE.selectedStationLineFilter && STATE.selectedStationLineFilter !== 'ALL' && STATE.selectedStationLineFilter !== lineName) {
      return;
    }

    const lineColor = (STATE.colors && STATE.colors[lineName]) || '#0084c9';
    const terminals = (STATE.lineTerminals && STATE.lineTerminals[lineName]) || { dir1: 'Terminal 1', dir2: 'Terminal 2' };
    const stationsOnLine = (STATE.lineOrders && STATE.lineOrders[lineName]) || [];
    const currentIndex = stationsOnLine.indexOf(STATE.selectedStationId);

    // Direction 1 (only if current station is not the destination terminal itself)
    const isAtDir1Terminal = station.name.toLowerCase().trim() === (terminals.dir1 || '').toLowerCase().trim();
    if (!isAtDir1Terminal) {
      const dir1Prev = (currentIndex > 0) ? STATE.stationsMap[stationsOnLine[currentIndex - 1]]?.name : t('prevStationDefault');
      renderCard({
        lineName,
        lineColor,
        dirKey: 'dir1',
        destination: terminals.dir1,
        targetName: station.name,
        prevName: dir1Prev
      });
    }

    // Direction 2 (only if current station is not the destination terminal itself)
    const isAtDir2Terminal = station.name.toLowerCase().trim() === (terminals.dir2 || '').toLowerCase().trim();
    if (!isAtDir2Terminal) {
      const dir2Prev = (currentIndex < stationsOnLine.length - 1) ? STATE.stationsMap[stationsOnLine[currentIndex + 1]]?.name : t('prevStationDefault');
      renderCard({
        lineName,
        lineColor,
        dirKey: 'dir2',
        destination: terminals.dir2,
        targetName: station.name,
        prevName: dir2Prev
      });
    }
  });
}

function renderCard({ lineName, lineColor, dirKey, destination, targetName, prevName }) {
  const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
  if (!STATE.simulatedTrains[key]) {
    STATE.simulatedTrains[key] = {
      secondsLeft: 120,
      targetArrivalTime: Date.now() + 120000,
      initialSeconds: 240,
      subsequentMinutes: 5,
      isAffected: false
    };
  }
  const train = STATE.simulatedTrains[key];

  const isLineDisrupted = STATE.lineStatuses && STATE.lineStatuses[lineName] && 
    (STATE.lineStatuses[lineName].status !== 'normal' || (STATE.lineStatuses[lineName].code && STATE.lineStatuses[lineName].code !== '0'));

  const isAffected = train.isAffected || 
    (STATE.appMode === 'delayed' && lineName === 'Azul' && dirKey === 'dir1') ||
    Boolean(isLineDisrupted);

  const minutes = Math.floor(train.secondsLeft / 60);
  const seconds = train.secondsLeft % 60;
  
  let timeStr = '';
  let isArriving = false;

  if (train.secondsLeft <= 30) {
    timeStr = t('arriving');
    isArriving = true;
  } else if (minutes === 0) {
    timeStr = `${seconds}s`;
  } else {
    timeStr = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  }

  const initial = train.initialSeconds || 240;
  const progressRatio = Math.max(0, Math.min(1, 1 - (train.secondsLeft / initial)));
  const progressPercent = Math.round(progressRatio * 92);

  const paragensText = isAffected
    ? t('delayedStatusText')
    : (train.secondsLeft <= 30 
        ? t('atStation') 
        : (minutes === 0 ? t('approaching') : (minutes === 1 ? t('stop1') : `${minutes} ${t('stops')}`)));

  const cardHtml = `
    <div class="train-direction-card ${isAffected ? 'service-affected' : ''}" id="card-${key}" style="--card-line-color: ${lineColor}">
      <div class="card-top">
        <div>
          <div class="direction-line-pill">${t('line')} ${lineName}</div>
          <div class="direction-title">${t('towards')} ${destination}</div>
        </div>
        <div class="card-right">
          ${isAffected ? `
            <span class="service-affected-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              ${t('serviceAffected')}
            </span>
          ` : ''}
          <div class="big-countdown ${isArriving ? 'arriving' : ''}" id="val-${key}">
            ${timeStr}
          </div>
        </div>
      </div>

      <!-- Minimal Flat Rail Track -->
      <div class="rail-track-box">
        <div class="rail-stations">
          <span>${prevName}</span>
          <span class="current"><svg class="pin-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>${targetName}</span>
        </div>

        <div class="rail-line">
          <div class="rail-fill" id="track-${key}" style="width: ${progressPercent}%;"></div>
          <div class="train-cursor" id="marker-${key}" style="left: ${progressPercent}%;">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="3"></rect>
            </svg>
          </div>
        </div>

        <div class="rail-footer">
          <span class="status-text ${isAffected ? 'status-affected-text' : ''}" id="status-${key}">
            ${paragensText}
          </span>
          <span class="next-train-box">${t('next')} <strong class="next-train-num">${train.subsequentMinutes}</strong> ${t('minutes')}</span>
        </div>
      </div>
    </div>
  `;

  dom.trainDirectionsContainer.insertAdjacentHTML('beforeend', cardHtml);
}

function tickTrains() {
  if (STATE.isServiceClosed) {
    if (STATE.secondsUntilReopen > 0) {
      STATE.secondsUntilReopen -= 1;
      updateClosedCountdownDisplay();
    } else {
      fetchWaitTimes();
    }
    return;
  }

  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  station.lines.forEach(lineName => {
    ['dir1', 'dir2'].forEach(dirKey => {
      const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
      const train = STATE.simulatedTrains[key];
      if (!train) return;

      if (train.targetArrivalTime) {
        train.secondsLeft = Math.max(0, Math.floor((train.targetArrivalTime - Date.now()) / 1000));
      } else if (train.secondsLeft > 0) {
        train.secondsLeft -= 1;
      }

      const valEl = document.getElementById(`val-${key}`);
      const trackEl = document.getElementById(`track-${key}`);
      const markerEl = document.getElementById(`marker-${key}`);
      const statusEl = document.getElementById(`status-${key}`);

      if (!valEl) return;

      const minutes = Math.floor(train.secondsLeft / 60);
      const seconds = train.secondsLeft % 60;

      const isLineDisrupted = STATE.lineStatuses && STATE.lineStatuses[lineName] && 
        (STATE.lineStatuses[lineName].status !== 'normal' || (STATE.lineStatuses[lineName].code && STATE.lineStatuses[lineName].code !== '0'));

      const isAffected = train.isAffected || 
        (STATE.appMode === 'delayed' && lineName === 'Azul' && dirKey === 'dir1') ||
        Boolean(isLineDisrupted);

      if (isAffected) {
        valEl.textContent = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
        valEl.className = 'big-countdown delayed';
        if (statusEl) statusEl.textContent = t('delayedStatusText');
      } else if (train.secondsLeft <= 30) {
        valEl.textContent = t('arriving');
        valEl.className = 'big-countdown arriving';
        if (statusEl) statusEl.textContent = t('atStation');
      } else if (minutes === 0) {
        valEl.textContent = `${seconds}s`;
        valEl.className = 'big-countdown';
        if (statusEl) statusEl.textContent = t('approaching');
      } else {
        valEl.textContent = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
        valEl.className = 'big-countdown';
        if (statusEl) {
          statusEl.textContent = (minutes === 1 ? t('stop1') : `${minutes} ${t('stops')}`);
        }
      }

      const initial = train.initialSeconds || 240;
      const progressRatio = Math.max(0, Math.min(1, 1 - (train.secondsLeft / initial)));
      const progressPercent = Math.round(progressRatio * 92);

      if (trackEl) trackEl.style.width = `${progressPercent}%`;
      if (markerEl) markerEl.style.left = `${progressPercent}%`;
    });
  });
}

// RENDER INLINE SCHEMATIC TRACK (PÁGINA REDE)
function renderSchematicTrack() {
  const lineName = STATE.selectedTimelineLine || 'Azul';
  const lineColor = STATE.colors[lineName] || '#0084c9';
  const terminals = STATE.lineTerminals[lineName] || { dir1: 'Term. 1', dir2: 'Term. 2' };
  const rawStationIds = STATE.lineOrders[lineName] || [];
  const statusData = STATE.lineStatuses ? STATE.lineStatuses[lineName] : null;
  const msgTrimmed = (statusData?.message || '').trim().toLowerCase();
  const statusTrimmed = (statusData?.status || '').trim().toLowerCase();
  const isNormalOrOk = !statusData || 
    statusTrimmed === 'normal' || 
    msgTrimmed === 'ok' || 
    msgTrimmed === 'normal' || 
    (statusTrimmed === 'encerrada' && (msgTrimmed === 'ok' || !msgTrimmed));

  // Update tabs active state
  dom.networkLineTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.line === lineName);
  });

  // Global Network Health Status
  let allLinesOk = true;
  if (STATE.lineStatuses) {
    for (const l in STATE.lineStatuses) {
      const st = STATE.lineStatuses[l];
      if (st) {
        const m = (st.message || '').trim().toLowerCase();
        const s = (st.status || '').trim().toLowerCase();
        if (s !== 'normal' && m !== 'ok' && m !== 'normal' && !(s === 'encerrada' && (m === 'ok' || !m))) {
          allLinesOk = false;
          break;
        }
      }
    }
  }
  if (dom.networkGlobalStatus && dom.networkGlobalStatusText) {
    dom.networkGlobalStatus.className = `network-global-status ${allLinesOk ? '' : 'perturbed'}`;
    dom.networkGlobalStatusText.textContent = allLinesOk ? t('allLinesNormal') : t('serviceAlert');
  }

  // Update banner card styling and content
  if (dom.lineBannerCard) {
    dom.lineBannerCard.style.setProperty('--banner-color', lineColor);
  }
  if (dom.bannerLineTag) {
    dom.bannerLineTag.textContent = `${t('line')} ${lineName}`;
  }
  if (dom.bannerTerminals) {
    dom.bannerTerminals.textContent = `${terminals.dir1} ↔ ${terminals.dir2}`;
  }
  if (dom.bannerStatusPill) {
    if (isNormalOrOk) {
      dom.bannerStatusPill.style.display = 'none';
    } else {
      dom.bannerStatusPill.style.display = 'inline-flex';
      dom.bannerStatusPill.className = 'banner-status-pill perturbed';
      dom.bannerStatusPill.textContent = statusData?.message?.trim() || 'Aviso';
    }
  }

  if (dom.chipStops) dom.chipStops.textContent = `${rawStationIds.length} ${t('stops')}`;

  // Update Direction Switcher Labels
  if (dom.dirLabelForward) dom.dirLabelForward.textContent = `➔ ${t('towardsPrefix')} ${terminals.dir2}`;
  if (dom.dirLabelBackward) dom.dirLabelBackward.textContent = `➔ ${t('towardsPrefix')} ${terminals.dir1}`;
  if (dom.dirBtnForward) dom.dirBtnForward.classList.toggle('active', STATE.networkDirection === 'forward');
  if (dom.dirBtnBackward) dom.dirBtnBackward.classList.toggle('active', STATE.networkDirection === 'backward');

  // Determine stations order based on direction
  let stationIds = (STATE.networkDirection === 'backward') 
    ? [...rawStationIds].reverse() 
    : [...rawStationIds];

  // Apply search query filter if user typed in network search
  if (STATE.networkSearchQuery) {
    const q = STATE.networkSearchQuery.toLowerCase();
    stationIds = stationIds.filter(id => {
      const s = STATE.stationsMap[id];
      return s && s.name.toLowerCase().includes(q);
    });
  }

  // Update vertical track container
  if (dom.schematicTrackContainer) {
    dom.schematicTrackContainer.style.setProperty('--banner-color', lineColor);

    if (stationIds.length === 0) {
      dom.schematicTrackContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          ${t('noStationFound')}
        </div>
      `;
      return;
    }

    dom.schematicTrackContainer.innerHTML = stationIds.map((id) => {
      const station = STATE.stationsMap[id];
      if (!station) return '';
      const isSelected = (id === STATE.selectedStationId);
      const isTerminal = (id === rawStationIds[0] || id === rawStationIds[rawStationIds.length - 1]);

      // Metro connecting lines badges
      const metroBadges = station.lines
        .filter(l => l !== lineName)
        .map(l => `<span class="badge-transfer-metro" style="background: ${STATE.colors[l] || '#8e8e93'};">${l}</span>`)
        .join('');

      // Other Transit Hub Badges (CP Comboio, Aeroporto, Barcos)
      const hub = TRANSIT_HUBS[id];
      const hubBadge = hub && hub.hubLabel 
        ? `<span class="badge-hub-icon">${hub.hubLabel}</span>` 
        : '';

      // Distance if GPS active
      let distBadge = '';
      if (STATE.userLocation) {
        const d = calculateDistance(STATE.userLocation.lat, STATE.userLocation.lon, station.lat, station.lon);
        distBadge = `<span class="station-subtitle-gps">${d < 1000 ? Math.round(d) + 'm' : (d/1000).toFixed(1) + 'km'}</span>`;
      }

      return `
        <div class="schematic-station-row ${isSelected ? 'current-active' : ''} ${isTerminal ? 'terminal-station' : ''}" data-id="${id}">
          <div class="station-node-dot"></div>
          <div class="station-row-info">
            <div class="station-title-group">
              <span class="station-row-title">${station.name}</span>
              ${distBadge}
            </div>
            <div class="station-transfer-badges">
              ${metroBadges}
              ${hubBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Clicking a station in the schematic opens the Station Detail Sheet!
    dom.schematicTrackContainer.querySelectorAll('.schematic-station-row').forEach(row => {
      row.addEventListener('click', () => {
        openStationSheet(row.dataset.id);
      });
    });
  }
}

// Station Detail Sheet (Action sheet modal in Rede)
function openStationSheet(stationId) {
  const station = STATE.stationsMap[stationId];
  if (!station) return;

  STATE.activeSheetStationId = stationId;

  // Header
  dom.sheetStationName.textContent = station.name;
  dom.sheetStationLines.innerHTML = station.lines.map(line => 
    `<span class="line-badge ${line.toLowerCase()}" style="font-size: 0.68rem;">${line}</span>`
  ).join('');

  // Connections
  const hub = TRANSIT_HUBS[stationId];
  let connHtml = '';
  if (station.lines.length > 1) {
    const otherLines = station.lines.map(l => `<span class="badge-transfer-metro" style="background: ${STATE.colors[l]}; font-size: 0.72rem;">Linha ${l}</span>`).join('');
    connHtml += otherLines;
  }
  if (hub && hub.hubLabel) {
    connHtml += `<span class="badge-hub-icon" style="font-size: 0.75rem; padding: 3px 8px;">${hub.hubLabel}</span>`;
  }
  dom.sheetConnections.innerHTML = connHtml || `<span style="font-size: 0.75rem; color: var(--text-muted);">Estação de rede standard</span>`;

  // Live countdowns for this station
  let trainRowsHtml = '';
  station.lines.forEach(line => {
    const terminals = STATE.lineTerminals[line] || { dir1: 'Sentido 1', dir2: 'Sentido 2' };
    
    trainRowsHtml += `
      <div class="sheet-train-row" id="sheet-row-${stationId}-${line}-dir1">
        <div class="sheet-train-dir">
          <span class="sheet-dir-name">${t('towards')} ${terminals.dir1}</span>
          <span class="sheet-dir-line">${t('line')} ${line}</span>
        </div>
        <span class="sheet-train-time" id="sheet-time-${stationId}-${line}-dir1">A carregar...</span>
      </div>
      <div class="sheet-train-row" id="sheet-row-${stationId}-${line}-dir2">
        <div class="sheet-train-dir">
          <span class="sheet-dir-name">${t('towards')} ${terminals.dir2}</span>
          <span class="sheet-dir-line">${t('line')} ${line}</span>
        </div>
        <span class="sheet-train-time" id="sheet-time-${stationId}-${line}-dir2">A carregar...</span>
      </div>
    `;
  });

  dom.sheetLiveTrains.innerHTML = trainRowsHtml;
  dom.stationDetailSheet.style.display = 'flex';

  // Fetch real telemetry for this sheet station
  fetch(`${API_BASE}/api/tempo-espera/${stationId}`)
    .then(r => r.json())
    .then(data => {
      if (!data || !data.success || !Array.isArray(data.trains)) return;
      if (STATE.activeSheetStationId !== stationId) return;

      station.lines.forEach(line => {
        ['dir1', 'dir2'].forEach(dirKey => {
          const match = data.trains.find(t => {
            if (t.dirKey && t.lineName) return t.dirKey === dirKey && t.lineName === line;
            const destInfo = METRO_DESTINATIONS[String(t.destino)];
            return destInfo && destInfo.line === line && destInfo.dirKey === dirKey;
          });

          const timeEl = document.getElementById(`sheet-time-${stationId}-${line}-${dirKey}`);
          if (!timeEl) return;

          if (match) {
            const raw = match.seconds1 !== undefined && match.seconds1 !== null ? match.seconds1 : match.tempoChegada1;
            const sec = (raw !== '--' && raw !== null && raw !== undefined) ? parseInt(raw, 10) : NaN;
            if (!isNaN(sec) && sec >= 0) {
              const m = Math.floor(sec / 60);
              const s = sec % 60;
              timeEl.textContent = sec <= 30 ? t('arriving') : (m > 0 ? `${m}m ${s < 10 ? '0' : ''}${s}s` : `${s}s`);
              return;
            }
          }
          timeEl.textContent = 'Sem dados';
        });
      });
    })
    .catch(() => {});
}

function closeStationSheet() {
  if (dom.stationDetailSheet) {
    dom.stationDetailSheet.style.display = 'none';
  }
  STATE.activeSheetStationId = null;
}

// Search & Select Station
function selectStation(stationId) {
  triggerHaptic('light');
  if (!STATE.stationsMap[stationId]) return;
  STATE.selectedStationId = stationId;
  STATE.selectedStationLineFilter = 'ALL';
  dom.stationSearch.value = '';
  dom.stationDropdown.style.display = 'none';
  dom.btnClearSearch.style.display = 'none';

  // Save last station and update recent searches
  try {
    localStorage.setItem('nometro_last_station', stationId);
    let recents = JSON.parse(localStorage.getItem('nometro_recent_stations') || '[]');
    recents = recents.filter(id => id !== stationId);
    recents.unshift(stationId);
    if (recents.length > 5) recents = recents.slice(0, 5);
    localStorage.setItem('nometro_recent_stations', JSON.stringify(recents));
  } catch (e) {}

  updateActiveStationUI();
}

function showRecentStationsDropdown() {
  if (dom.stationSearch.value.trim()) return;

  let recents = [];
  try {
    recents = JSON.parse(localStorage.getItem('nometro_recent_stations') || '[]');
  } catch (e) {}

  const lastStation = localStorage.getItem('nometro_last_station');
  if (recents.length === 0 && lastStation && STATE.stationsMap[lastStation]) {
    recents = [lastStation];
  }

  const validStations = recents
    .map(id => STATE.stationsMap[id])
    .filter(Boolean);

  let html = `
    <div class="dropdown-item dropdown-gps-item" id="dropdown-gps-trigger" style="border-bottom: 1px solid var(--border); font-weight: 600; color: #0a84ff; display: flex; align-items: center; gap: 8px; cursor: pointer;">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; pointer-events: none;">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      <span>Usar localização (estação mais próxima)</span>
    </div>
  `;

  if (validStations.length > 0) {
    html += `<div class="dropdown-header"><span>🕒</span> ${escapeHtml(t('recentStations'))}</div>`;
    html += validStations.map(s => {
      const dots = s.lines.map(line => `<span class="line-dot" style="background: ${STATE.colors[line] || '#888'};"></span>`).join('');
      return `
        <div class="dropdown-item" data-id="${escapeHtml(s.id)}">
          <span class="dropdown-station-name">${escapeHtml(s.name)}</span>
          <div class="dropdown-line-dots">${dots}</div>
        </div>
      `;
    }).join('');
  }

  dom.stationDropdown.innerHTML = html;
  dom.stationDropdown.style.display = 'block';

  const gpsTrigger = dom.stationDropdown.querySelector('#dropdown-gps-trigger');
  if (gpsTrigger) {
    gpsTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.stationDropdown.style.display = 'none';
      dom.stationSearch.blur();
      locateStation();
    });
  }

  dom.stationDropdown.querySelectorAll('.dropdown-item[data-id]').forEach(item => {
    item.addEventListener('click', () => selectStation(item.dataset.id));
  });
}

function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    dom.btnClearSearch.style.display = 'none';
    showRecentStationsDropdown();
    return;
  }

  dom.btnClearSearch.style.display = 'block';

  const matches = STATE.stations.filter(s => 
    s.name.toLowerCase().includes(query)
  ).slice(0, 6);

  if (matches.length === 0) {
    dom.stationDropdown.innerHTML = `<div class="dropdown-item" style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(t('noStationFound'))}</div>`;
    dom.stationDropdown.style.display = 'block';
    return;
  }

  dom.stationDropdown.innerHTML = matches.map(s => {
    const dots = s.lines.map(line => `<span class="line-dot" style="background: ${STATE.colors[line] || '#888'};"></span>`).join('');
    return `
      <div class="dropdown-item" data-id="${escapeHtml(s.id)}">
        <span class="dropdown-station-name">${escapeHtml(s.name)}</span>
        <div class="dropdown-line-dots">${dots}</div>
      </div>
    `;
  }).join('');

  dom.stationDropdown.style.display = 'block';

  dom.stationDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => selectStation(item.dataset.id));
  });
}

function showPermissionDeniedHelp() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    alert(
      "Acesso à localização bloqueado no Safari / iPhone.\n\n" +
      "Para encontrar a estação mais próxima:\n" +
      "1. Abra as Definições do seu iPhone\n" +
      "2. Vá a Safari > Localização (ou Privacidade e Segurança > Serviços de Localização)\n" +
      "3. Escolha 'Perguntar' ou 'Permitir'\n" +
      "4. Volte ao NoMetro e toque no botão azul de GPS."
    );
  } else {
    alert(
      "Acesso à localização bloqueado no navegador.\n\n" +
      "Para encontrar a estação mais próxima, toque no ícone de opções/cadeado na barra de endereço do navegador e ative a permissão de 'Localização'."
    );
  }
}

let isLocatingStation = false;

// Robust Geolocation Handler (High Accuracy with immediate Low Accuracy Fallback)
function locateUserStation(interactive = false) {
  if (isLocatingStation && interactive) return;

  if (!navigator.geolocation) {
    if (interactive) {
      alert('O seu telemóvel ou navegador não suporta geolocalização.');
    }
    return;
  }

  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    if (interactive) {
      alert('A geolocalização requer ligação segura (HTTPS). A recarregar em HTTPS...');
      location.href = location.href.replace('http:', 'https:');
    }
    return;
  }

  if (interactive && dom.btnGps) {
    dom.btnGps.classList.add('locating');
  }

  isLocatingStation = true;
  let finished = false;

  const onCoordsSuccess = (pos) => {
    if (finished) return;
    finished = true;
    isLocatingStation = false;
    if (dom.btnGps) dom.btnGps.classList.remove('locating');

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    STATE.userLocation = { lat, lon };

    if (!STATE.stations || STATE.stations.length === 0) return;

    let nearest = null;
    let minDistance = Infinity;

    STATE.stations.forEach(station => {
      const d = calculateDistance(lat, lon, station.lat, station.lon);
      if (d < minDistance) {
        minDistance = d;
        nearest = station;
      }
    });

    if (nearest) {
      // If user tapped GPS button or is in Lisbon area (< 40km)
      if (interactive || minDistance < 40000) {
        selectStation(nearest.id);
        if (STATE.currentView === 'network') {
          switchView('next-train');
        }
      } else {
        updateActiveStationUI();
      }
    }
  };

  const tryLowAccuracyFallback = () => {
    if (finished) return;
    navigator.geolocation.getCurrentPosition(
      onCoordsSuccess,
      (err2) => {
        if (finished) return;
        finished = true;
        isLocatingStation = false;
        if (dom.btnGps) dom.btnGps.classList.remove('locating');
        console.warn('Geolocation fallback error:', err2.code, err2.message);
        if (interactive) {
          if (err2.code === 1) { // PERMISSION_DENIED
            showPermissionDeniedHelp();
          } else {
            alert('Não foi possível obter a sua localização no momento. Verifique se o GPS está ativo e tente novamente.');
          }
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Attempt 1: High Accuracy (GPS hardware) with 5s timeout and 60s cache
  navigator.geolocation.getCurrentPosition(
    onCoordsSuccess,
    (err) => {
      console.warn('GPS high accuracy failed, trying cellular/wifi triangulation:', err.code, err.message);
      if (err.code === 1) {
        // User explicitly denied permission
        if (finished) return;
        finished = true;
        isLocatingStation = false;
        if (dom.btnGps) dom.btnGps.classList.remove('locating');
        if (interactive) {
          showPermissionDeniedHelp();
        }
        return;
      }
      // If timeout (code 3) or unavailable (code 2), immediately fallback to Wi-Fi/cellular
      tryLowAccuracyFallback();
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
  );
}

function autoLocateOnStartup() {
  locateUserStation(false);

  // iOS Safari User Gesture trigger: if startup prompt was suppressed because page loaded without user gesture,
  // trigger on the very first touch/click anywhere on the screen!
  const onFirstInteraction = () => {
    window.removeEventListener('touchstart', onFirstInteraction);
    window.removeEventListener('click', onFirstInteraction);
    if (!STATE.userLocation) {
      locateUserStation(false);
    }
  };
  window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
  window.addEventListener('click', onFirstInteraction, { once: true });
}

function locateStation() {
  triggerHaptic('medium');
  locateUserStation(true);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// Event Listeners
function setupEventListeners() {
  dom.stationSearch.addEventListener('input', handleSearch);
  dom.stationSearch.addEventListener('focus', showRecentStationsDropdown);
  dom.stationSearch.addEventListener('click', showRecentStationsDropdown);
  dom.btnClearSearch.addEventListener('click', () => {
    dom.stationSearch.value = '';
    dom.stationDropdown.style.display = 'none';
    dom.btnClearSearch.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.station-search-container')) {
      dom.stationDropdown.style.display = 'none';
    }
  });

  dom.btnGps.addEventListener('click', locateStation);
  if (dom.btnTheme) dom.btnTheme.addEventListener('click', toggleTheme);
  if (dom.btnLang) dom.btnLang.addEventListener('click', toggleLanguage);
  if (dom.btnModeToggle) dom.btnModeToggle.addEventListener('click', cycleMode);
  
  dom.btnRefresh.addEventListener('click', async () => {
    dom.btnRefresh.classList.add('refreshing');
    triggerHaptic('light');
    await fetchNetworkStatus();
    await fetchWaitTimes();
    renderSchematicTrack();
    renderTrainCards();
    setTimeout(() => dom.btnRefresh.classList.remove('refreshing'), 600);
  });

  // Bottom Nav Switcher (Metro vs Rede)
  dom.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });

  // Line Selector Tabs inside Rede view
  dom.networkLineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      STATE.selectedTimelineLine = tab.dataset.line;
      renderSchematicTrack();
    });
  });

  // Direction Switcher
  if (dom.dirBtnForward) {
    dom.dirBtnForward.addEventListener('click', () => {
      STATE.networkDirection = 'forward';
      renderSchematicTrack();
    });
  }
  if (dom.dirBtnBackward) {
    dom.dirBtnBackward.addEventListener('click', () => {
      STATE.networkDirection = 'backward';
      renderSchematicTrack();
    });
  }

  // Station Detail Sheet Handlers
  if (dom.sheetCloseBtn) {
    dom.sheetCloseBtn.addEventListener('click', closeStationSheet);
  }
  if (dom.stationDetailSheet) {
    dom.stationDetailSheet.addEventListener('click', (e) => {
      if (e.target === dom.stationDetailSheet) {
        closeStationSheet();
      }
    });
  }
  if (dom.sheetBtnSelect) {
    dom.sheetBtnSelect.addEventListener('click', () => {
      if (STATE.activeSheetStationId) {
        selectStation(STATE.activeSheetStationId);
        closeStationSheet();
        switchView('next-train');
      }
    });
  }

  // Mobile / Visibility Resync: refresh immediately upon unlocking phone or returning to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      extrapolateOfflineTrains();
      fetchWaitTimes();
      fetchNetworkStatus();
    }
  });

  // Online / Offline Detection
  window.addEventListener('online', () => {
    STATE.isWaitingForNetwork = false;
    updateNetworkWaitingUI();
    fetchWaitTimes();
    fetchNetworkStatus();
  });

  window.addEventListener('offline', () => {
    if (!STATE.isServiceClosed) {
      STATE.isWaitingForNetwork = true;
      updateNetworkWaitingUI();
      extrapolateOfflineTrains();
    }
  });

  // Keep safe area insets updated on rotation / viewport shifts
  window.addEventListener('resize', updateSafeAreaInsets, { passive: true });
  window.addEventListener('orientationchange', updateSafeAreaInsets, { passive: true });
}

function updateSafeAreaInsets() {
  try {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      const screenH = Math.max(window.screen.height, window.screen.width);
      const safeTop = screenH >= 852 ? 54 : (screenH >= 812 ? 47 : 20);
      document.documentElement.style.setProperty('--safe-area-top-fallback', safeTop + 'px');
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  updateSafeAreaInsets();
  init();
});
