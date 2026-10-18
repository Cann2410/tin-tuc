
/* =========================================
   1. DỮ LIỆU DỰ PHÒNG MẶC ĐỊNH
========================================= */

const DEFAULT_MENU = [
    { id: "home", title: "Home", type: "home" },
    { id: "Thời sự", title: "Thời sự", type: "category" },
    { id: "Thế giới", title: "Thế giới", type: "category" },
    { id: "Bất động sản", title: "Bất động sản", type: "category" },
    { id: "Thể thao", title: "Thể thao", type: "category" }
];

const DEFAULT_POSTS = [
    {
        id: "dtri-20261017001",
        title: "Loạt đề xuất mới về biển báo, khoảng cách đặt biển cảnh báo trên cao tốc",
        slug: "loat-de-xuat-moi-ve-bien-bao-khoang-cach-dat-bien-canh-bao-tren-cao-toc",
        excerpt: "(Dân trí) - Cục Đường bộ Việt Nam đề xuất nhiều thay đổi về biển báo, đèn tín hiệu, khoảng cách đặt biển cảnh báo và hệ thống chỉ dẫn trên đường cao tốc.",
        content: "Cục Đường bộ Việt Nam vừa hoàn thiện bản dự thảo đề xuất quy chuẩn mới về hệ thống biển báo giao thông trên đường cao tốc.\n\nMột trong những nội dung trọng tâm là việc quy định khoảng cách tối thiểu từ biển cảnh báo đến vị trí sự cố hoặc công trường thi công trên đường cao tốc nhằm giúp tài xế chủ động giảm tốc độ an toàn.",
        thumbnail: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
        author: "Văn Hưng",
        category: "Thời sự",
        categoryId: "thoi-su",
        publishedAt: "2026-10-14 23:30",
        source: "dantri.com.vn",
        url: "https://dantri.com.vn/thoi-su/loat-de-xuat-moi.htm"
    }
];


/* =========================================
   2. HÀM TIỆN ÍCH VÀ CHUẨN HÓA CHUYÊN MỤC
========================================= */

