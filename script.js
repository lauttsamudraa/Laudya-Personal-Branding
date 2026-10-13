/* =============================================
   PORTFOLIO SCRIPT — Modal + Gallery Slider
   ============================================= */

/* ── MOBILE NAV ── */
function toggleMenu() {
  const nav = document.getElementById('mobileNav');
  nav.classList.toggle('open');
}

/* ── FILTER CARDS ── */
function filterCards(category, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show/hide cards
  document.querySelectorAll('.project-card').forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    card.classList.toggle('hidden', !match);
  });
}

/* ══════════════════════════════════════════
   MODAL GALLERY STATE
══════════════════════════════════════════ */
let currentSlide = 0;
let totalSlides  = 0;

// Touch / swipe state
let touchStartX = 0;
let touchEndX   = 0;
const SWIPE_THRESHOLD = 50; // px

/* ── OPEN MODAL ── */
function openModal(card) {
  const overlay = document.getElementById('modalOverlay');

  // ── Pull data from card attributes ──
  const title     = card.dataset.title     || '';
  const meta      = card.dataset.meta      || '';
  const badge     = card.dataset.badge     || '';
  const desc      = card.dataset.desc      || '';
  const tagsRaw   = card.dataset.tags      || '';
  const link      = card.dataset.link      || '#';
  const linkLabel = card.dataset.linkLabel || 'Lihat Proyek';
  const imagesRaw = card.dataset.images    || '';
  const placeholder = card.dataset.placeholder || '📁';

  // ── Parse images (pipe-separated) ──
  const images = imagesRaw
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // ── Parse tags (pipe-separated) ──
  const tags = tagsRaw
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // ── Populate text content ──
  document.getElementById('modalBadge').textContent = badge;
  document.getElementById('modalMeta').textContent  = meta;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent  = desc;

  // Tags
  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');

  // Footer link
  const footerEl = document.getElementById('modalFooter');
  if (link && link !== '#') {
    footerEl.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-primary">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        ${linkLabel}
      </a>`;
  } else {
    footerEl.innerHTML = '';
  }

  // ── Build gallery slides ──
  buildGallery(images, placeholder);

  // ── Show overlay ──
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── BUILD GALLERY ── */
function buildGallery(images, placeholder) {
  const slidesEl  = document.getElementById('gallerySlides');
  const dotsEl    = document.getElementById('galleryDots');
  const counterEl = document.getElementById('slideCounter');
  const prevBtn   = document.getElementById('arrowPrev');
  const nextBtn   = document.getElementById('arrowNext');
  const hintEl    = document.getElementById('swipeHint');

  slidesEl.innerHTML = '';
  dotsEl.innerHTML   = '';
  currentSlide = 0;

  if (images.length === 0) {
    // No images — show placeholder only
    slidesEl.innerHTML = `
      <div class="gallery-slide">
        <div class="slide-placeholder">${placeholder}</div>
      </div>`;
    totalSlides = 1;
    dotsEl.innerHTML = '';
    counterEl.style.display  = 'none';
    prevBtn.style.display    = 'none';
    nextBtn.style.display    = 'none';
    hintEl.style.display     = 'none';
    slidesEl.style.transform = 'translateX(0)';
    return;
  }

  totalSlides = images.length;

  // Create slides
  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    slide.innerHTML = `
      <img src="${src}" alt="Slide ${i + 1}"
           onerror="this.style.display='none'; this.parentElement.insertAdjacentHTML('beforeend','<div class=\\'slide-placeholder\\'>${placeholder}</div>');" />`;
    slidesEl.appendChild(slide);
  });

  // Create dots
  images.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
  });

  // Show/hide arrows & counter
  const multi = totalSlides > 1;
  prevBtn.style.display   = multi ? 'flex' : 'none';
  nextBtn.style.display   = multi ? 'flex' : 'none';
  counterEl.style.display = multi ? 'block' : 'none';
  hintEl.style.display    = multi ? 'block' : 'none';

  // Reset position
  slidesEl.style.transform = 'translateX(0)';
  updateGalleryUI();

  // Attach touch/swipe events to gallery
  attachSwipeEvents();
}

/* ── GO TO SPECIFIC SLIDE ── */
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  currentSlide = index;
  document.getElementById('gallerySlides').style.transform =
    `translateX(-${currentSlide * 100}%)`;
  updateGalleryUI();
}

/* ── SLIDE BY DELTA (+1 / -1) ── */
function slideGallery(direction) {
  goToSlide(currentSlide + direction);
}

/* ── UPDATE DOTS & COUNTER & ARROWS ── */
function updateGalleryUI() {
  // Dots
  document.querySelectorAll('#galleryDots .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  // Counter
  document.getElementById('slideCounter').textContent =
    `${currentSlide + 1} / ${totalSlides}`;

  // Arrows
  document.getElementById('arrowPrev').disabled = currentSlide === 0;
  document.getElementById('arrowNext').disabled = currentSlide === totalSlides - 1;
}

/* ── SWIPE SUPPORT ── */
function attachSwipeEvents() {
  const gallery = document.getElementById('modalGallery');

  // Remove old listeners by cloning
  const freshGallery = gallery.cloneNode(true);

  // Re-attach named buttons (cloneNode breaks inline onclick on dynamic elements)
  // Instead, use addEventListener on the original element after stripping old ones
  gallery.addEventListener('touchstart', onTouchStart, { passive: true });
  gallery.addEventListener('touchend',   onTouchEnd,   { passive: true });

  // Mouse drag support (desktop)
  gallery.addEventListener('mousedown',  onMouseDown);
  gallery.addEventListener('mouseup',    onMouseUp);
}

function onTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}
function onTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

let mouseDownX = 0;
function onMouseDown(e) {
  mouseDownX = e.clientX;
}
function onMouseUp(e) {
  const diff = mouseDownX - e.clientX;
  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    slideGallery(diff > 0 ? 1 : -1);
  }
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    slideGallery(diff > 0 ? 1 : -1);
  }
}

/* ── KEYBOARD NAVIGATION ── */
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay.classList.contains('open')) return;

  if (e.key === 'ArrowLeft')  slideGallery(-1);
  if (e.key === 'ArrowRight') slideGallery(1);
  if (e.key === 'Escape')     closeModal();
});

/* ── CLOSE MODAL ── */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── CLICK OUTSIDE TO CLOSE ── */
function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
}

function toggleModalVideo() {
  const vid = document.getElementById('modalVideo');
  if (!vid.src) return;
  if (vid.paused) { vid.play(); } else { vid.pause(); }
}
 
function toggleMute() {
  const vid = document.getElementById('modalVideo');
  vid.muted = !vid.muted;
  setMuteIcon(vid.muted);
}
 
function seekVideo(e) {
  const vid  = document.getElementById('modalVideo');
  const bar  = document.getElementById('vcProgress');
  const rect = bar.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (vid.duration) vid.currentTime = pct * vid.duration;
}
 
function updateProgress(vid) {
  if (!vid.duration) return;
  const pct = (vid.currentTime / vid.duration) * 100;
  document.getElementById('vcFill').style.width = pct + '%';
  document.getElementById('vcTime').textContent =
    `${fmtTime(vid.currentTime)} / ${fmtTime(vid.duration)}`;
}
 
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
 
function setPlayIcon(playing) {
  document.getElementById('vcPlayIcon').innerHTML = playing
    ? '<rect x="6" y="4" width="4" height="16" fill="white"/><rect x="14" y="4" width="4" height="16" fill="white"/>'
    : '<polygon points="5,3 19,12 5,21" fill="white"/>';
}
 
function setMuteIcon(muted) {
  document.getElementById('vcMuteIcon').innerHTML = muted
    ? '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="white"/><line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>'
    : '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="white"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" fill="none" stroke-width="2" stroke-linecap="round"/>';
}
 
function stopModalVideo() {
  const vid = document.getElementById('modalVideo');
  vid.pause();
  vid.src = '';
  vid.load();
}