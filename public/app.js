// ========================================================
// NoMetro • Lisboa - Controller (Inline Rede Page & Tab Bar)
// ========================================================

const I18N = {
  pt: {
    searchPlaceholder: 'Buscar estação...',
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
    minutes: 'minutos',
    prevStationDefault: 'Estação Anterior',
    tabMetro: 'Metro',
    tabNetwork: 'Rede',
    normalStatus: 'Normal',
    allLinesNormal: 'Circulação Normal',
    serviceAlert: 'Com Avisos',
    noStationFound: 'Nenhuma estação encontrada',
    frequency: 'Frequência ~4 min',
    activeStationTag: 'Ativa',
    networkTitle: 'Rede do Metro',
    networkSubtitle: 'Linhas, paragens e correspondências',
    filterStationPlaceholder: 'Filtrar estação na linha...',
    towardsPrefix: 'Para',
    openInMainView: 'Ver no Próximo Metro',
    interchanges: 'correspondências',
    close: 'Fechar'
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
    minutes: 'minutes',
    prevStationDefault: 'Previous Station',
    tabMetro: 'Metro',
    tabNetwork: 'Network',
    normalStatus: 'Normal',
    allLinesNormal: 'Normal Service',
    serviceAlert: 'Service Alerts',
    noStationFound: 'No station found',
    frequency: 'Frequency ~4 min',
    activeStationTag: 'Active',
    networkTitle: 'Metro Network',
    networkSubtitle: 'Lines, stops and transfers',
    filterStationPlaceholder: 'Filter station in line...',
    towardsPrefix: 'To',
    openInMainView: 'Open in Next Train',
    interchanges: 'transfers',
    close: 'Close'
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

const STATE = {
  stations: [],
  stationsMap: {},
  lineOrders: {},
  lineTerminals: {},
  colors: {
    Azul: '#0084c9',
    Amarela: '#ffbe00',
    Verde: '#00a650',
    Vermelha: '#e52329'
  },
  selectedStationId: 'MP', // Default: Marquês de Pombal
  selectedTimelineLine: 'Azul',
  currentView: 'next-train',
  simulationMode: true,
  currentTheme: localStorage.getItem('nometro_theme') || 'dark',
  currentLang: localStorage.getItem('nometro_lang') || 'pt',
  userLocation: null,
  simulatedTrains: {},
  networkDirection: 'forward', // 'forward' or 'backward'
  networkSearchQuery: '',
  activeSheetStationId: null
};

function t(key) {
  return I18N[STATE.currentLang][key] || key;
}

// DOM Elements
const dom = {
  viewNextTrain: document.getElementById('view-next-train'),
  viewNetwork: document.getElementById('view-network'),
  activeStationName: document.getElementById('active-station-name'),
  activeStationBadges: document.getElementById('active-station-badges'),
  stationDistBadge: document.getElementById('station-dist-badge'),
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
  chipFrequency: document.getElementById('chip-frequency'),
  chipInterchange: document.getElementById('chip-interchange'),
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

// Theme Switcher
function applyTheme(theme) {
  STATE.currentTheme = theme;
  localStorage.setItem('nometro_theme', theme);

  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (dom.themeIconMoon) dom.themeIconMoon.style.display = 'none';
    if (dom.themeIconSun) dom.themeIconSun.style.display = 'block';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (dom.themeIconMoon) dom.themeIconMoon.style.display = 'block';
    if (dom.themeIconSun) dom.themeIconSun.style.display = 'none';
  }
}

function toggleTheme() {
  const nextTheme = STATE.currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
}

// Language Switcher
function applyLanguage(lang) {
  STATE.currentLang = lang;
  localStorage.setItem('nometro_lang', lang);

  if (dom.langLabel) dom.langLabel.textContent = I18N[lang].langToggle;
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

  updateActiveStationUI();
  renderSchematicTrack();
}

function toggleLanguage() {
  const nextLang = STATE.currentLang === 'pt' ? 'en' : 'pt';
  applyLanguage(nextLang);
}

// View Switcher (Metro vs Rede)
function switchView(viewName) {
  STATE.currentView = viewName;
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (viewName === 'network') {
    dom.viewNextTrain.style.display = 'none';
    dom.viewNetwork.style.display = 'block';
    dom.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === 'network'));
    renderSchematicTrack();
  } else {
    dom.viewNextTrain.style.display = 'block';
    dom.viewNetwork.style.display = 'none';
    dom.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === 'next-train'));
  }
}

