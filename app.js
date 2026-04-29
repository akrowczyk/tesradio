// TESRADIO - vanilla JS radio player

const STORAGE_KEY = 'tesradio.v2';

const DEFAULT_STATIONS = [
  {
    id: 'beach-1055',
    name: 'Beach 105.5',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WBHUFM.mp3',
    genre: 'WBHU · Adult hits · St. Augustine, FL',
    emoji: '🏖️',
    color: '#06b6d4',
  },
  {
    id: 'wsos-1039',
    name: 'WSOS 103.9',
    url: 'https://stream.surfernetwork.com/rfahthcep9jtv',
    genre: 'Classic hits · 60s · 70s · 80s · St. Augustine, FL',
    emoji: '🎙️',
    color: '#f59e0b',
  },
];

// ---------- State ----------
let stations = loadStations();
let currentId = localStorage.getItem(STORAGE_KEY + '.current') || null;
let isPlaying = false;
let isLoading = false;
let isMuted = false;
let lastVolume = 0.8;
let searchQuery = '';

// ---------- Elements ----------
const audio = document.getElementById('audio');
const $ = (id) => document.getElementById(id);

const els = {
  ambient: $('ambient'),
  brandMark: document.querySelector('.brand-mark'),
  nowPlaying: $('nowPlaying'),
  art: $('art'),
  artEmoji: $('artEmoji'),
  stationName: $('stationName'),
  stationGenre: $('stationGenre'),
  live: $('live'),
  playBtn: $('playBtn'),
  playIcon: $('playIcon'),
  pauseIcon: $('pauseIcon'),
  loadIcon: $('loadIcon'),
  prevBtn: $('prevBtn'),
  nextBtn: $('nextBtn'),
  muteBtn: $('muteBtn'),
  volIcon: $('volIcon'),
  muteIcon: $('muteIcon'),
  volSlider: $('volSlider'),
  volPct: $('volPct'),
  stationList: $('stationList'),
  searchInput: $('searchInput'),
  addBtn: $('addBtn'),
  fullscreenBtn: $('fullscreenBtn'),
  modal: $('modal'),
  modalTitle: $('modalTitle'),
  modalClose: $('modalClose'),
  cancelBtn: $('cancelBtn'),
  deleteBtn: $('deleteBtn'),
  stationForm: $('stationForm'),
  fId: $('fId'),
  fName: $('fName'),
  fUrl: $('fUrl'),
  fGenre: $('fGenre'),
  fEmoji: $('fEmoji'),
  fColor: $('fColor'),
};

// ---------- Storage ----------
function loadStations() {
  const dismissedKey = STORAGE_KEY + '.dismissedDefaults';
  let dismissed = [];
  try { dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]'); } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY + '.stations');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        const existing = new Set(parsed.map((s) => s.id));
        const dismissedSet = new Set(dismissed);
        const newDefaults = DEFAULT_STATIONS.filter(
          (d) => !existing.has(d.id) && !dismissedSet.has(d.id)
        );
        return [...parsed, ...newDefaults];
      }
    }
  } catch (e) {}
  return [...DEFAULT_STATIONS];
}

function saveStations() {
  localStorage.setItem(STORAGE_KEY + '.stations', JSON.stringify(stations));
}

function saveVolume(v) {
  localStorage.setItem(STORAGE_KEY + '.volume', String(v));
}

function loadVolume() {
  const v = parseFloat(localStorage.getItem(STORAGE_KEY + '.volume') || '0.8');
  return isNaN(v) ? 0.8 : v;
}

// ---------- Render ----------
function getCurrent() {
  return stations.find((s) => s.id === currentId) || null;
}

function setStationColor(color) {
  document.documentElement.style.setProperty('--station-color', color || '#7c5cff');
}

function renderNowPlaying() {
  const s = getCurrent();
  if (!s) {
    els.stationName.textContent = 'Select a station';
    els.stationGenre.textContent = 'Tap a station from the list to start playing';
    els.artEmoji.textContent = '📡';
    els.art.style.background = 'linear-gradient(135deg, #333, #ffffff10)';
    setStationColor('#7c5cff');
    return;
  }
  els.stationName.textContent = s.name;
  els.stationGenre.textContent = s.genre || '';
  els.artEmoji.textContent = s.emoji || '📡';
  els.art.style.background = `linear-gradient(135deg, ${s.color}, #ffffff10)`;
  setStationColor(s.color);
}

