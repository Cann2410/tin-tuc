/* =========================================
   1. DỮ LIỆU MẪU MẶC ĐỊNH (ĐÃ ĐỒNG BỘ DỰ PHÒNG CHUẨN)
========================================= */

const DEFAULT_MENU = [
    { id: "home", title: "Home", url: "https://dantri.com.vn/", type: "home" },
    { id: "Mới nhất", title: "Mới nhất", url: "https://dantri.com.vn/tin-moi-nhat.htm", type: "category" },
    {
        id: "Thế giới",
        title: "Thế giới",
        url: "https://dantri.com.vn/the-gioi.htm",
        type: "category",
        children: [
            { id: "Quân sự", title: "Quân sự", url: "https://dantri.com.vn/the-gioi/quan-su.htm" },
            { id: "Phân tích - Bình luận", title: "Phân tích - Bình luận", url: "https://dantri.com.vn/the-gioi/phan-tich-binh-luan.htm" },
            { id: "Thế giới đó đây", title: "Thế giới đó đây", url: "https://dantri.com.vn/the-gioi/the-gioi-do-day.htm" },
            { id: "Kiều bào", title: "Kiều bào", url: "https://dantri.com.vn/the-gioi/kieu-bao.htm" }
        ]
    },
    {
        id: "Thời sự",
        title: "Thời sự",
        url: "https://dantri.com.vn/thoi-su.htm",
        type: "category",
        children: [
            { id: "Chính trị", title: "Chính trị", url: "https://dantri.com.vn/thoi-su/chinh-tri.htm" },
            { id: "Giao thông", title: "Giao thông", url: "https://dantri.com.vn/thoi-su/giao-thong.htm" },
            { id: "Môi trường", title: "Môi trường", url: "https://dantri.com.vn/thoi-su/moi-truong.htm" },
            { id: "Nóng trên mạng", title: "Nóng trên mạng", url: "https://dantri.com.vn/thoi-su/nong-tren-mang.htm" }
        ]
    },
    { id: "Pháp luật", title: "Pháp luật", url: "https://dantri.com.vn/phap-luat.htm", type: "category" },
    { id: "Sức khỏe", title: "Sức khỏe", url: "https://dantri.com.vn/suc-khoe.htm", type: "category" },
    { id: "Đời sống", title: "Đời sống", url: "https://dantri.com.vn/doi-song.htm", type: "category" },
    { id: "Du lịch", title: "Du lịch", url: "https://dantri.com.vn/du-lich.htm", type: "category" },
    { id: "Kinh doanh", title: "Kinh doanh", url: "https://dantri.com.vn/kinh-doanh.htm", type: "category" },
    { id: "Thể thao", title: "Thể thao", url: "https://dantri.com.vn/the-thao.htm", type: "category" },
    { id: "Bất động sản", title: "Bất động sản", url: "https://dantri.com.vn/bat-dong-san.htm", type: "category" },
    { id: "Giải trí", title: "Giải trí", url: "https://dantri.com.vn/giai-tri.htm", type: "category" },
    { id: "Giáo dục", title: "Giáo dục", url: "https://dantri.com.vn/giao-duc.htm", type: "category" }
];