// Initialize
async function init() {
  setupEventListeners();
  applyTheme(STATE.currentTheme);
  applyLanguage(STATE.currentLang);

  try {
    const stationsRes = await fetch('/api/estacoes').then(r => r.json());
    if (stationsRes.success) {
      STATE.stations = stationsRes.stations;
      STATE.lineOrders = stationsRes.lineOrders;
      STATE.lineTerminals = stationsRes.lineTerminals;
      if (stationsRes.colors) STATE.colors = stationsRes.colors;

      stationsRes.stations.forEach(s => {
        STATE.stationsMap[s.id] = s;
      });
    }

    await fetchNetworkStatus();
    updateActiveStationUI();
    renderSchematicTrack();
  } catch (err) {
    console.error('Init error:', err);
  }

  setInterval(tickTrains, 1000);
  setInterval(async () => {
    await fetchNetworkStatus();
  }, 12000);
}

// Fetch Lines Status
async function fetchNetworkStatus() {
  try {
    const res = await fetch('/api/status').then(r => r.json());
    if (res.success && res.lines) {
      STATE.lineStatuses = res.lines;
      renderSchematicTrack();
    }
  } catch (e) {
    console.error(e);
  }
}

// Active Station UI & Train Generation
function updateActiveStationUI() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  dom.activeStationName.textContent = station.name;
  dom.activeStationBadges.innerHTML = station.lines.map(line => {
    return `<span class="line-badge ${line.toLowerCase()}">${line}</span>`;
  }).join('');

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

  initTrainCountdowns();
  renderTrainCards();
}

function initTrainCountdowns() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  station.lines.forEach(lineName => {
    const key1 = `${STATE.selectedStationId}-${lineName}-dir1`;
    const key2 = `${STATE.selectedStationId}-${lineName}-dir2`;

    if (!STATE.simulatedTrains[key1]) {
      STATE.simulatedTrains[key1] = {
        secondsLeft: Math.floor(Math.random() * 120) + 30,
        initialSeconds: 220,
        subsequentMinutes: Math.floor(Math.random() * 3) + 4
      };
    }
    if (!STATE.simulatedTrains[key2]) {
      STATE.simulatedTrains[key2] = {
        secondsLeft: Math.floor(Math.random() * 150) + 20,
        initialSeconds: 240,
        subsequentMinutes: Math.floor(Math.random() * 3) + 5
      };
    }
  });
}

function renderTrainCards() {
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  dom.trainDirectionsContainer.innerHTML = '';

  station.lines.forEach(lineName => {
    const lineColor = STATE.colors[lineName] || '#0084c9';
    const terminals = STATE.lineTerminals[lineName] || { dir1: 'Terminal 1', dir2: 'Terminal 2' };
    const stationsOnLine = STATE.lineOrders[lineName] || [];
    const currentIndex = stationsOnLine.indexOf(STATE.selectedStationId);

    // Direction 1
    const dir1Prev = (currentIndex > 0) ? STATE.stationsMap[stationsOnLine[currentIndex - 1]]?.name : t('prevStationDefault');
    renderCard({
      lineName,
      lineColor,
      dirKey: 'dir1',
      destination: terminals.dir1,
      targetName: station.name,
      prevName: dir1Prev
    });

    // Direction 2
    const dir2Prev = (currentIndex < stationsOnLine.length - 1) ? STATE.stationsMap[stationsOnLine[currentIndex + 1]]?.name : t('prevStationDefault');
    renderCard({
      lineName,
      lineColor,
      dirKey: 'dir2',
      destination: terminals.dir2,
      targetName: station.name,
      prevName: dir2Prev
    });
  });
}

