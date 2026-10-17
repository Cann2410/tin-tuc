// === 1. DỮ LIỆU DỰ PHÒNG TỰ ĐỘNG CHỐNG TRẮNG TRANG ===
const DEFAULT_MENU = [
  { "id": "home", "title": "Home", "type": "home" },
  { "id": "Dân trí 360", "title": "Dân trí 360", "type": "external" },
  { "id": "Mới nhất", "title": "Mới nhất", "type": "category" },
  { "id": "Thế giới", "title": "Thế giới", "type": "category" },
  { "id": "Thời sự", "title": "Thời sự", "type": "category" }
];

const DEFAULT_POSTS = [
  {
    "id": "dtri-20261017001",
    "title": "Loạt đề xuất mới về biển báo, khoảng cách đặt biển cảnh báo trên cao tốc",
    "slug": "loat-de-xuat-moi-ve-bien-bao-khoang-cach-dat-bien-canh-bao-tren-cao-toc",
    "excerpt": "(Dân trí) - Cục Đường bộ Việt Nam đề xuất nhiều thay đổi về biển báo, đèn tín hiệu, khoảng cách đặt biển cảnh báo và hệ thống chỉ dẫn trên đường cao tốc.",
    "content": "Cục Đường bộ Việt Nam vừa hoàn thiện bản dự thảo đề xuất quy chuẩn mới về hệ thống biển báo giao thông trên đường cao tốc...\n\nCác quy định mới nhằm đảm bảo an toàn giao thông cho các phương tiện khi lưu thông với tốc độ cao.",
    "thumbnail": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
    "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
    "author": "Văn Hưng",
    "category": "Thời sự",
    "categoryId": "Thời sự",
    "publishedAt": "2026-10-14 23:30",
    "source": "dantri.com.vn",
    "url": "https://dantri.com.vn/thoi-su/loat-de-xuat-moi.htm"
  },
  {
    "id": "dtri-202610142339",
    "title": "Phu nhân Ngô Phương Ly và Phu nhân Tổng thống Thụy Sĩ thăm Đại học Dược",
    "slug": "phu-nhan-ngo-phuong-ly-va-phu-nhan-tong-thong-thuy-si-tham-dai-hoc-duoc",
    "excerpt": "(Dân trí) - Trong khuôn khổ chuyến thăm chính thức, hai phu nhân đã ghé thăm trường Đại học Dược Hà Nội.",
    "content": "Chuyến thăm góp phần thắt chặt tình đoàn kết và mở ra nhiều cơ hội hợp tác đào tạo y dược giữa hai quốc gia...",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop",
    "image": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop",
    "author": "Đức Anh",
    "category": "Thế giới",
    "categoryId": "Thế giới",
    "publishedAt": "2026-10-17 21:33",
    "source": "dantri.com.vn",
    "url": "https://dantri.com.vn/the-gioi/phu-nhan-tham-truong.htm"
  }
];

// Lấy dữ liệu an toàn từ LocalStorage
function getCategories() {
  try {
    const data = JSON.parse(localStorage.getItem('categories'));
    return (data && Array.isArray(data) && data.length > 0) ? data : DEFAULT_MENU;
  } catch (e) {
    return DEFAULT_MENU;
  }
}

function getPosts() {
  try {
    const data = JSON.parse(localStorage.getItem('posts'));
    return (data && Array.isArray(data) && data.length > 0) ? data : DEFAULT_POSTS;
  } catch (e) {
    return DEFAULT_POSTS;
  }
}

function savePostToStorage(newPost) {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === newPost.id);
  if (index >= 0) {
    posts[index] = newPost;
  } else {
    posts.unshift(newPost);
  }
  localStorage.setItem('posts', JSON.stringify(posts));
}

// Đọc thêm từ file JSON ngầm
async function initDataFromFiles() {
  try {
    if (!localStorage.getItem('categories')) {
      const res = await fetch('./data/menu.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.menu) {
          localStorage.setItem('categories', JSON.stringify(data.menu));
          renderNavbar();
        }
      }
    }
  } catch (e) {}

  try {
    if (!localStorage.getItem('posts')) {
      const res = await fetch('./data/posts.json');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          localStorage.setItem('posts', JSON.stringify(data));
          renderCategory('home');
        }
      }
    }
  } catch (e) {}
}

