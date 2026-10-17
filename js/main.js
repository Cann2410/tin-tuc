
// === 1. DỮ LIỆU DỰ PHÒNG MẶC ĐỊNH ===
const DEFAULT_MENU = [
    { "id": "home", "title": "Home", "type": "home" },
    { "id": "Thời sự", "title": "Thời sự", "type": "category" },
    { "id": "Thế giới", "title": "Thế giới", "type": "category" },
    { "id": "Bất động sản", "title": "Bất động sản", "type": "category" },
    { "id": "Thể thao", "title": "Thể thao", "type": "category" }
];

const DEFAULT_POSTS = [
    {
        "id": "dtri-20261017001",
        "title": "Loạt đề xuất mới về biển báo, khoảng cách đặt biển cảnh báo trên cao tốc",
        "slug": "loat-de-xuat-moi-ve-bien-bao-khoang-cach-dat-bien-canh-bao-tren-cao-toc",
        "excerpt": "(Dân trí) - Cục Đường bộ Việt Nam đề xuất nhiều thay đổi về biển báo, đèn tín hiệu, khoảng cách đặt biển cảnh báo và hệ thống chỉ dẫn trên đường cao tốc.",
        "content": "Cục Đường bộ Việt Nam vừa hoàn thiện bản dự thảo đề xuất quy chuẩn mới về hệ thống biển báo giao thông trên đường cao tốc.\n\nMột trong những nội dung trọng tâm là việc quy định khoảng cách tối thiểu từ biển cảnh báo đến vị trí sự cố hoặc công trường thi công trên đường cao tốc nhằm giúp tài xế chủ động giảm tốc độ an toàn.",
        "thumbnail": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
        "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
        "author": "Văn Hưng",
        "category": "Thời sự",
        "categoryId": "Thời sự",
        "publishedAt": "2026-10-14 23:30",
        "source": "dantri.com.vn",
        "url": "https://dantri.com.vn/thoi-su/loat-de-xuat-moi.htm"
    }
];

// === 2. HÀM QUẢN LÝ LOCALSTORAGE AN TOÀN ===
function getCategories() {
    try {
        const data = JSON.parse(localStorage.getItem('categories'));
        return (Array.isArray(data) && data.length > 0) ? data : DEFAULT_MENU;
    } catch (e) {
        return DEFAULT_MENU;
    }
}

function getPosts() {
    try {
        const data = JSON.parse(localStorage.getItem('posts'));
        if (Array.isArray(data) && data.length > 0) {
            return data.filter(p => p && typeof p === 'object' && p.id && p.title);
        }
        return DEFAULT_POSTS;
    } catch (e) {
        return DEFAULT_POSTS;
    }
}

function savePostToStorage(newPost) {
    if (!newPost || !newPost.id || !newPost.title) return;

    const posts = getPosts();
    const index = posts.findIndex(p => p.id === newPost.id);

    if (index >= 0) {
        posts[index] = newPost;
    } else {
        posts.unshift(newPost);
    }

    localStorage.setItem('posts', JSON.stringify(posts));
}

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
    } catch (e) {
        console.warn('Không tải được menu.json:', e);
    }

    try {
        if (!localStorage.getItem('posts')) {
            const res = await fetch('./data/posts.json');

            if (res.ok) {
                const data = await res.json();

                if (Array.isArray(data) && data.length > 0) {
                    localStorage.setItem('posts', JSON.stringify(data));
                    renderCategory('home');
                }
            }
        }
    } catch (e) {
        console.warn('Không tải được posts.json:', e);
    }
}