function renderStations() {
  const q = searchQuery.trim().toLowerCase();
  const list = stations.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || (s.genre || '').toLowerCase().includes(q)
  );

  if (!list.length) {
    els.stationList.innerHTML = `<li class="empty">${
      q ? 'No matches.' : 'No stations yet. Tap "Add Station" to begin.'
    }</li>`;
    return;
  }

  els.stationList.innerHTML = list
    .map(
      (s) => `
    <li class="station-item ${s.id === currentId ? 'active' : ''}"
        data-id="${s.id}"
        style="--st-color:${escapeAttr(s.color)}">
      <div class="now-playing-indicator"></div>
      <div class="station-thumb">${escapeHtml(s.emoji || '📡')}</div>
      <div class="station-info">
        <div class="station-info-name">${escapeHtml(s.name)}</div>
        <div class="station-info-genre">${escapeHtml(s.genre || '')}</div>
      </div>
      <div class="station-actions">
        <button data-action="edit" data-id="${s.id}" aria-label="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
      </div>
    </li>`
    )
    .join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function setPlayUI(state) {
  // state: 'play' | 'paused' | 'load'
  els.playIcon.style.display = 'none';
  els.pauseIcon.style.display = 'none';
  els.loadIcon.style.display = 'none';
  if (state === 'play') els.pauseIcon.style.display = 'block';
  else if (state === 'load') els.loadIcon.style.display = 'block';
  else els.playIcon.style.display = 'block';

  els.nowPlaying.classList.toggle('playing', state === 'play');
}

// ---------- Playback ----------
function playStation(id) {
  const s = stations.find((x) => x.id === id);
  if (!s) return;
  const switching = currentId !== id;
  currentId = id;
  localStorage.setItem(STORAGE_KEY + '.current', id);

  renderNowPlaying();
  renderStations();

  if (switching || audio.src !== s.url) {
    audio.src = s.url;
    audio.load();
  }
  isLoading = true;
  setPlayUI('load');
  audio.play().catch((err) => {
    console.error('Playback failed:', err);
    isLoading = false;
    isPlaying = false;
    setPlayUI('paused');
    els.stationGenre.textContent = 'Could not play this stream — check the URL.';
  });
}

function togglePlay() {
  const s = getCurrent();
  if (!s) {
    if (stations.length) playStation(stations[0].id);
    return;
  }
  if (isPlaying) {
    audio.pause();
  } else {
    if (!audio.src) audio.src = s.url;
    isLoading = true;
    setPlayUI('load');
    audio.play().catch((err) => {
      console.error('Playback failed:', err);
      isLoading = false;
      setPlayUI('paused');
    });
  }
}

function step(delta) {
  if (!stations.length) return;
  const idx = Math.max(0, stations.findIndex((s) => s.id === currentId));
  const next = (idx + delta + stations.length) % stations.length;
  playStation(stations[next].id);
}

function setVolume(v) {
  v = Math.max(0, Math.min(1, v));
  audio.volume = v;
  if (v > 0) {
    isMuted = false;
    lastVolume = v;
    saveVolume(v);
  }
  els.volSlider.value = String(Math.round(v * 100));
  els.volPct.textContent = String(Math.round(v * 100));
  els.volSlider.style.setProperty('--vol', `${Math.round(v * 100)}%`);
  els.volIcon.style.display = v === 0 ? 'none' : 'block';
  els.muteIcon.style.display = v === 0 ? 'block' : 'none';
}

function toggleMute() {
  if (audio.volume > 0) {
    lastVolume = audio.volume;
    setVolume(0);
    isMuted = true;
  } else {
    setVolume(lastVolume || 0.8);
    isMuted = false;
  }
}

// ---------- Modal ----------
function openModal(station) {
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
  if (station) {
    els.modalTitle.textContent = 'Edit Station';
    els.fId.value = station.id;
    els.fName.value = station.name;
    els.fUrl.value = station.url;
    els.fGenre.value = station.genre || '';
    els.fEmoji.value = station.emoji || '';
    els.fColor.value = station.color || '#7c5cff';
    els.deleteBtn.style.display = 'block';
  } else {
    els.modalTitle.textContent = 'Add Station';
    els.stationForm.reset();
    els.fId.value = '';
    els.fColor.value = '#7c5cff';
    els.deleteBtn.style.display = 'none';
  }
  setTimeout(() => els.fName.focus(), 50);
}