// === 2. GIAO DIỆN NAVBAR ===
function renderNavbar() {
  const categories = getCategories();
  const navMenuEl = document.getElementById('navbarMenu');
  const footerCatEl = document.getElementById('footerCategories');

  let navHtml = '';
  let footerHtml = '';

  categories.forEach(cat => {
    if (cat.children && cat.children.length > 0) {
      let subHtml = `<ul class="dropdown-menu">`;
      cat.children.forEach(child => {
        subHtml += `<li><a onclick="renderCategory('${child.id}')">${child.title}</a></li>`;
      });
      subHtml += `</ul>`;

      navHtml += `
        <li class="has-dropdown">
          <a onclick="renderCategory('${cat.id}')" id="nav-${cat.id}">${cat.title} ▾</a>
          ${subHtml}
        </li>
      `;
    } else {
      navHtml += `<li><a onclick="renderCategory('${cat.id}')" id="nav-${cat.id}">${cat.title}</a></li>`;
    }
    footerHtml += `<li><a onclick="renderCategory('${cat.id}')">${cat.title}</a></li>`;
  });

  navHtml += `<li><a onclick="renderCrawlerPage()" class="btn-crawler">Crawler Page</a></li>`;

  if (navMenuEl) navMenuEl.innerHTML = navHtml;
  if (footerCatEl) footerCatEl.innerHTML = footerHtml;
}

// === 3. TẠO KHUNG BÀI VIẾT BẤT HỦ ===
function createGridHtml(postsList) {
  if (!postsList || postsList.length === 0) return '';

  const featuredLarge = postsList[0];
  const featuredSmall = postsList.slice(1, 3);

  let html = `<div class="featured-grid">`;

  if (featuredLarge) {
    const defaultImg = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop";
    const rawExcerpt = featuredLarge.excerpt || '';
    const excerptText = rawExcerpt.startsWith('(Dân trí)') ? rawExcerpt : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
    const imgUrl = featuredLarge.thumbnail || featuredLarge.image || defaultImg;

    html += `
      <div class="card-clean" onclick="renderArticleDetail('${featuredLarge.id}')">
        <img src="${imgUrl}" class="card-img-large" alt="thumb">
        <div class="card-category-green">${(featuredLarge.category || 'THỜI SỰ').toUpperCase()}</div>
        <h3 class="card-title-large-green">${featuredLarge.title}</h3>
        <p class="card-excerpt-clean">${excerptText}</p>
      </div>
    `;
  }

  html += `<div class="featured-small-group">`;
  featuredSmall.forEach(post => {
    const defaultImgSmall = "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop";
    const imgUrlSmall = post.thumbnail || post.image || defaultImgSmall;

    html += `
      <div class="card-clean" onclick="renderArticleDetail('${post.id}')">
        <img src="${imgUrlSmall}" class="card-img-small" alt="thumb">
        <h4 class="card-title-small-clean">${post.title}</h4>
        <div class="card-time-clean">${post.publishedAt || ''}</div>
      </div>
    `;
  });
  html += `</div></div>`;

  return html;
}

