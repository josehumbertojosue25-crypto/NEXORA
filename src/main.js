import './style.css';

document.querySelector('#app').innerHTML = `
  <div class="browser">
    <header class="topbar">
      <div class="brand">
        <div class="logo">N</div>
        <div>
          <h1>NEXORA <span>JH</span></h1>
          <small>YOUR WORLD. ONE TAP AWAY.</small>
        </div>
      </div>
      <button class="icon-btn" id="themeBtn" aria-label="Alternar tema">☾</button>
    </header>

    <main>
      <section class="hero">
        <div class="orb orb-one"></div>
        <div class="orb orb-two"></div>
        <div class="hero-content">
          <div class="status"><span></span> YOUR NEXT DESTINATION</div>
          <h2>Explore beyond<br><span>limits.</span></h2>
          <p>O teu mundo digital começa aqui.</p>

          <form id="searchForm" class="search-box">
            <span class="search-icon">⌕</span>
            <input id="searchInput" type="text"
              placeholder="Pesquisar ou introduzir endereço..."
              autocomplete="off" required>
            <button type="submit">➜</button>
          </form>

          <div class="search-options">
            <span>Pesquisa rápida</span>
            <span>•</span>
            <span>Experiência simples</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <h3>Os teus atalhos</h3>
            <p>Os teus destinos favoritos, sempre perto.</p>
          </div>
          <span class="section-tag">QUICK ACCESS</span>
        </div>

        <div class="shortcuts">
          <button class="shortcut" data-url="https://www.google.com">
            <span class="shortcut-icon google">G</span>
            <span>Google</span>
          </button>
          <button class="shortcut" data-url="https://www.youtube.com">
            <span class="shortcut-icon youtube">▶</span>
            <span>YouTube</span>
          </button>
          <button class="shortcut" data-url="https://www.facebook.com">
            <span class="shortcut-icon facebook">f</span>
            <span>Facebook</span>
          </button>
          <button class="shortcut" data-url="https://www.wikipedia.org">
            <span class="shortcut-icon wiki">W</span>
            <span>Wikipedia</span>
          </button>
          <button class="shortcut" data-url="https://www.github.com">
            <span class="shortcut-icon github">⌘</span>
            <span>GitHub</span>
          </button>
          <button class="shortcut" data-url="https://www.tiktok.com">
            <span class="shortcut-icon tiktok">♪</span>
            <span>TikTok</span>
          </button>
        </div>
      </section>

      <section class="feature-grid">
        <article class="feature-card">
          <div class="feature-icon">◈</div>
          <h4>Privacidade</h4>
          <p>Controla a tua experiência de navegação.</p>
          <span class="feature-label">PRIVACY FIRST</span>
        </article>
        <article class="feature-card">
          <div class="feature-icon">↧</div>
          <h4>Downloads</h4>
          <p>Prepara o teu espaço para os teus ficheiros.</p>
          <span class="feature-label">YOUR FILES</span>
        </article>
        <article class="feature-card">
          <div class="feature-icon">✦</div>
          <h4>Experiência</h4>
          <p>Uma interface limpa, moderna e confortável.</p>
          <span class="feature-label">MADE FOR YOU</span>
        </article>
      </section>

      <footer>
        <div class="footer-brand"><span>N</span> NEXORA JH</div>
        <p>Your World. One Tap Away.</p>
        <span class="version">VERSION 1.0</span>
      </footer>
    </main>
  </div>
`;

const form = document.querySelector('#searchForm');
const input = document.querySelector('#searchInput');

function normalizeUrl(value) {
  const query = value.trim();
  if (!query) return null;

  if (/^https?:\\/\\//i.test(query)) return query;

  if (/^(localhost|[\\w-]+\\.)+[a-z]{2,}([/:?#].*)?$/i.test(query)) {
    return `https://${query}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = normalizeUrl(input.value);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
});

document.querySelectorAll('[data-url]').forEach((button) => {
  button.addEventListener('click', () => {
    window.open(button.dataset.url, '_blank', 'noopener,noreferrer');
  });
});

document.querySelector('#themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const light = document.body.classList.contains('light-mode');
  document.querySelector('#themeBtn').textContent = light ? '☀' : '☾';
  localStorage.setItem('nexora-theme', light ? 'light' : 'dark');
});

if (localStorage.getItem('nexora-theme') === 'light') {
  document.body.classList.add('light-mode');
  document.querySelector('#themeBtn').textContent = '☀';
}