function normalizeCategoryId(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function isPostInCategory(post, catId) {
    if (!post || !catId || catId === "home") {
        return false;
    }

    const targetId = normalizeCategoryId(catId);
    const postCategoryId = normalizeCategoryId(post.categoryId);
    const postCategory = normalizeCategoryId(post.category);

    return postCategoryId === targetId ||
           postCategory === targetId;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getPostImage(post) {
    return post?.thumbnail ||
           post?.image ||
           "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop";
}

function getExcerpt(post) {
    const excerpt = String(post?.excerpt || "").trim();

    if (!excerpt) return "";

    return excerpt.startsWith("(Dân trí)")
        ? excerpt
        : `(Dân trí) - ${excerpt}`;
}


/* =========================================
   3. QUẢN LÝ LOCALSTORAGE
========================================= */

function getCategories() {
    try {
        const data = JSON.parse(localStorage.getItem("categories"));

        return Array.isArray(data) && data.length > 0
            ? data
            : DEFAULT_MENU;
    } catch (error) {
        console.warn("Không đọc được categories:", error);
        return DEFAULT_MENU;
    }
}

function getPosts() {
    try {
        const data = JSON.parse(localStorage.getItem("posts"));

        if (Array.isArray(data) && data.length > 0) {
            return data
                .filter(post =>
                    post &&
                    typeof post === "object" &&
                    post.id &&
                    post.title
                )
                .map(post => ({
                    ...post,
                    categoryId: post.categoryId
                        ? normalizeCategoryId(post.categoryId)
                        : normalizeCategoryId(post.category)
                }));
        }

        return DEFAULT_POSTS;
    } catch (error) {
        console.warn("Không đọc được posts:", error);
        return DEFAULT_POSTS;
    }
}

function savePostToStorage(newPost) {
    if (!newPost || !newPost.id || !newPost.title) {
        return;
    }

    const posts = getPosts();

    const normalizedPost = {
        ...newPost,
        category: newPost.category || "Thời sự",
        categoryId: normalizeCategoryId(
            newPost.categoryId || newPost.category || "Thời sự"
        ),
        excerpt: String(newPost.excerpt || "").trim(),
        author: String(newPost.author || "").trim(),
        publishedAt: newPost.publishedAt || ""
    };

    const index = posts.findIndex(post => post.id === normalizedPost.id);

    if (index >= 0) {
        posts[index] = {
            ...posts[index],
            ...normalizedPost
        };
    } else {
        posts.unshift(normalizedPost);
    }

    localStorage.setItem("posts", JSON.stringify(posts));
}

async function initDataFromFiles() {
    try {
        if (!localStorage.getItem("categories")) {
            const response = await fetch("./data/menu.json");

            if (response.ok) {
                const data = await response.json();

                if (data && Array.isArray(data.menu)) {
                    localStorage.setItem(
                        "categories",
                        JSON.stringify(data.menu)
                    );
                    renderNavbar();
                }
            }
        }
    } catch (error) {
        console.warn("Không tải được menu.json:", error);
    }

    try {
        if (!localStorage.getItem("posts")) {
            const response = await fetch("./data/posts.json");

            if (response.ok) {
                const data = await response.json();

                const posts = Array.isArray(data)
                    ? data
                    : data?.posts;

                if (Array.isArray(posts) && posts.length > 0) {
                    localStorage.setItem(
                        "posts",
                        JSON.stringify(posts)
                    );
                    renderCategory("home");
                }
            }
        }
    } catch (error) {
        console.warn("Không tải được posts.json:", error);
    }
}


/* =========================================
   4. VẼ THANH ĐIỀU HƯỚNG
========================================= */

function renderNavbar() {
    const categories = getCategories();
    const navMenuEl = document.getElementById("navbarMenu");
    const footerCatEl = document.getElementById("footerCategories");

    let navHtml = "";
    let footerHtml = "";

    categories.forEach(cat => {
        if (!cat || !cat.id) return;

        const catId = escapeHtml(cat.id);
        const catTitle = escapeHtml(cat.title || cat.id);

        if (Array.isArray(cat.children) && cat.children.length > 0) {
            let subHtml = '<ul class="dropdown-menu">';

            cat.children.forEach(child => {
                if (!child || !child.id) return;

                subHtml += `
                    <li>
                        <a onclick="renderCategory('${escapeHtml(child.id)}')">
                            ${escapeHtml(child.title || child.id)}
                        </a>
                    </li>
                `;
            });

            subHtml += "</ul>";

            navHtml += `
                <li class="has-dropdown">
                    <a onclick="renderCategory('${catId}')"
                       id="nav-${catId}">
                        ${catTitle} ▾
                    </a>
                    ${subHtml}
                </li>
            `;
        } else {
            navHtml += `
                <li>
                    <a onclick="renderCategory('${catId}')"
                       id="nav-${catId}">
                        ${catTitle}
                    </a>
                </li>
            `;
        }

        footerHtml += `
            <li>
                <a onclick="renderCategory('${catId}')">${catTitle}</a>
            </li>
        `;
    });

    navHtml += `
        <li>
            <a onclick="renderCrawlerPage()" class="btn-crawler">
                Crawler Page
            </a>
        </li>
    `;

    if (navMenuEl) navMenuEl.innerHTML = navHtml;
    if (footerCatEl) footerCatEl.innerHTML = footerHtml;
}


/* =========================================
   5. TẠO LƯỚI BÀI VIẾT
========================================= */

function createGridHtml(postsList) {
    if (!Array.isArray(postsList) || postsList.length === 0) {
        return "";
    }

    const featuredLarge = postsList[0];
    const featuredSmall = postsList.slice(1, 3);

    let html = '<div class="featured-grid">';

    if (featuredLarge) {
        html += `
            <div class="card-clean"
                 onclick="renderArticleDetail('${escapeHtml(featuredLarge.id)}')">
                <img src="${escapeHtml(getPostImage(featuredLarge))}"
                     class="card-img-large"
                     alt="${escapeHtml(featuredLarge.title)}"
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';">

                <div class="card-category-green">
                    ${escapeHtml((featuredLarge.category || "Thời sự").toUpperCase())}
                </div>

                <h3 class="card-title-large-green">
                    ${escapeHtml(featuredLarge.title)}
                </h3>

                <p class="card-excerpt-clean">
                    ${escapeHtml(getExcerpt(featuredLarge))}
                </p>
            </div>
        `;
    }

    html += '<div class="featured-small-group">';

    featuredSmall.forEach(post => {
        html += `
            <div class="card-clean"
                 onclick="renderArticleDetail('${escapeHtml(post.id)}')">
                <img src="${escapeHtml(getPostImage(post))}"
                     class="card-img-small"
                     alt="${escapeHtml(post.title)}"
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';">

                <h4 class="card-title-small-clean">
                    ${escapeHtml(post.title)}
                </h4>

                <div class="card-time-clean">
                    ${escapeHtml(formatDate(post.publishedAt))}
                </div>
            </div>
        `;
    });

    html += "</div></div>";

    return html;
}


/* =========================================
   6. TRANG CHỦ VÀ TRANG CHUYÊN MỤC
========================================= */

function renderCategory(catId = "home") {
    const app = document.getElementById("appView");
    if (!app) return;

    const posts = getPosts();

    document.querySelectorAll(".nav-menu a").forEach(element => {
        element.classList.remove("active");
    });

    const activeNav = document.getElementById(`nav-${catId}`);
    if (activeNav) activeNav.classList.add("active");

    posts.sort((a, b) => {
        const dateA = a.publishedAt
            ? new Date(String(a.publishedAt).replace(" ", "T")).getTime()
            : 0;

        const dateB = b.publishedAt
            ? new Date(String(b.publishedAt).replace(" ", "T")).getTime()
            : 0;

        return (Number.isNaN(dateB) ? 0 : dateB) -
               (Number.isNaN(dateA) ? 0 : dateA);
    });

    if (catId === "home") {
        let html = '<h2 class="section-title">Tin mới nhất</h2>';

        html += createGridHtml(posts.slice(0, 3));

        const listPosts = posts.slice(3, 10);

        if (listPosts.length > 0) {
            html += '<div class="recent-list">';

            listPosts.forEach(post => {
                html += `
                    <div class="list-item"
                         onclick="renderArticleDetail('${escapeHtml(post.id)}')">
                        <img src="${escapeHtml(getPostImage(post))}"
                             class="list-item-img"
                             alt="${escapeHtml(post.title)}"
                             onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';">

                        <div class="list-content">
                            <div class="card-category-green">
                                ${escapeHtml((post.category || "").toUpperCase())}
                            </div>

                            <h4 class="list-item-title">
                                ${escapeHtml(post.title)}
                            </h4>

                            <p class="list-item-excerpt">
                                ${escapeHtml(getExcerpt(post))}
                            </p>

                            <div class="list-item-meta">
                                ${escapeHtml(formatDate(post.publishedAt))}
                                ${post.author ? " · " + escapeHtml(post.author) : ""}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += "</div>";
        }

        const sectionCategories = [
            "Thế giới", "Thời sự", "Pháp luật", "Sức khỏe",
            "Đời sống", "Du lịch", "Kinh doanh", "Bất động sản",
            "Thể thao"
        ];

        sectionCategories.forEach(catName => {
            const catPosts = posts.filter(post =>
                isPostInCategory(post, catName)
            );

            if (catPosts.length > 0) {
                html += `
                    <div class="category-block">
                        <h3 class="category-section-title"
                            onclick="renderCategory('${escapeHtml(normalizeCategoryId(catName))}')">
                            ${escapeHtml(catName.toUpperCase())}
                            <span class="arrow">&gt;</span>
                        </h3>

                        ${createGridHtml(catPosts)}
                    </div>
                `;
            }
        });

        app.innerHTML = html;
        return;
    }

    const targetId = normalizeCategoryId(catId);

    const matchedCategory = getCategories().find(category =>
        category &&
        (
            normalizeCategoryId(category.id) === targetId ||
            normalizeCategoryId(category.title) === targetId
        )
    );

    const targetTitle = matchedCategory?.title || catId;

    const filteredPosts = posts.filter(post =>
        isPostInCategory(post, catId) ||
        (
            matchedCategory &&
            isPostInCategory(post, matchedCategory.title)
        )
    );

    let html = `<h2 class="section-title">${escapeHtml(targetTitle)}</h2>`;

    if (filteredPosts.length === 0) {
        app.innerHTML = html +
            '<p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này.</p>';
        return;
    }

    html += createGridHtml(filteredPosts.slice(0, 3));

    const remaining = filteredPosts.slice(3);

    if (remaining.length > 0) {
        html += '<div class="recent-list" style="margin-top:20px;">';

        remaining.forEach(post => {
            html += `
                <div class="list-item"
                     onclick="renderArticleDetail('${escapeHtml(post.id)}')">
                    <img src="${escapeHtml(getPostImage(post))}"
                         class="list-item-img"
                         alt="${escapeHtml(post.title)}"
                         onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';">

                    <div class="list-content">
                        <div class="card-category-green">
                            ${escapeHtml((post.category || "").toUpperCase())}
                        </div>

                        <h4 class="list-item-title">
                            ${escapeHtml(post.title)}
                        </h4>

                        <p class="list-item-excerpt">
                            ${escapeHtml(getExcerpt(post))}
                        </p>

                        <div class="list-item-meta">
                            ${escapeHtml(formatDate(post.publishedAt))}
                            ${post.author ? " · " + escapeHtml(post.author) : ""}
                        </div>
                    </div>
                </div>
            `;
        });

        html += "</div>";
    }

    app.innerHTML = html;
}


/* =========================================
   7. TRANG CHI TIẾT BÀI VIẾT
========================================= */

function renderArticleDetail(postId) {
    const app = document.getElementById("appView");
    if (!app) return;

    const article = getPosts().find(post =>
        post && String(post.id) === String(postId)
    );

    if (!article) {
        app.innerHTML = "<h2>Bài viết không tồn tại</h2>";
        return;
    }

    const contentHtml = escapeHtml(article.content || "")
        .replace(/\r?\n/g, "<br>");

    app.innerHTML = `
        <div class="article-detail">
            <h1 class="article-title-main">
                ${escapeHtml(article.title)}
            </h1>

            <div class="article-meta-info">
                <span>Tác giả:
                    <b>${escapeHtml(article.author || "Chưa rõ tác giả")}</b>
                </span>
                ·
                <span>Đăng ngày:
                    ${escapeHtml(formatDate(article.publishedAt) || "Chưa có thông tin")}
                </span>
                ·
                <span style="color:#008837;font-weight:bold;">
                    Chuyên mục: ${escapeHtml(article.category || "Chưa phân loại")}
                </span>
            </div>

            <p class="article-sapo-main">
                ${escapeHtml(getExcerpt(article))}
            </p>

            ${(article.thumbnail || article.image) ? `
                <img src="${escapeHtml(getPostImage(article))}"
                     class="detail-main-img"
                     alt="${escapeHtml(article.title)}">
            ` : ""}

            <div class="article-content-body">${contentHtml}</div>

            <br><hr><br>

            <button onclick="renderCategory('home')"
                    style="background:#6c757d;border:none;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;">
                &larr; Quay lại trang chủ
            </button>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================
   8. TRANG CRAWLER
========================================= */

function renderCrawlerPage() {
    const app = document.getElementById("appView");
    if (!app) return;

    document.querySelectorAll(".nav-menu a").forEach(element => {
        element.classList.remove("active");
    });

    app.innerHTML = `
        <div class="crawler-box">
            <h2 class="section-title">Crawler tin tức</h2>

            <p class="crawler-desc">
                Nhập URL bài viết trên dantri.com.vn.
                Nếu không lấy được bài qua proxy, hãy dán mã nguồn HTML vào ô dự phòng.
            </p>

            <div class="crawl-input-group">
                <input type="text" id="crawlUrl"
                       placeholder="https://dantri.com.vn/thoi-su/duong-dan-bai-viet.htm">

                <button class="btn-crawl" onclick="handleCrawl()">Crawl</button>
            </div>

            <details class="fallback-accordion">
                <summary>► Dự phòng: dán mã nguồn HTML (Ctrl+U)</summary>

                <div class="fallback-content">
                    <textarea id="rawHtmlInput" rows="6"
                              placeholder="Dán toàn bộ mã nguồn HTML của bài viết vào đây..."></textarea>

                    <button class="btn-crawl" style="margin-top:10px;"
                            onclick="handleCrawlFromHtml()">
                        Phân tích HTML &amp; Lưu
                    </button>
                </div>
            </details>

            <div id="crawlSuccessAlert" class="alert-success" style="display:none;">
                Đã cập nhật bài viết vào LocalStorage. Chuyên mục:
                <span id="alertCatName" style="font-weight:bold;"></span>
            </div>

            <pre class="json-preview" id="jsonPreview" style="display:none;"></pre>

            <div class="local-storage-section">
                <h3 class="local-storage-title">Bài mới nhất trong LocalStorage</h3>
                <div id="localStorageList" class="local-storage-list"></div>
                <button class="btn-reset-data" onclick="resetDefaultData()">
                    Reset dữ liệu mẫu
                </button>
            </div>
        </div>
    `;

    renderLocalStorageList();
}


/* =========================================
   9. HIỂN THỊ BÀI ĐÃ LƯU
========================================= */

function renderLocalStorageList() {
    const container = document.getElementById("localStorageList");
    if (!container) return;

    const posts = getPosts();

    if (posts.length === 0) {
        container.innerHTML =
            '<p style="padding:10px 0;color:#777;">Chưa có bài viết nào trong LocalStorage.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="ls-item"
             onclick="renderArticleDetail('${escapeHtml(post.id)}')">
            <span class="ls-title">${escapeHtml(post.title || "")}</span>
            <span class="ls-category">${escapeHtml(post.category || "Thời sự")}</span>
        </div>
    `).join("");
}


/* =========================================
   10. CRAWL BÀI VIẾT
========================================= */

function isValidDantriUrl(url) {
    try {
        const parsed = new URL(url);

        return (
            ["http:", "https:"].includes(parsed.protocol) &&
            (
                parsed.hostname === "dantri.com.vn" ||
                parsed.hostname === "www.dantri.com.vn"
            )
        );
    } catch (error) {
        return false;
    }
}

function showCrawlResult(article) {
    savePostToStorage(article);

    const alertBox = document.getElementById("crawlSuccessAlert");
    const alertCatName = document.getElementById("alertCatName");
    const jsonPreview = document.getElementById("jsonPreview");

    if (alertCatName) {
        alertCatName.textContent = article.category || "Chưa phân loại";
    }

    if (alertBox) alertBox.style.display = "block";

    if (jsonPreview) {
        jsonPreview.textContent = JSON.stringify(article, null, 2);
        jsonPreview.style.display = "block";
    }

    renderLocalStorageList();
}

function validateCrawledArticle(article) {
    return Boolean(
        article &&
        article.title &&
        article.content &&
        article.content !== "Nội dung bài viết..."
    );
}

async function handleCrawl() {
    const urlInput = document.getElementById("crawlUrl")?.value.trim() || "";
    const htmlText = document.getElementById("rawHtmlInput")?.value.trim() || "";

    if (!urlInput) {
        alert("Vui lòng nhập URL bài viết!");
        return;
    }

    if (!isValidDantriUrl(urlInput)) {
        alert("Vui lòng nhập URL bài viết hợp lệ từ dantri.com.vn!");
        return;
    }

    document.getElementById("crawlSuccessAlert").style.display = "none";
    document.getElementById("jsonPreview").style.display = "none";

    try {
        let article = null;

        if (htmlText) {
            if (typeof parseDantriDom !== "function") {
                alert("Không tìm thấy hàm parseDantriDom trong js/crawler.js!");
                return;
            }

            article = parseDantriDom(htmlText, urlInput);
        } else if (typeof getArticle === "function") {
            article = await getArticle(urlInput);
        } else {
            alert("Không tìm thấy hàm getArticle trong js/crawler.js!");
            return;
        }

        if (!validateCrawledArticle(article)) {
            alert(
                "Chưa lấy được đủ tiêu đề và nội dung.\n\n" +
                "Hãy mở bài viết Dân Trí, nhấn Ctrl+U, sao chép mã nguồn HTML, " +
                "dán vào ô dự phòng rồi bấm “Phân tích HTML & Lưu”."
            );
            return;
        }

        showCrawlResult(article);
    } catch (error) {
        console.error("Lỗi khi crawl bài viết:", error);
        alert("Không phân tích được bài viết. Hãy kiểm tra URL hoặc mã HTML.");
    }
}


/* =========================================
   11. PHÂN TÍCH HTML ĐÃ DÁN
========================================= */

function handleCrawlFromHtml() {
    const htmlText = document.getElementById("rawHtmlInput")?.value.trim() || "";
    const urlInput = document.getElementById("crawlUrl")?.value.trim() || "";

    if (!urlInput || !isValidDantriUrl(urlInput)) {
        alert("Hãy nhập URL bài viết hợp lệ từ dantri.com.vn trước!");
        return;
    }

    if (!htmlText) {
        alert("Vui lòng dán mã nguồn HTML bài viết!");
        return;
    }

    if (/^https?:\/\/\S+$/i.test(htmlText)) {
        alert("Mày đang dán URL, không phải mã HTML. Mở bài viết, nhấn Ctrl+U rồi sao chép mã nguồn.");
        return;
    }

    if (
        !htmlText.toLowerCase().includes("<html") &&
        !htmlText.toLowerCase().includes("<!doctype") &&
        !htmlText.toLowerCase().includes("<head")
    ) {
        alert("Nội dung chưa giống mã nguồn HTML. Hãy sao chép toàn bộ trang bằng Ctrl+U.");
        return;
    }

    if (typeof parseDantriDom !== "function") {
        alert("Không tìm thấy hàm parseDantriDom trong js/crawler.js!");
        return;
    }

    try {
        const article = parseDantriDom(htmlText, urlInput);

        if (!validateCrawledArticle(article)) {
            alert(
                "Đã đọc HTML nhưng chưa tìm được đủ tiêu đề và nội dung. " +
                "Có thể trang đã chặn truy cập hoặc HTML chưa đầy đủ."
            );
            return;
        }

        showCrawlResult(article);
        alert("Đã phân tích và lưu bài viết thành công!");
    } catch (error) {
        console.error("Lỗi phân tích HTML:", error);
        alert("Không phân tích được HTML. Hãy kiểm tra mã nguồn đã dán.");
    }
}


/* =========================================
   12. RESET DỮ LIỆU MẪU
========================================= */

function resetDefaultData() {
    if (confirm("Bạn có chắc chắn muốn xóa dữ liệu đã lưu và quay về dữ liệu mẫu?")) {
        localStorage.removeItem("posts");
        localStorage.removeItem("categories");

        renderNavbar();
        renderCategory("home");

        if (document.getElementById("localStorageList")) {
            renderCrawlerPage();
        }
    }
}


/* =========================================
   13. KHỞI CHẠY ỨNG DỤNG
========================================= */

function initApp() {
    renderNavbar();
    renderCategory("home");
    initDataFromFiles();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