const DEFAULT_POSTS = [
    {
        id: "dtri-20261017001",
        title: "Loạt đề xuất mới về biển báo, khoảng cách đặt biển cảnh báo trên cao tốc",
        slug: "loat-de-xuat-moi-ve-bien-bao-khoang-cach-dat-bien-canh-bao-tren-cao-toc",
        excerpt: "Cục Đường bộ Việt Nam đề xuất nhiều thay đổi về biển báo, đèn tín hiệu, khoảng cách đặt biển cảnh báo và hệ thống chỉ dẫn trên đường cao tốc.",
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
   2. HÀM TIỆN ÍCH
========================================= */

function normalizeCategoryId(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

function makeClickArg(value) {
    return encodeURIComponent(String(value ?? ""));
}

function normalizePost(post) {
    if (!post || typeof post !== "object") return null;

    const title = String(post.title || "").trim();
    const id = String(post.id || post.slug || "").trim();

    if (!title || !id) return null;

    const category = String(
        post.category ||
        post.categoryName ||
        post.categoryId ||
        "Thời sự"
    ).trim();

    const categoryId = normalizeCategoryId(
        post.categoryId || category
    );

    return {
        ...post,
        id,
        title,
        slug: post.slug || id,
        category,
        categoryId,
        excerpt: String(post.excerpt || "")
            .trim()
            .replace(/^(\(Dân trí\)|Dân trí)\s*[-–—]\s*/i, ""),
        content: String(post.content || ""),
        author: String(post.author || "").trim(),
        publishedAt: post.publishedAt || post.date || "",
        thumbnail: post.thumbnail || post.image || "",
        image: post.image || post.thumbnail || "",
        url: String(post.url || ""),
        source: String(post.source || "dantri.com.vn")
    };
}

function normalizeMenuItem(item) {
    if (!item || typeof item !== "object") return null;

    const title = String(
        item.title || item.name || item.id || ""
    ).trim();

    const id = normalizeCategoryId(item.id || title);

    if (!title || !id) return null;

    return {
        ...item,
        id,
        title,
        type: item.type || (id === "home" ? "home" : "category"),
        children: Array.isArray(item.children)
            ? item.children
                .map(child => {
                    if (!child || typeof child !== "object") return null;

                    const childTitle = String(
                        child.title || child.name || child.id || ""
                    ).trim();

                    const childId = normalizeCategoryId(
                        child.id || childTitle
                    );

                    if (!childTitle || !childId) return null;

                    return {
                        ...child,
                        id: childId,
                        title: childTitle,
                        type: child.type || "category"
                    };
                })
                .filter(Boolean)
            : []
    };
}

function isPostInCategory(post, catId) {
    if (!post || !catId) return false;

    const targetId = normalizeCategoryId(catId);

    if (!targetId || targetId === "home") return false;

    const normalizedPost = normalizePost(post);
    if (!normalizedPost) return false;

    if (targetId === "moi-nhat") return true;

    return (
        normalizeCategoryId(normalizedPost.categoryId) === targetId ||
        normalizeCategoryId(normalizedPost.category) === targetId
    );
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
    return (
        post?.thumbnail ||
        post?.image ||
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop"
    );
}

// Không tự thêm tiền tố Dân trí vào mô tả.
function getExcerpt(post) {
    return String(post?.excerpt || "")
        .trim()
        .replace(/^(\(Dân trí\)|Dân trí)\s*[-–—]\s*/i, "")
        .trim();
}

function sortPostsByDate(posts) {
    return [...posts].sort((a, b) => {
        const timeA = a.publishedAt
            ? new Date(String(a.publishedAt).replace(" ", "T")).getTime()
            : 0;

        const timeB = b.publishedAt
            ? new Date(String(b.publishedAt).replace(" ", "T")).getTime()
            : 0;

        return (
            (Number.isNaN(timeB) ? 0 : timeB) -
            (Number.isNaN(timeA) ? 0 : timeA)
        );
    });
}


/* =========================================
   3. QUẢN LÝ LOCALSTORAGE
========================================= */

function getCategories() {
    try {
        const raw = localStorage.getItem("categories");

        if (raw) {
            const data = JSON.parse(raw);
            const menu = Array.isArray(data) ? data : data?.menu;

            if (Array.isArray(menu) && menu.length > 0) {
                const normalized = menu
                    .map(normalizeMenuItem)
                    .filter(Boolean);

                if (normalized.length > 0) return normalized;
            }
        }
    } catch (error) {
        console.warn("Không đọc được categories:", error);
    }

    return DEFAULT_MENU.map(normalizeMenuItem).filter(Boolean);
}

function getPosts() {
    try {
        const raw = localStorage.getItem("posts");

        if (raw) {
            const data = JSON.parse(raw);
            const posts = Array.isArray(data) ? data : data?.posts;

            if (Array.isArray(posts)) {
                const normalized = posts
                    .map(normalizePost)
                    .filter(Boolean);

                if (normalized.length > 0) return normalized;
            }
        }
    } catch (error) {
        console.warn("Không đọc được posts:", error);
    }

    return DEFAULT_POSTS.map(normalizePost).filter(Boolean);
}

function savePostToStorage(newPost) {
    const normalizedPost = normalizePost(newPost);

    if (!normalizedPost || !normalizedPost.content.trim()) {
        throw new Error("Bài viết thiếu tiêu đề hoặc nội dung.");
    }

    const posts = getPosts();

    const index = posts.findIndex(
        post => String(post.id) === String(normalizedPost.id)
    );

    if (index >= 0) {
        posts[index] = {
            ...posts[index],
            ...normalizedPost
        };
    } else {
        posts.unshift(normalizedPost);
    }

    try {
        localStorage.setItem("posts", JSON.stringify(posts));
    } catch (error) {
        console.error("Không thể lưu bài viết:", error);
        throw new Error("Không lưu được dữ liệu vào LocalStorage.");
    }

    return normalizedPost;
}

async function initDataFromFiles() {
    if (!localStorage.getItem("categories")) {
        try {
            const response = await fetch("./data/menu.json");

            if (response.ok) {
                const data = await response.json();
                const menu = Array.isArray(data) ? data : data?.menu;

                if (Array.isArray(menu) && menu.length > 0) {
                    localStorage.setItem(
                        "categories",
                        JSON.stringify(menu)
                    );
                }
            }
        } catch (error) {
            console.warn("Không tải được menu.json:", error);
        }
    }

    if (!localStorage.getItem("posts")) {
        try {
            const response = await fetch("./data/posts.json");

            if (response.ok) {
                const data = await response.json();
                const posts = Array.isArray(data) ? data : data?.posts;

                if (Array.isArray(posts) && posts.length > 0) {
                    localStorage.setItem(
                        "posts",
                        JSON.stringify(
                            posts.map(normalizePost).filter(Boolean)
                        )
                    );
                }
            }
        } catch (error) {
            console.warn("Không tải được posts.json:", error);
        }
    }

    renderNavbar();

    if (
        window.currentNewsPage !== "crawler" &&
        window.currentNewsPage !== "article"
    ) {
        renderCategory("home");
    }
}


/* =========================================
   4. THANH ĐIỀU HƯỚNG
========================================= */

function renderNavbar() {
    const categories = getCategories();
    const navMenuEl = document.getElementById("navbarMenu");
    const footerCatEl = document.getElementById("footerCategories");

    let navHtml = "";
    let footerHtml = "";

    categories.forEach(cat => {
        if (!cat || !cat.id) return;

        const idArg = makeClickArg(cat.id);
        const title = escapeHtml(cat.title || cat.id);
        const navId = escapeHtml(normalizeCategoryId(cat.id));

        if (Array.isArray(cat.children) && cat.children.length > 0) {
            let subHtml = '<ul class="dropdown-menu">';

            cat.children.forEach(child => {
                if (!child || !child.id) return;

                subHtml += `
                    <li>
                        <a href="#"
                           onclick="event.preventDefault();renderCategory(decodeURIComponent('${makeClickArg(child.id)}'))">
                            ${escapeHtml(child.title || child.id)}
                        </a>
                    </li>
                `;
            });

            subHtml += "</ul>";

            navHtml += `
                <li class="has-dropdown">
                    <a href="#"
                       onclick="event.preventDefault();renderCategory(decodeURIComponent('${idArg}'))"
                       id="nav-${navId}">
                        ${title} ▾
                    </a>
                    ${subHtml}
                </li>
            `;
        } else {
            navHtml += `
                <li>
                    <a href="#"
                       onclick="event.preventDefault();renderCategory(decodeURIComponent('${idArg}'))"
                       id="nav-${navId}">
                        ${title}
                    </a>
                </li>
            `;
        }

        footerHtml += `
            <li>
                <a href="#"
                   onclick="event.preventDefault();renderCategory(decodeURIComponent('${idArg}'))">
                    ${title}
                </a>
            </li>
        `;
    });

    navHtml += `
        <li>
            <a href="#"
               onclick="event.preventDefault();renderCrawlerPage()"
               class="btn-crawler">
                Crawler Page
            </a>
        </li>
    `;

    if (navMenuEl) navMenuEl.innerHTML = navHtml;
    if (footerCatEl) footerCatEl.innerHTML = footerHtml;
}

function setActiveNavigation(catId) {
    document.querySelectorAll(".nav-menu a").forEach(link => {
        link.classList.remove("active");
    });

    const targetId = normalizeCategoryId(catId);
    const activeNav = document.getElementById(`nav-${targetId}`);

    if (activeNav) activeNav.classList.add("active");
}


/* =========================================
   5. TẠO THẺ BÀI VIẾT
========================================= */

function createGridHtml(postsList) {
    if (!Array.isArray(postsList) || postsList.length === 0) {
        return "<p>Chưa có bài viết để hiển thị.</p>";
    }

    const featuredLarge = postsList[0];
    const featuredSmall = postsList.slice(1, 3);

    let html = '<div class="featured-grid">';

    html += `
        <div class="card-clean"
             onclick="renderArticleDetail(decodeURIComponent('${makeClickArg(featuredLarge.id)}'))">
            <img src="${escapeHtml(getPostImage(featuredLarge))}"
                 class="card-img-large"
                 alt="${escapeHtml(featuredLarge.title)}"
                 loading="lazy"
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

            <div class="card-time-clean">
                ${escapeHtml(formatDate(featuredLarge.publishedAt))}
            </div>
        </div>
    `;

    html += '<div class="featured-small-group">';

    featuredSmall.forEach(post => {
        html += `
            <div class="card-clean"
                 onclick="renderArticleDetail(decodeURIComponent('${makeClickArg(post.id)}'))">
                <img src="${escapeHtml(getPostImage(post))}"
                     class="card-img-small"
                     alt="${escapeHtml(post.title)}"
                     loading="lazy"
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

function createListItemHtml(post) {
    return `
        <div class="list-item"
             onclick="renderArticleDetail(decodeURIComponent('${makeClickArg(post.id)}'))">
            <img src="${escapeHtml(getPostImage(post))}"
                 class="list-item-img"
                 alt="${escapeHtml(post.title)}"
                 loading="lazy"
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
}


/* =========================================
   6. TRANG CHỦ VÀ CHUYÊN MỤC
========================================= */

function renderCategory(catId = "home") {
    const app = document.getElementById("appView");
    if (!app) return;

    let requestedId = normalizeCategoryId(catId);

    if (
        !requestedId ||
        requestedId === "home" ||
        requestedId === "trang-chu"
    ) {
        catId = "home";
        requestedId = "home";
    }

    window.currentNewsPage = "category";

    const posts = sortPostsByDate(getPosts());
    setActiveNavigation(catId);

    if (requestedId === "moi-nhat") {
        let html = '<h2 class="section-title">Tin mới nhất</h2>';
        html += createGridHtml(posts.slice(0, 3));

        const remaining = posts.slice(3);

        if (remaining.length > 0) {
            html += '<div class="recent-list">';

            remaining.forEach(post => {
                html += createListItemHtml(post);
            });

            html += "</div>";
        }

        app.innerHTML = html;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    if (requestedId === "home") {
        let html = '<h2 class="section-title">Tin mới nhất</h2>';

        html += createGridHtml(posts.slice(0, 3));

        const listPosts = posts.slice(3, 10);

        if (listPosts.length > 0) {
            html += '<div class="recent-list">';

            listPosts.forEach(post => {
                html += createListItemHtml(post);
            });

            html += "</div>";
        }

        const sectionCategories = [
            "Thế giới",
            "Thời sự",
            "Pháp luật",
            "Sức khỏe",
            "Đời sống",
            "Du lịch",
            "Kinh doanh",
            "Bất động sản",
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
                            onclick="renderCategory(decodeURIComponent('${makeClickArg(normalizeCategoryId(catName))}'))">
                            ${escapeHtml(catName.toUpperCase())}
                            <span class="arrow">&gt;</span>
                        </h3>

                        ${createGridHtml(catPosts)}
                    </div>
                `;
            }
        });

        app.innerHTML = html;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const categories = getCategories();
    const allCategories = [];

    categories.forEach(category => {
        allCategories.push(category);

        if (Array.isArray(category.children)) {
            allCategories.push(...category.children);
        }
    });

    const matchedCategory = allCategories.find(category =>
        normalizeCategoryId(category.id) === requestedId ||
        normalizeCategoryId(category.title) === requestedId
    );

    const targetTitle = matchedCategory?.title || String(catId);

    const filteredPosts = posts.filter(post =>
        isPostInCategory(post, requestedId)
    );

    let html = `<h2 class="section-title">${escapeHtml(targetTitle)}</h2>`;

    if (filteredPosts.length === 0) {
        html += `
            <p style="margin-top:15px;">
                Chưa có bài viết nào trong chuyên mục này.
            </p>
        `;

        app.innerHTML = html;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    html += createGridHtml(filteredPosts.slice(0, 3));

    const remaining = filteredPosts.slice(3);

    if (remaining.length > 0) {
        html += '<div class="recent-list" style="margin-top:20px;">';

        remaining.forEach(post => {
            html += createListItemHtml(post);
        });

        html += "</div>";
    }

    app.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================
   7. HIỂN THỊ NỘI DUNG BÀI VIẾT
========================================= */

function renderArticleContent(content) {
    const source = String(content || "")
        .replace(/\r\n/g, "\n")
        .trim();

    if (!source) {
        return "<p>Nội dung bài viết đang được cập nhật.</p>";
    }

    const escaped = escapeHtml(source);

    let formatted = escaped.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        (match, label, url) => {
            const safeUrl = url.replace(/&amp;/g, "&");

            if (!/^https?:\/\//i.test(safeUrl)) return label;

            return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        }
    );

    formatted = formatted.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
    );

    return formatted
        .split(/\n{2,}/)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
        .join("");
}

function renderArticleDetail(postId) {
    const app = document.getElementById("appView");
    if (!app) return;

    const article = getPosts().find(post =>
        post && String(post.id) === String(postId)
    );

    if (!article) {
        app.innerHTML = `
            <h2>Bài viết không tồn tại</h2>
            <button onclick="renderCategory('home')">
                Quay lại trang chủ
            </button>
        `;
        return;
    }

    window.currentNewsPage = "article";
    setActiveNavigation(article.categoryId || article.category);

    const contentHtml = renderArticleContent(article.content);

    app.innerHTML = `
        <div class="article-detail">
            <h1 class="article-title-main">
                ${escapeHtml(article.title)}
            </h1>

            <div class="article-meta-info">
                <span>
                    Tác giả:
                    <b>${escapeHtml(article.author || "Chưa rõ tác giả")}</b>
                </span>
                ·
                <span>
                    Đăng ngày:
                    ${escapeHtml(formatDate(article.publishedAt) || "Chưa có thông tin")}
                </span>
                ·
                <span style="color:#008837;font-weight:bold;">
                    Chuyên mục: ${escapeHtml(article.category || "Chưa phân loại")}
                </span>
            </div>

            ${article.excerpt ? `
                <p class="article-sapo-main">
                    ${escapeHtml(getExcerpt(article))}
                </p>
            ` : ""}

            ${(article.thumbnail || article.image) ? `
                <img src="${escapeHtml(getPostImage(article))}"
                     class="detail-main-img"
                     alt="${escapeHtml(article.title)}"
                     onerror="this.style.display='none';">
            ` : ""}

            <div class="article-content-body">${contentHtml}</div>

            ${article.url ? `
                <p class="article-source-link">
                    <a href="${escapeHtml(article.url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        Xem bài viết gốc
                    </a>
                </p>
            ` : ""}

            <br>
            <hr>
            <br>

            <button
                onclick="renderCategory('home')"
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

    window.currentNewsPage = "crawler";

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
                <input
                    type="url"
                    id="crawlUrl"
                    placeholder="https://dantri.com.vn/the-gioi/duong-dan-bai-viet.htm">

                <button class="btn-crawl" id="crawlButton" onclick="handleCrawl()">
                    Crawl
                </button>
            </div>

            <details class="fallback-accordion">
                <summary>► Dự phòng: dán mã nguồn HTML (Ctrl+U)</summary>

                <div class="fallback-content">
                    <textarea
                        id="rawHtmlInput"
                        rows="6"
                        placeholder="Dán toàn bộ mã nguồn HTML của bài viết vào đây..."></textarea>

                    <button
                        class="btn-crawl"
                        style="margin-top:10px;"
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
   9. HIỂN THỊ DANH SÁCH BÀI ĐÃ LƯU
========================================= */

function renderLocalStorageList() {
    const container = document.getElementById("localStorageList");
    if (!container) return;

    const posts = sortPostsByDate(getPosts());

    if (posts.length === 0) {
        container.innerHTML = `
            <p style="padding:10px 0;color:#777;">
                Chưa có bài viết nào trong LocalStorage.
            </p>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="ls-item"
             onclick="renderArticleDetail(decodeURIComponent('${makeClickArg(post.id)}'))">
            <span class="ls-title">${escapeHtml(post.title)}</span>
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
    const savedArticle = savePostToStorage(article);

    const alertBox = document.getElementById("crawlSuccessAlert");
    const alertCatName = document.getElementById("alertCatName");
    const jsonPreview = document.getElementById("jsonPreview");

    if (alertCatName) {
        alertCatName.textContent = savedArticle.category || "Chưa phân loại";
    }

    if (alertBox) alertBox.style.display = "block";

    if (jsonPreview) {
        jsonPreview.textContent = JSON.stringify(savedArticle, null, 2);
        jsonPreview.style.display = "block";
    }

    renderLocalStorageList();

    return savedArticle;
}

function validateCrawledArticle(article) {
    const normalized = normalizePost(article);

    return Boolean(
        normalized &&
        normalized.title &&
        normalized.content.trim() &&
        normalized.content.trim() !== "Nội dung bài viết..."
    );
}

async function handleCrawl() {
    const urlInput = document.getElementById("crawlUrl")?.value.trim() || "";

    if (!urlInput) {
        alert("Vui lòng nhập URL bài viết!");
        return;
    }

    if (!isValidDantriUrl(urlInput)) {
        alert("Vui lòng nhập URL bài viết hợp lệ từ dantri.com.vn!");
        return;
    }

    const alertBox = document.getElementById("crawlSuccessAlert");
    const jsonPreview = document.getElementById("jsonPreview");
    const button = document.getElementById("crawlButton");

    if (alertBox) alertBox.style.display = "none";
    if (jsonPreview) jsonPreview.style.display = "none";

    if (button) {
        button.disabled = true;
        button.textContent = "Đang crawl...";
    }

    try {
        if (typeof getArticle !== "function") {
            alert("Không tìm thấy hàm getArticle trong js/crawler.js!");
            return;
        }

        const article = await getArticle(urlInput);

        if (!validateCrawledArticle(article)) {
            alert(
                "Chưa lấy được đủ tiêu đề và nội dung.\n\n" +
                "Hãy mở bài viết Dân Trí, nhấn Ctrl+U, sao chép mã nguồn HTML, " +
                "dán vào ô dự phòng rồi bấm “Phân tích HTML & Lưu”."
            );
            return;
        }

        article.url = article.url || urlInput;

        showCrawlResult(article);
        alert("Đã crawl và lưu bài viết thành công!");
    } catch (error) {
        console.error("Lỗi khi crawl bài viết:", error);
        alert(
            "Không lấy được bài viết tự động.\n" +
            "Hãy thử chức năng dán mã nguồn HTML dự phòng."
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Crawl";
        }
    }
}


/* =========================================
   11. PHÂN TÍCH HTML ĐÃ DÁN
========================================= */

function handleCrawlFromHtml() {
    const htmlText =
        document.getElementById("rawHtmlInput")?.value.trim() || "";

    const urlInput =
        document.getElementById("crawlUrl")?.value.trim() || "";

    if (!urlInput || !isValidDantriUrl(urlInput)) {
        alert("Hãy nhập URL bài viết hợp lệ từ dantri.com.vn trước!");
        return;
    }

    if (!htmlText) {
        alert("Vui lòng dán mã nguồn HTML bài viết!");
        return;
    }

    if (/^https?:\/\/\S+$/i.test(htmlText)) {
        alert(
            "Bạn đang dán URL, không phải mã HTML. " +
            "Mở bài viết, nhấn Ctrl+U rồi sao chép mã nguồn."
        );
        return;
    }

    if (
        !/<html[\s>]/i.test(htmlText) &&
        !/<!doctype/i.test(htmlText) &&
        !/<head[\s>]/i.test(htmlText)
    ) {
        alert(
            "Nội dung chưa giống mã nguồn HTML. " +
            "Hãy sao chép mã nguồn trang bằng Ctrl+U."
        );
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

        article.url = article.url || urlInput;

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
    const confirmed = confirm(
        "Bạn có chắc chắn muốn xóa các bài đã lưu và quay về dữ liệu mẫu?"
    );

    if (!confirmed) return;

    localStorage.removeItem("posts");
    localStorage.removeItem("categories");

    window.currentNewsPage = "category";

    // Tải lại menu và bài viết từ file JSON sau khi reset.
    initDataFromFiles();
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