function closeModal() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
}

function saveFromForm(e) {
  e.preventDefault();
  const id = els.fId.value || `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const data = {
    id,
    name: els.fName.value.trim(),
    url: els.fUrl.value.trim(),
    genre: els.fGenre.value.trim(),
    emoji: els.fEmoji.value.trim() || '📡',
    color: els.fColor.value || '#7c5cff',
  };
  if (!data.name || !data.url) return;

  const existingIdx = stations.findIndex((s) => s.id === id);
  if (existingIdx >= 0) stations[existingIdx] = data;
  else stations.push(data);

  saveStations();
  renderStations();
  if (currentId === id) renderNowPlaying();
  closeModal();
}

function deleteCurrent() {
  const id = els.fId.value;
  if (!id) return;
  if (!confirm('Delete this station?')) return;
  stations = stations.filter((s) => s.id !== id);
  saveStations();
  if (DEFAULT_STATIONS.some((d) => d.id === id)) {
    const key = STORAGE_KEY + '.dismissedDefaults';
    let dismissed = [];
    try { dismissed = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    if (!dismissed.includes(id)) dismissed.push(id);
    localStorage.setItem(key, JSON.stringify(dismissed));
  }
  if (currentId === id) {
    audio.pause();
    audio.src = '';
    currentId = null;
    localStorage.removeItem(STORAGE_KEY + '.current');
    renderNowPlaying();
  }
  renderStations();
  closeModal();
}

// ---------- Events ----------
els.playBtn.addEventListener('click', togglePlay);
els.prevBtn.addEventListener('click', () => step(-1));
els.nextBtn.addEventListener('click', () => step(1));
els.muteBtn.addEventListener('click', toggleMute);
els.volSlider.addEventListener('input', (e) => setVolume(e.target.value / 100));
els.searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderStations();
});

els.stationList.addEventListener('click', (e) => {
  const editBtn = e.target.closest('button[data-action="edit"]');
  if (editBtn) {
    e.stopPropagation();
    const s = stations.find((x) => x.id === editBtn.dataset.id);
    if (s) openModal(s);
    return;
  }
  const item = e.target.closest('.station-item');
  if (item) playStation(item.dataset.id);
});

els.addBtn.addEventListener('click', () => openModal(null));
els.modalClose.addEventListener('click', closeModal);
els.cancelBtn.addEventListener('click', closeModal);
els.deleteBtn.addEventListener('click', deleteCurrent);
els.stationForm.addEventListener('submit', saveFromForm);
els.modal.addEventListener('click', (e) => {
  if (e.target === els.modal) closeModal();
});

els.fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.();
  }
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.code === 'ArrowRight') step(1);
  else if (e.code === 'ArrowLeft') step(-1);
  else if (e.code === 'ArrowUp') { e.preventDefault(); setVolume(audio.volume + 0.05); }
  else if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(audio.volume - 0.05); }
  else if (e.key === 'm' || e.key === 'M') toggleMute();
  else if (e.key === 'Escape') closeModal();
});

// Audio events
audio.addEventListener('playing', () => {
  isPlaying = true;
  isLoading = false;
  setPlayUI('play');
});
audio.addEventListener('pause', () => {
  isPlaying = false;
  isLoading = false;
  setPlayUI('paused');
});
audio.addEventListener('waiting', () => {
  isLoading = true;
  setPlayUI('load');
});
audio.addEventListener('error', () => {
  isPlaying = false;
  isLoading = false;
  setPlayUI('paused');
  els.stationGenre.textContent = 'Stream error — try another station.';
});
audio.addEventListener('stalled', () => setPlayUI('load'));

// Media Session API (lock screen / car controls)
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', togglePlay);
  navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
  navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
}

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const s = getCurrent();
  if (!s) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s.name,
    artist: 'TESRADIO',
    album: s.genre || '',
  });
}

audio.addEventListener('playing', updateMediaSession);

// ---------- Init ----------
setVolume(loadVolume());
renderStations();
renderNowPlaying();

// If we have a previously selected station, preload but don't autoplay (browsers block it)
if (currentId) {
  const s = getCurrent();
  if (s) audio.src = s.url;
}