// === 3. VẼ THANH NAVBAR ===
function renderNavbar() {
    const categories = getCategories();
    const navMenuEl = document.getElementById('navbarMenu');
    const footerCatEl = document.getElementById('footerCategories');

    let navHtml = '';
    let footerHtml = '';

    categories.forEach(cat => {
        if (!cat) return;

        if (cat.children && cat.children.length > 0) {
            let subHtml = '<ul class="dropdown-menu">';

            cat.children.forEach(child => {
                if (child) {
                    subHtml += `<li><a onclick="renderCategory('${child.id}')">${child.title}</a></li>`;
                }
            });

            subHtml += '</ul>';

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

// === 4. TẠO LƯỚI BÀI VIẾT ===
function createGridHtml(postsList) {
    if (!Array.isArray(postsList) || postsList.length === 0) return '';

    const featuredLarge = postsList[0];
    const featuredSmall = postsList.slice(1, 3);
    const fallbackImg = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop';

    let html = '<div class="featured-grid">';

    if (featuredLarge) {
        const rawExcerpt = featuredLarge.excerpt || '';
        const excerptText = rawExcerpt.startsWith('(Dân trí)')
            ? rawExcerpt
            : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
        const imgUrl = featuredLarge.thumbnail || featuredLarge.image || fallbackImg;

        html += `
            <div class="card-clean" onclick="renderArticleDetail('${featuredLarge.id}')">
                <img src="${imgUrl}" class="card-img-large" alt="thumb"
                     onerror="this.onerror=null; this.src='${fallbackImg}';">
                <div class="card-category-green">${(featuredLarge.category || 'THỜI SỰ').toUpperCase()}</div>
                <h3 class="card-title-large-green">${featuredLarge.title || ''}</h3>
                <p class="card-excerpt-clean">${excerptText}</p>
            </div>
        `;
    }

    html += '<div class="featured-small-group">';

    featuredSmall.forEach(post => {
        if (!post) return;

        const imgUrlSmall = post.thumbnail || post.image || fallbackImg;

        html += `
            <div class="card-clean" onclick="renderArticleDetail('${post.id}')">
                <img src="${imgUrlSmall}" class="card-img-small" alt="thumb"
                     onerror="this.onerror=null; this.src='${fallbackImg}';">
                <h4 class="card-title-small-clean">${post.title || ''}</h4>
                <div class="card-time-clean">${post.publishedAt || ''}</div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

// === 5. TRANG CHỦ VÀ TRANG CHUYÊN MỤC ===
function renderCategory(catId = 'home') {
    const app = document.getElementById('appView');
    if (!app) return;

    const posts = getPosts();

    document.querySelectorAll('.nav-menu a').forEach(el => {
        el.classList.remove('active');
    });

    const activeNav = document.getElementById(`nav-${catId}`);
    if (activeNav) activeNav.classList.add('active');

    posts.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt) : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt) : 0;
        return dateB - dateA;
    });

    if (catId === 'home') {
        let html = '<h2 class="section-title">Tin mới nhất</h2>';
        html += createGridHtml(posts.slice(0, 3));

        const listPosts = posts.slice(3, 10);

        if (listPosts.length > 0) {
            html += '<div class="recent-list">';

            listPosts.forEach(post => {
                if (!post) return;

                const rawExcerpt = post.excerpt || '';
                const excerptText = rawExcerpt.startsWith('(Dân trí)')
                    ? rawExcerpt
                    : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
                const fallbackImg = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop';
                const imgUrl = post.thumbnail || post.image || fallbackImg;

                html += `
                    <div class="list-item" onclick="renderArticleDetail('${post.id}')">
                        <img src="${imgUrl}" class="list-item-img" alt="thumb"
                             onerror="this.onerror=null; this.src='${fallbackImg}';">
                        <div class="list-content">
                            <div class="card-category-green">${(post.category || '').toUpperCase()}</div>
                            <h4 class="list-item-title">${post.title || ''}</h4>
                            <p class="list-item-excerpt">${excerptText}</p>
                            <div class="list-item-meta">${post.publishedAt || ''} ${post.author ? '· ' + post.author : ''}</div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }

        const sectionCategories = [
            'Thế giới', 'Thời sự', 'Pháp luật', 'Sức khỏe',
            'Đời sống', 'Du lịch', 'Kinh doanh', 'Bất động sản', 'Thể thao'
        ];

        sectionCategories.forEach(catName => {
            const catPosts = posts.filter(p =>
                p && p.category &&
                (p.category.toLowerCase().includes(catName.toLowerCase()) || p.categoryId === catName)
            );

            if (catPosts.length > 0) {
                html += `
                    <div class="category-block">
                        <h3 class="category-section-title" onclick="renderCategory('${catName}')">
                            ${catName.toUpperCase()} <span class="arrow">&gt;</span>
                        </h3>
                        ${createGridHtml(catPosts)}
                    </div>
                `;
            }
        });

        app.innerHTML = html;
        return;
    }

    const targetTitle = catId.toUpperCase();
    const filteredPosts = posts.filter(p =>
        p && p.category &&
        (p.category.toLowerCase().includes(catId.toLowerCase()) || p.categoryId === catId)
    );

    let html = `<h2 class="section-title">${targetTitle}</h2>`;

    if (filteredPosts.length === 0) {
        app.innerHTML = html + '<p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này.</p>';
        return;
    }

    html += createGridHtml(filteredPosts.slice(0, 3));

    const remaining = filteredPosts.slice(3);

    if (remaining.length > 0) {
        html += '<div class="recent-list" style="margin-top:20px;">';

        remaining.forEach(post => {
            if (!post) return;

            const rawExcerpt = post.excerpt || '';
            const excerptText = rawExcerpt.startsWith('(Dân trí)')
                ? rawExcerpt
                : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
            const fallbackImg = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop';

            html += `
                <div class="list-item" onclick="renderArticleDetail('${post.id}')">
                    <img src="${post.thumbnail || post.image || fallbackImg}" class="list-item-img" alt="thumb"
                         onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <div class="list-content">
                        <div class="card-category-green">${(post.category || '').toUpperCase()}</div>
                        <h4 class="list-item-title">${post.title || ''}</h4>
                        <p class="list-item-excerpt">${excerptText}</p>
                        <div class="list-item-meta">${post.publishedAt || ''} ${post.author ? '· ' + post.author : ''}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    app.innerHTML = html;
}

// === 6. TRANG CHI TIẾT BÀI VIẾT ===
function renderArticleDetail(postId) {
    const app = document.getElementById('appView');
    if (!app) return;

    const posts = getPosts();
    const article = posts.find(p => p && p.id === postId);

    if (!article) {
        app.innerHTML = '<h2>Bài viết không tồn tại</h2>';
        return;
    }

    const rawExcerpt = article.excerpt || '';
    const sapoText = rawExcerpt.startsWith('(Dân trí)')
        ? rawExcerpt
        : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');

    const contentHtml = (article.content || '').replace(/\n/g, '<br>');

    app.innerHTML = `
        <div class="article-detail">
            <h1 class="article-title-main">${article.title || ''}</h1>
            <div class="article-meta-info">
                <span>Tác giả: <b>${article.author || 'Dân trí'}</b></span> ·
                <span>Đăng ngày: ${article.publishedAt || ''}</span> ·
                <span style="color:#008837; font-weight:bold;">Chuyên mục: ${article.category || ''}</span>
            </div>
            <p class="article-sapo-main">${sapoText}</p>
            ${(article.thumbnail || article.image)
                ? `<img src="${article.thumbnail || article.image}" class="detail-main-img" alt="thumb">`
                : ''}
            <div class="article-content-body">${contentHtml}</div>
            <br><hr><br>
            <button onclick="renderCategory('home')"
                    style="background:#6c757d; border:none; color:#fff; padding:8px 16px; border-radius:4px; cursor:pointer;">
                &larr; Quay lại trang chủ
            </button>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 7. TRANG CRAWLER TIN TỨC ===
function renderCrawlerPage() {
    const app = document.getElementById('appView');
    if (!app) return;

    document.querySelectorAll('.nav-menu a').forEach(el => {
        el.classList.remove('active');
    });

    app.innerHTML = `
        <div class="crawler-box">
            <h2 class="section-title">Crawler tin tức</h2>
            <p class="crawler-desc">
                Nhập URL bài viết trên dantri.com.vn. Nếu proxy không lấy được bài,
                hãy dán mã nguồn HTML vào ô dự phòng.
            </p>

            <div class="crawl-input-group">
                <input type="text" id="crawlUrl"
                       placeholder="https://dantri.com.vn/thoi-su/duong-dan-bai-viet.htm">
                <button class="btn-crawl" onclick="handleCrawl()">Crawl</button>
            </div>

            <details class="fallback-accordion">
                <summary>► Cách dự phòng: dán mã nguồn HTML (Ctrl+U) của bài viết vào đây</summary>
                <div class="fallback-content">
                    <textarea id="rawHtmlInput" rows="6"
                              placeholder="Dán toàn bộ mã nguồn HTML của bài viết Dân trí vào đây..."></textarea>
                    <button class="btn-crawl" style="margin-top:10px;"
                            onclick="handleCrawlFromHtml()">Phân tích HTML &amp; Lưu</button>
                </div>
            </details>

            <div id="crawlSuccessAlert" class="alert-success" style="display:none;">
                Đã cập nhật bài viết vào LocalStorage. Chuyên mục:
                <span id="alertCatName" style="font-weight:bold;"></span>.
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
        container.innerHTML = '<p style="padding:10px 0;color:#777;">Chưa có bài viết nào trong LocalStorage.</p>';
        return;
    }

    let html = '';

    posts.forEach(post => {
        if (!post) return;

        html += `
            <div class="ls-item" onclick="renderArticleDetail('${post.id}')">
                <span class="ls-title">${post.title || ''}</span>
                <span class="ls-category">${post.category || 'Thời sự'}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// === 8. CRAWL BÀI VIẾT ===
async function handleCrawl() {
    const urlInput = document.getElementById('crawlUrl')?.value.trim() || '';
    const htmlText = document.getElementById('rawHtmlInput')?.value.trim() || '';
    const alertBox = document.getElementById('crawlSuccessAlert');
    const alertCatName = document.getElementById('alertCatName');
    const jsonPreview = document.getElementById('jsonPreview');

    if (!urlInput) {
        alert('Vui lòng nhập đường dẫn URL bài viết!');
        return;
    }

    if (!/^https?:\/\/(www\.)?dantri\.com\.vn\//i.test(urlInput)) {
        alert('Vui lòng nhập URL bài viết hợp lệ từ dantri.com.vn!');
        return;
    }

    if (alertBox) alertBox.style.display = 'none';
    if (jsonPreview) jsonPreview.style.display = 'none';

    try {
        let article = null;

        // Nếu đã dán HTML, phân tích HTML đó trước, không gọi proxy.
        if (htmlText) {
            if (typeof parseDantriDom !== 'function') {
                alert('Không tìm thấy hàm parseDantriDom trong js/crawler.js!');
                return;
            }

            article = parseDantriDom(htmlText, urlInput);
        } else if (typeof getArticle === 'function') {
            // Chưa dán HTML thì mới thử lấy bài qua proxy.
            article = await getArticle(urlInput);
        } else {
            alert('Không tìm thấy hàm getArticle trong js/crawler.js!');
            return;
        }

        if (!article || !article.title || !article.content ||
            article.content === 'Nội dung bài viết...') {
            alert(
                'Chưa lấy được đủ nội dung bài viết.\n\n' +
                'Hãy mở bài viết trên Dân Trí, nhấn Ctrl+U, sao chép mã nguồn HTML, ' +
                'dán vào ô dự phòng rồi bấm “Phân tích HTML & Lưu”.'
            );
            return;
        }

        savePostToStorage(article);

        if (alertCatName) {
            alertCatName.innerText = article.category || 'Thời sự';
        }

        if (alertBox) alertBox.style.display = 'block';

        if (jsonPreview) {
            jsonPreview.innerText = JSON.stringify(article, null, 2);
            jsonPreview.style.display = 'block';
        }

        renderLocalStorageList();
    } catch (error) {
        console.error('Lỗi khi crawl bài viết:', error);
        alert('Không phân tích được bài viết. Hãy kiểm tra URL hoặc mã HTML đã dán.');
    }
}

// === 9. PHÂN TÍCH HTML ĐÃ DÁN ===
function handleCrawlFromHtml() {
    const htmlText = document.getElementById('rawHtmlInput')?.value.trim() || '';
    const urlInput = document.getElementById('crawlUrl')?.value.trim() || '';
    const alertBox = document.getElementById('crawlSuccessAlert');
    const alertCatName = document.getElementById('alertCatName');
    const jsonPreview = document.getElementById('jsonPreview');

    if (!urlInput) {
        alert('Hãy nhập URL bài viết Dân Trí trước khi phân tích HTML!');
        return;
    }

    if (!/^https?:\/\/(www\.)?dantri\.com\.vn\//i.test(urlInput)) {
        alert('Vui lòng nhập URL bài viết hợp lệ từ dantri.com.vn!');
        return;
    }

    if (!htmlText) {
        alert('Vui lòng dán mã nguồn HTML bài viết vào đây!');
        return;
    }

    if (/^https?:\/\/\S+$/i.test(htmlText)) {
        alert('Mày đang dán URL thay vì mã HTML. Hãy mở bài viết, nhấn Ctrl+U rồi sao chép mã nguồn.');
        return;
    }

    if (!htmlText.toLowerCase().includes('<html') &&
        !htmlText.toLowerCase().includes('<!doctype') &&
        !htmlText.toLowerCase().includes('<head')) {
        alert('Nội dung đã dán chưa giống mã nguồn HTML. Hãy sao chép toàn bộ trang bằng Ctrl+U.');
        return;
    }

    if (alertBox) alertBox.style.display = 'none';
    if (jsonPreview) jsonPreview.style.display = 'none';

    try {
        if (typeof parseDantriDom !== 'function') {
            alert('Không tìm thấy hàm parseDantriDom trong js/crawler.js!');
            return;
        }

        const article = parseDantriDom(htmlText, urlInput);

        if (!article || !article.title || !article.content ||
            article.content === 'Nội dung bài viết...') {
            alert(
                'Đã đọc HTML nhưng chưa tìm được đủ tiêu đề và nội dung bài viết. ' +
                'Có thể HTML đã sao chép chỉ chứa trang chặn hoặc trang yêu cầu JavaScript.'
            );
            return;
        }

        savePostToStorage(article);

        if (alertCatName) {
            alertCatName.innerText = article.category || 'Thời sự';
        }

        if (alertBox) alertBox.style.display = 'block';

        if (jsonPreview) {
            jsonPreview.innerText = JSON.stringify(article, null, 2);
            jsonPreview.style.display = 'block';
        }

        renderLocalStorageList();
        alert('Đã phân tích và lưu bài viết thành công!');
    } catch (error) {
        console.error('Lỗi phân tích HTML:', error);
        alert('Không phân tích được HTML. Hãy kiểm tra lại mã nguồn đã dán.');
    }
}

// === 10. RESET DỮ LIỆU MẪU ===
function resetDefaultData() {
    if (confirm('Bạn có chắc chắn muốn reset lại dữ liệu mẫu ban đầu?')) {
        localStorage.removeItem('posts');
        localStorage.removeItem('categories');

        renderNavbar();
        renderCategory('home');

        if (document.getElementById('localStorageList')) {
            renderCrawlerPage();
        }
    }
}

// === 11. KHỞI CHẠY ỨNG DỤNG ===
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