function renderCard({ lineName, lineColor, dirKey, destination, targetName, prevName }) {
  const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
  const train = STATE.simulatedTrains[key] || { secondsLeft: 120, initialSeconds: 240, subsequentMinutes: 5 };

  const minutes = Math.floor(train.secondsLeft / 60);
  const seconds = train.secondsLeft % 60;
  
  let timeStr = '';
  let isArriving = false;

  if (train.secondsLeft <= 12) {
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

  const paragensText = train.secondsLeft <= 15 
    ? t('atStation') 
    : (minutes === 0 ? t('approaching') : (minutes === 1 ? t('stop1') : `${minutes} ${t('stops')}`));

  const cardHtml = `
    <div class="train-direction-card" id="card-${key}" style="--card-line-color: ${lineColor}">
      <div class="card-top">
        <div>
          <div class="direction-line-pill">${t('line')} ${lineName}</div>
          <div class="direction-title">${t('towards')} ${destination}</div>
        </div>
        <div class="big-countdown ${isArriving ? 'arriving' : ''}" id="val-${key}">
          ${timeStr}
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
          <span class="status-text" id="status-${key}">
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
  const station = STATE.stationsMap[STATE.selectedStationId];
  if (!station) return;

  station.lines.forEach(lineName => {
    ['dir1', 'dir2'].forEach(dirKey => {
      const key = `${STATE.selectedStationId}-${lineName}-${dirKey}`;
      const train = STATE.simulatedTrains[key];
      if (!train) return;

      if (train.secondsLeft > 0) {
        train.secondsLeft -= 1;
      } else {
        train.secondsLeft = Math.floor(Math.random() * 90) + 180;
        train.initialSeconds = train.secondsLeft;
        train.subsequentMinutes = Math.floor(Math.random() * 3) + 4;
      }

      const valEl = document.getElementById(`val-${key}`);
      const trackEl = document.getElementById(`track-${key}`);
      const markerEl = document.getElementById(`marker-${key}`);
      const statusEl = document.getElementById(`status-${key}`);

      if (!valEl) return;

      const minutes = Math.floor(train.secondsLeft / 60);
      const seconds = train.secondsLeft % 60;

      if (train.secondsLeft <= 12) {
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
  const isOk = !statusData || (statusData.status === 'normal' || statusData.message === 'Ok');

  // Update tabs active state
  dom.networkLineTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.line === lineName);
  });

  // Global Network Health Status
  let allLinesOk = true;
  if (STATE.lineStatuses) {
    for (const l in STATE.lineStatuses) {
      const st = STATE.lineStatuses[l];
      if (st && st.status !== 'normal' && st.message !== 'Ok') {
        allLinesOk = false;
        break;
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
    dom.bannerStatusPill.className = `banner-status-pill ${isOk ? 'ok' : 'perturbed'}`;
    dom.bannerStatusPill.textContent = isOk ? t('normalStatus') : (statusData?.message || 'Aviso');
  }

  // Meta chips (stations count, frequency, interchange count)
  let interchangeCount = 0;
  rawStationIds.forEach(id => {
    const s = STATE.stationsMap[id];
    if (s && (s.lines.length > 1 || TRANSIT_HUBS[id])) interchangeCount++;
  });

  if (dom.chipStops) dom.chipStops.textContent = `${rawStationIds.length} ${t('stops')}`;
  if (dom.chipFrequency) dom.chipFrequency.textContent = t('frequency');
  if (dom.chipInterchange) dom.chipInterchange.textContent = `${interchangeCount} ${t('interchanges')}`;

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

  // Simulated train positions on the line for dynamic liveliness
  const timeStep = Math.floor(Date.now() / 20000);
  const trainIndex1 = timeStep % Math.max(1, rawStationIds.length);
  const trainStationId1 = rawStationIds[trainIndex1];

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
      const hasTrain = (id === trainStationId1 || (isSelected && STATE.currentView === 'network'));

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

      const trainBadgeHtml = hasTrain 
        ? `<div class="schematic-train-badge"><span class="train-pulse-dot"></span>~2 min</div>`
        : '';

      return `
        <div class="schematic-station-row ${isSelected ? 'current-active' : ''} ${isTerminal ? 'terminal-station' : ''}" data-id="${id}">
          <div class="station-node-dot"></div>
          <div class="station-row-info">
            <div class="station-title-group">
              <span class="station-row-title">${station.name}</span>
              ${distBadge}
            </div>
            <div class="station-transfer-badges">
              ${isSelected ? `<span class="dist-pill" style="font-size: 0.65rem; padding: 2px 7px;">${t('activeStationTag')}</span>` : ''}
              ${trainBadgeHtml}
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
    
    // Generate realistic or simulated countdown for both directions
    let sec1 = 120 + ((station.name.charCodeAt(0) * 17) % 240);
    let sec2 = 60 + ((station.name.charCodeAt(1 || 0) * 23) % 320);

    const m1 = Math.floor(sec1 / 60);
    const s1 = sec1 % 60;
    const m2 = Math.floor(sec2 / 60);
    const s2 = sec2 % 60;

    trainRowsHtml += `
      <div class="sheet-train-row">
        <div class="sheet-train-dir">
          <span class="sheet-dir-name">${t('towards')} ${terminals.dir1}</span>
          <span class="sheet-dir-line">${t('line')} ${line}</span>
        </div>
        <span class="sheet-train-time">${m1 > 0 ? `${m1}m ${s1 < 10 ? '0' : ''}${s1}s` : `${s1}s`}</span>
      </div>
      <div class="sheet-train-row">
        <div class="sheet-train-dir">
          <span class="sheet-dir-name">${t('towards')} ${terminals.dir2}</span>
          <span class="sheet-dir-line">${t('line')} ${line}</span>
        </div>
        <span class="sheet-train-time">${m2 > 0 ? `${m2}m ${s2 < 10 ? '0' : ''}${s2}s` : `${s2}s`}</span>
      </div>
    `;
  });

  dom.sheetLiveTrains.innerHTML = trainRowsHtml;
  dom.stationDetailSheet.style.display = 'flex';
}