// === 4. TRANG CHỦ & TRANG CHUYÊN MỤC ===
function renderCategory(catId = 'home') {
  const app = document.getElementById('appView');
  if (!app) return;

  const posts = getPosts();
  document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

  const activeNav = document.getElementById(`nav-${catId}`);
  if (activeNav) activeNav.classList.add('active');

  posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (catId === 'home') {
    let html = `<h2 class="section-title">Tin mới nhất</h2>`;
    html += createGridHtml(posts.slice(0, 3));

    const listPosts = posts.slice(3, 10);
    if (listPosts.length > 0) {
      html += `<div class="recent-list">`;
      listPosts.forEach(post => {
        const rawExcerpt = post.excerpt || '';
        const excerptText = rawExcerpt.startsWith('(Dân trí)') ? rawExcerpt : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
        const defaultImgList = "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=600&auto=format&fit=crop";
        const imgUrl = post.thumbnail || post.image || defaultImgList;

        html += `
          <div class="list-item" onclick="renderArticleDetail('${post.id}')">
            <img src="${imgUrl}" class="list-item-img" alt="thumb">
            <div class="list-content">
              <div class="card-category-green">${(post.category || '').toUpperCase()}</div>
              <h4 class="list-item-title">${post.title}</h4>
              <p class="list-item-excerpt">${excerptText}</p>
              <div class="list-item-meta">${post.publishedAt || ''} ${post.author ? '· ' + post.author : ''}</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    const sectionCategories = ['Thế giới', 'Thời sự', 'Pháp luật', 'Sức khỏe', 'Đời sống', 'Du lịch', 'Kinh doanh', 'Bất động sản', 'Thể thao'];
    sectionCategories.forEach(catName => {
      const catPosts = posts.filter(p => p.category && (p.category.toLowerCase().includes(catName.toLowerCase()) || p.categoryId === catName));
      if (catPosts.length > 0) {
        html += `
          <div class="category-block">
            <h3 class="category-section-title" onclick="renderCategory('${catName}')">${catName.toUpperCase()} <span class="arrow">&gt;</span></h3>
            ${createGridHtml(catPosts)}
          </div>
        `;
      }
    });

    app.innerHTML = html;
    return;
  }

  let targetTitle = catId.toUpperCase();
  let filteredPosts = posts.filter(p => p.category && (p.category.toLowerCase().includes(catId.toLowerCase()) || p.categoryId === catId));

  let html = `<h2 class="section-title">${targetTitle}</h2>`;
  if (filteredPosts.length === 0) {
    app.innerHTML = html + `<p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này.</p>`;
    return;
  }

  html += createGridHtml(filteredPosts.slice(0, 3));

  const remaining = filteredPosts.slice(3);
  if (remaining.length > 0) {
    html += `<div class="recent-list" style="margin-top:20px;">`;
    remaining.forEach(post => {
      const rawExcerpt = post.excerpt || '';
      const excerptText = rawExcerpt.startsWith('(Dân trí)') ? rawExcerpt : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
      const defaultImgList = "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=600&auto=format&fit=crop";

      html += `
        <div class="list-item" onclick="renderArticleDetail('${post.id}')">
          <img src="${post.thumbnail || post.image || defaultImgList}" class="list-item-img" alt="thumb">
          <div class="list-content">
            <div class="card-category-green">${(post.category || '').toUpperCase()}</div>
            <h4 class="list-item-title">${post.title}</h4>
            <p class="list-item-excerpt">${excerptText}</p>
            <div class="list-item-meta">${post.publishedAt || ''} ${post.author ? '· ' + post.author : ''}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  app.innerHTML = html;
}

// === 5. TRANG CHI TIẾT BÀI VIẾT ===
function renderArticleDetail(postId) {
  const app = document.getElementById('appView');
  if (!app) return;

  const posts = getPosts();
  const article = posts.find(p => p.id === postId);

  if (!article) {
    app.innerHTML = `<h2>Bài viết không tồn tại</h2>`;
    return;
  }

  const rawExcerpt = article.excerpt || '';
  const sapoText = rawExcerpt.startsWith('(Dân trí)') ? rawExcerpt : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');

  app.innerHTML = `
    <div class="article-detail">
      <h1 class="article-title-main">${article.title}</h1>
      <div class="article-meta-info">
        <span>Tác giả: <b>${article.author || 'Dân trí'}</b></span> · 
        <span>Đăng ngày: ${article.publishedAt || ''}</span> · 
        <span style="color:#008837; font-weight:bold;">Chuyên mục: ${article.category || ''}</span>
      </div>
      <p class="article-sapo-main">${sapoText}</p>
      ${(article.thumbnail || article.image) ? `<img src="${article.thumbnail || article.image}" class="detail-main-img" alt="thumb">` : ''}
      <div class="article-content-body">${article.content || ''}</div>
      <br><hr><br>
      <button onclick="renderCategory('home')" style="background:#6c757d; border:none; color:#fff; padding:8px 16px; border-radius:4px; cursor:pointer;">&larr; Quay lại trang chủ</button>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 6. TRANG CRAWLER TIN TỨC ===
function renderCrawlerPage() {
  const app = document.getElementById('appView');
  if (!app) return;

  document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

  app.innerHTML = `
    <div class="crawler-box">
      <h2 class="section-title">Crawler tin tức</h2>
      <p class="crawler-desc">Nhập URL một bài viết trên dantri.com.vn, hệ thống sẽ lấy nội dung, chuẩn hóa thành JSON và lưu vào LocalStorage.</p>
      
      <div class="crawl-input-group">
        <input type="text" id="crawlUrl" placeholder="https://dantri.com.vn/bat-dong-san/ha-noi-tinh-co-che-boi-thuong-dat-dac-biet-cho-7-du-an-duong-sat-20260928122246655.htm">
        <button class="btn-crawl" onclick="handleCrawl()">Crawl</button>
      </div>

      <details class="fallback-accordion">
        <summary>► Cách dự phòng: nếu bấm Crawl bị lỗi, dán mã nguồn HTML của bài viết vào đây</summary>
        <div class="fallback-content">
          <textarea id="rawHtmlInput" rows="6" placeholder="Dán toàn bộ mã nguồn HTML của bài viết Dân trí vào đây..."></textarea>
          <button class="btn-crawl" style="margin-top: 10px;" onclick="handleCrawlFromHtml()">Phân tích HTML & Lưu</button>
        </div>
      </details>

      <div id="crawlSuccessAlert" class="alert-success" style="display:none;">
        Đã cập nhật bài viết vào LocalStorage. Xem tại trang chủ / chuyên mục <span id="alertCatName" style="font-weight:bold;"></span>.
      </div>

      <pre class="json-preview" id="jsonPreview" style="display:none;"></pre>

      <div class="local-storage-section">
        <h3 class="local-storage-title">Bài mới nhất trong LocalStorage</h3>
        <div id="localStorageList" class="local-storage-list"></div>
        <button class="btn-reset-data" onclick="resetDefaultData()">Reset dữ liệu mẫu</button>
      </div>
    </div>
  `;

  renderLocalStorageList();
}

function renderLocalStorageList() {
  const container = document.getElementById('localStorageList');
  if (!container) return;

  const posts = getPosts();
  if (posts.length === 0) {
    container.innerHTML = '<p style="padding: 10px 0; color: #777;">Chưa có bài viết nào trong LocalStorage.</p>';
    return;
  }

  let html = '';
  posts.forEach(post => {
    html += `
      <div class="ls-item" onclick="renderArticleDetail('${post.id}')">
        <span class="ls-title">${post.title}</span>
        <span class="ls-category">${post.category || 'Thời sự'}</span>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function handleCrawl() {
  const urlInput = document.getElementById('crawlUrl').value.trim();
  const alertBox = document.getElementById('crawlSuccessAlert');
  const alertCatName = document.getElementById('alertCatName');
  const jsonPreview = document.getElementById('jsonPreview');

  if (!urlInput) {
    alert("Vui lòng nhập đường dẫn URL bài viết!");
    return;
  }

  alertBox.style.display = "none";
  jsonPreview.style.display = "none";

  const result = await getArticle(urlInput);

  if (result) {
    savePostToStorage(result);

    alertCatName.innerText = result.category || 'Thời sự';
    alertBox.style.display = "block";

    jsonPreview.innerText = JSON.stringify(result, null, 2);
    jsonPreview.style.display = "block";

    renderLocalStorageList();
  }
}

function handleCrawlFromHtml() {
  const htmlText = document.getElementById('rawHtmlInput').value.trim();
  const urlInput = document.getElementById('crawlUrl').value.trim() || 'https://dantri.com.vn/';
  const alertBox = document.getElementById('crawlSuccessAlert');
  const alertCatName = document.getElementById('alertCatName');
  const jsonPreview = document.getElementById('jsonPreview');

  if (!htmlText) {
    alert("Vui lòng dán mã nguồn HTML bài viết vào đây!");
    return;
  }

  if (htmlText.startsWith('http://') || htmlText.startsWith('https://')) {
    alert("Bạn đang dán URL thay vì mã HTML!");
    return;
  }

  try {
    let article = null;
    if (typeof parseDantriDom === 'function') {
      article = parseDantriDom(htmlText, urlInput);
    }

    if (article) {
      savePostToStorage(article);

      alertCatName.innerText = article.category || 'Thời sự';
      alertBox.style.display = "block";
      jsonPreview.innerText = JSON.stringify(article, null, 2);
      jsonPreview.style.display = "block";

      renderLocalStorageList();
    }
  } catch (e) {
    alert("Mã nguồn HTML không hợp lệ!");
  }
}

async function resetDefaultData() {
  if (confirm("Bạn có chắc chắn muốn reset lại dữ liệu mẫu ban đầu?")) {
    localStorage.removeItem('posts');
    localStorage.removeItem('categories');
    renderNavbar();
    renderCategory('home');
    if (document.getElementById('localStorageList')) {
      renderCrawlerPage();
    }
  }
}

// KHỞI CHẠY KHÔNG CẦN CHỜ
function initApp() {
  renderNavbar();
  renderCategory('home');
  initDataFromFiles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