function closeStationSheet() {
  if (dom.stationDetailSheet) {
    dom.stationDetailSheet.style.display = 'none';
  }
  STATE.activeSheetStationId = null;
}

// Search & Select Station
function selectStation(stationId) {
  if (!STATE.stationsMap[stationId]) return;
  STATE.selectedStationId = stationId;
  dom.stationSearch.value = '';
  dom.stationDropdown.style.display = 'none';
  dom.btnClearSearch.style.display = 'none';
  updateActiveStationUI();
}

function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    dom.stationDropdown.style.display = 'none';
    dom.btnClearSearch.style.display = 'none';
    return;
  }

  dom.btnClearSearch.style.display = 'block';

  const matches = STATE.stations.filter(s => 
    s.name.toLowerCase().includes(query)
  ).slice(0, 6);

  if (matches.length === 0) {
    dom.stationDropdown.innerHTML = `<div class="dropdown-item" style="color: var(--text-muted); font-size: 0.85rem;">${t('noStationFound')}</div>`;
    dom.stationDropdown.style.display = 'block';
    return;
  }

  dom.stationDropdown.innerHTML = matches.map(s => {
    const dots = s.lines.map(line => `<span class="line-dot" style="background: ${STATE.colors[line]};"></span>`).join('');
    return `
      <div class="dropdown-item" data-id="${s.id}">
        <span class="dropdown-station-name">${s.name}</span>
        <div class="dropdown-line-dots">${dots}</div>
      </div>
    `;
  }).join('');

  dom.stationDropdown.style.display = 'block';

  dom.stationDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => selectStation(item.dataset.id));
  });
}

// Locate Nearest Station (GPS)
function locateStation() {
  if (!navigator.geolocation) return;

  dom.btnGps.classList.add('locating');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      dom.btnGps.classList.remove('locating');
      STATE.userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };

      let nearest = null;
      let minDistance = Infinity;

      STATE.stations.forEach(station => {
        const d = calculateDistance(STATE.userLocation.lat, STATE.userLocation.lon, station.lat, station.lon);
        if (d < minDistance) {
          minDistance = d;
          nearest = station;
        }
      });

      if (nearest) {
        selectStation(nearest.id);
        if (STATE.currentView === 'network') {
          switchView('next-train');
        }
      }
    },
    () => { 
      dom.btnGps.classList.remove('locating');
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
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
  
  dom.btnRefresh.addEventListener('click', async () => {
    dom.btnRefresh.classList.add('refreshing');
    await fetchNetworkStatus();
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
}

document.addEventListener('DOMContentLoaded', init);
