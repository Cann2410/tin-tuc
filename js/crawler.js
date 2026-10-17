/**
 * CRAWLER TIN TỨC DÂN TRÍ
 * Trích xuất nội dung bài báo và chuẩn hóa JSON.
 */

const CATEGORY_MAP = {
    "thoi-su": { title: "Thời sự", id: "Thời sự" },
    "the-gioi": { title: "Thế giới", id: "Thế giới" },
    "kinh-doanh": { title: "Kinh doanh", id: "Kinh doanh" },
    "bat-dong-san": { title: "Bất động sản", id: "Bất động sản" },
    "the-thao": { title: "Thể thao", id: "Thể thao" },
    "lao-dong-viec-lam": { title: "Lao động", id: "Lao động" },
    "suc-khoe": { title: "Sức khỏe", id: "Sức khỏe" },
    "van-hoa": { title: "Văn hóa", id: "Văn hóa" },
    "giai-tri": { title: "Giải trí", id: "Giải trí" },
    "du-lich": { title: "Du lịch", id: "Du lịch" },
    "phap-luat": { title: "Pháp luật", id: "Pháp luật" },
    "doi-song": { title: "Đời sống", id: "Đời sống" },
    "cong-nghe": { title: "Công nghệ", id: "Công nghệ" },
    "giao-duc": { title: "Giáo dục", id: "Giáo dục" },
    "o-to-xe-may": { title: "Xe ++", id: "Xe ++" },
    "xe": { title: "Xe ++", id: "Xe ++" },
    "tinh-yeu-gioi-tinh": { title: "Tình yêu", id: "Tình yêu" },
    "khoa-hoc": { title: "Khoa học", id: "Khoa học" },
    "tam-long-nhan-ai": { title: "Nhân ái", id: "Nhân ái" },
    "no-vu": { title: "Nội vụ", id: "Nội vụ" },
    "noi-vu": { title: "Nội vụ", id: "Nội vụ" }
};

// ======================================================
// 1. CÁC HÀM CHUẨN HÓA
// ======================================================

function cleanText(value) {
    return String(value || "")
        .replace(/\u00a0/g, " ")
        .replace(/[\t ]+/g, " ")
        .replace(/\r/g, "")
        .replace(/\n[ \t]+/g, "\n")
        .trim();
}

function cleanDantriImageUrl(rawUrl) {
    if (!rawUrl) return "";

    const value = rawUrl.trim();

    if (!value || value.startsWith("data:")) return "";
    if (value.startsWith("//")) return "https:" + value;
    if (value.startsWith("/")) return "https://dantri.com.vn" + value;

    return value;
}

function getImgSrcFromElement(img) {
    if (!img) return "";

    return cleanDantriImageUrl(
        img.getAttribute("data-original") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy-src") ||
        img.getAttribute("src") ||
        ""
    );
}

function getUrlInfo(url) {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1] || "";
    const categorySlug = parts.length > 1 ? parts[0] : "thoi-su";

    const idMatch = fileName.match(/(\d+)\.htm$/i);
    const articleId = idMatch ? idMatch[1] : String(Date.now());

    const slug = fileName
        .replace(/\.htm$/i, "")
        .replace(/-\d+$/, "");

    const categoryInfo = CATEGORY_MAP[categorySlug] || {
        title: "Thời sự",
        id: "Thời sự"
    };

    return {
        id: "dtri-" + articleId,
        slug,
        categorySlug,
        categoryInfo
    };
}

function titleFromSlug(slug) {
    return String(slug || "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeExcerpt(text) {
    let excerpt = cleanText(text);

    // Không để metadata thời gian lọt vào phần mô tả.
    excerpt = excerpt
        .replace(/^Published Time:\s*/i, "")
        .replace(/^Title:\s*/i, "")
        .trim();

    if (!excerpt) return "";

    if (!excerpt.startsWith("(Dân trí)")) {
        excerpt = "(Dân trí) - " + excerpt;
    }

    return excerpt;
}

function normalizeContent(text) {
    if (!text) return "";

    const unwantedLinePatterns = [
        /^quảng cáo của\b/i,
        /^dt inter\b/i,
        /^xu hướng$/i,
        /^xem thêm$/i,
        /^đọc nhiều trong\b/i,
        /^bình luận\s*\(/i,
        /^gửi$/i,
        /^theo dõi dân trí/i,
        /^thêm dân trí trên google/i,
        /^không bỏ lỡ tin mới/i,
        /^hướng dẫn:/i,
        /^đóng thêm dân trí/i,
        /^sponsored links$/i,
        /^promoted links$/i,
        /^you may like$/i,
        /^you may also like$/i,
        /^related articles$/i,
        /^tags?:$/i,
        /^©\s*2005-/i,
        /^cơ quan của bộ nội vụ/i,
        /^tổng biên tập:/i,
        /^giấy phép hoạt động/i,
        /^địa chỉ tòa soạn:/i,
        /^văn phòng đại diện/i,
        /^hotline/i,
        /^liên hệ quảng cáo/i,
        /^đọc báo dân trí trên mobile/i,
        /^ios$/i,
        /^android$/i,
        /^audio\s*\d*$/i,
        /^video\s*\d*$/i,
        /^00:00/,
        /^speed$/i,
        /^normal$/i,
        /^nam miền/i,
        /^giọng nam/i,
        /^giọng nữ/i,
        /^in$/i,
        /^facebook$/i,
        /^youtube$/i,
        /^tiktok$/i,
        /^telegram$/i,
        /^theo dõi dân trí trên/i,
        /^bấm tích vào ô/i
    ];

    const lines = String(text)
        .replace(/\r/g, "")
        .split("\n")
        .map(line => cleanText(line))
        .filter(Boolean);

    const result = [];
    let previous = "";

    for (let line of lines) {
        // Bỏ Markdown heading không cần thiết nhưng giữ nguyên nội dung.
        line = line.replace(/^#{1,6}\s+/, "").trim();

        if (!line) continue;

        // Cắt tại phần kết thúc bài và nội dung đề xuất.
        if (
            /^thêm dân trí trên google/i.test(line) ||
            /^không bỏ lỡ tin mới/i.test(line) ||
            /^đọc nhiều trong\b/i.test(line) ||
            /^bình luận\s*\(/i.test(line) ||
            /^sponsored links$/i.test(line) ||
            /^promoted links$/i.test(line) ||
            /^you may like$/i.test(line) ||
            /^you may also like$/i.test(line)
        ) {
            break;
        }

        if (unwantedLinePatterns.some(pattern => pattern.test(line))) {
            continue;
        }

        // Bỏ các dòng điều hướng Markdown.
        if (/^\[.*\]\(https?:\/\/[^)]+\)$/.test(line)) continue;
        if (/^https?:\/\/\S+$/i.test(line)) continue;
        if (/^!\[.*\]\(.*\)$/.test(line)) continue;
        if (/^\*{1,2}$/.test(line)) continue;

        // Bỏ dòng chỉ chứa tên menu, nếu xuất hiện trong nội dung.
        if (/^(trang chủ|mới nhất|sự kiện|thế giới|thời sự|kinh doanh|giải trí|thể thao|giáo dục|du lịch|pháp luật|sức khỏe)$/i.test(line)) {
            continue;
        }

        // Gỡ ký hiệu Markdown còn sót lại.
        line = line
            .replace(/^\*\s+/, "")
            .replace(/^[-•]\s+/, "")
            .replace(/\*\*/g, "")
            .replace(/^\[|\]$/g, "")
            .trim();

        if (line.length < 2) continue;

        // Loại dòng lặp liền nhau.
        if (line === previous) continue;

        result.push(line);
        previous = line;
    }

    return result.join("\n\n").trim();
}

function isValidArticleContent(article) {
    if (!article || !article.title || !article.content) return false;

    const content = cleanText(article.content);
    const title = cleanText(article.title);

    if (title.length < 8) return false;
    if (content.length < 150) return false;

    const badContent = [
        "Nội dung bài viết...",
        "Published Time:",
        "Markdown Content:",
        "Access denied",
        "Just a moment..."
    ];

    if (badContent.some(value => content.includes(value))) return false;

    // Nội dung có quá nhiều dấu hiệu menu/điều hướng là không hợp lệ.
    const navCount = (content.match(/https?:\/\/dantri\.com\.vn\//gi) || []).length;
    if (navCount > 8) return false;

    return true;
}

// ======================================================
// 2. TẠO JSON CHUẨN
// ======================================================

function buildArticle({
    url,
    title,
    excerpt,
    content,
    author,
    category,
    publishedAt,
    image
}) {
    const info = getUrlInfo(url);

    const cleanTitle = cleanText(title) || titleFromSlug(info.slug);
    const cleanExcerpt = normalizeExcerpt(excerpt);
    const cleanBody = normalizeContent(content);
    const cleanImage = cleanDantriImageUrl(image);

    const article = {
        id: info.id,
        title: cleanTitle,
        slug: info.slug,
        excerpt: cleanExcerpt,
        content: cleanBody,
        author: cleanText(author) || "Dân trí",
        category: cleanText(category) || info.categoryInfo.title,
        publishedAt: cleanText(publishedAt) || "",
        source: "dantri.com.vn",
        url,
        image: cleanImage,
        thumbnail: cleanImage,
        categoryId: info.categoryInfo.id
    };

    return article;
}

// ======================================================
// 3. PHÂN TÍCH HTML DÂN TRÍ
// ======================================================

function parseDantriDom(htmlText, url) {
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const info = getUrlInfo(url);

    const getText = selector => {
        const element = doc.querySelector(selector);
        return element ? cleanText(element.textContent) : "";
    };

    const getMeta = selector => {
        const element = doc.querySelector(selector);
        return element ? cleanText(element.getAttribute("content")) : "";
    };

    const title =
        getMeta('meta[property="og:title"]') ||
        getText("#articleContent [data-slot='title']") ||
        getText("h1.title-page") ||
        getText("h1.singular-title") ||
        getText("h1.e-magazine__title") ||
        getText("article h1") ||
        getText("h1") ||
        titleFromSlug(info.slug);

    const excerpt =
        getMeta('meta[property="og:description"]') ||
        getMeta('meta[name="description"]') ||
        getText("#articleContent [data-slot='sapo']") ||
        getText(".singular-sapo") ||
        getText(".e-magazine__sapo") ||
        getText(".sapo") ||
        "";

    // Ưu tiên đúng phần thân bài, tuyệt đối không ưu tiên toàn bộ trang.
    const contentSelectors = [
        "#articleContent [data-slot='content']",
        "#articleContent .singular-content",
        "#articleContent .e-magazine__body",
        "#articleContent .e-magazine__content",
        "#articleContent .article-body",
        "article .singular-content",
        "article .e-magazine__body",
        "article .article-body",
        "[itemprop='articleBody']",
        ".singular-content",
        ".e-magazine__body",
        ".e-magazine__content",
        ".article-body"
    ];

    let contentText = "";

    for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (!element) continue;

        const clone = element.cloneNode(true);

        clone.querySelectorAll([
            "script",
            "style",
            "iframe",
            "button",
            "form",
            "nav",
            "header",
            "footer",
            ".relate-container",
            ".video-content-wrapper",
            ".author-time",
            ".singular-author",
            ".related-news",
            ".box-tin-lien-quan",
            ".article-related",
            ".related-articles",
            ".tags",
            ".article-tags",
            ".comment",
            ".comments",
            ".advertisement",
            ".ads",
            "[class*='related']",
            "[class*='recommend']",
            "[class*='comment']",
            "[class*='advert']",
            "[class*='banner']",
            "[id*='related']",
            "[id*='comment']",
            "[id*='ads']"
        ].join(",")).forEach(node => node.remove());

        const paragraphs = Array.from(clone.querySelectorAll("p"))
            .map(p => cleanText(p.textContent))
            .filter(text => text.length >= 2);

        const candidate = paragraphs.join("\n\n");

        // Chọn phần thân bài đủ dài và có vẻ là nội dung thật.
        if (candidate.length > contentText.length) {
            contentText = candidate;
        }

        // Đã có nội dung tương đối đầy đủ thì không cần dùng selector rộng hơn.
        if (contentText.length > 500) break;
    }

    // Chỉ fallback khi các selector thân bài không hoạt động.
    // Không lấy toàn bộ body hoặc toàn bộ #articleContent vì có thể chứa menu.
    if (contentText.length < 150) {
        const article = doc.querySelector("article");
        if (article) {
            const clone = article.cloneNode(true);

            clone.querySelectorAll(
                "script, style, iframe, nav, header, footer, button, form, " +
                ".related-news, .relate-container, .comments, [class*='related'], " +
                "[class*='comment'], [class*='advert'], [class*='banner']"
            ).forEach(node => node.remove());

            contentText = Array.from(clone.querySelectorAll("p"))
                .map(p => cleanText(p.textContent))
                .filter(text => text.length >= 2)
                .join("\n\n");
        }
    }

    const author =
        getText("#articleContent [rel='author']") ||
        getText("[rel='author']") ||
        getText(".author-name") ||
        getText(".singular-author") ||
        getText(".e-magazine__author") ||
        getText("[itemprop='author']") ||
        "Dân trí";

    const category =
        getText("ul.breadcrumbs li:last-child a") ||
        getText(".breadcrumbs a:last-child") ||
        info.categoryInfo.title;

    const timeElement =
        doc.querySelector("time[datetime]") ||
        doc.querySelector("time") ||
        doc.querySelector(".singular-time") ||
        doc.querySelector(".author-time");

    let publishedAt = "";

    if (timeElement) {
        const dateTime = timeElement.getAttribute("datetime");
        const rawTime = cleanText(timeElement.textContent);

        if (dateTime && !Number.isNaN(Date.parse(dateTime))) {
            const date = new Date(dateTime);
            publishedAt =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0") + " " +
                String(date.getHours()).padStart(2, "0") + ":" +
                String(date.getMinutes()).padStart(2, "0");
        } else {
            const match = rawTime.match(
                /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–,]?\s*(\d{1,2}:\d{2})/
            );

            if (match) {
                publishedAt =
                    match[3] + "-" +
                    match[2].padStart(2, "0") + "-" +
                    match[1].padStart(2, "0") + " " +
                    match[4];
            }
        }
    }

    const image =
        getMeta('meta[property="og:image"]') ||
        getMeta('meta[name="twitter:image"]') ||
        getImgSrcFromElement(doc.querySelector("#articleContent figure img")) ||
        getImgSrcFromElement(doc.querySelector(".singular-content figure img")) ||
        getImgSrcFromElement(doc.querySelector(".singular-content img")) ||
        "";

    return buildArticle({
        url,
        title,
        excerpt,
        content: contentText,
        author,
        category,
        publishedAt,
        image
    });
}

// ======================================================
// 4. PHÂN TÍCH JINA MARKDOWN
// ======================================================

function parseJinaMarkdown(markdown, url) {
    const info = getUrlInfo(url);

    const rawText = String(markdown || "")
        .replace(/\r/g, "")
        .replace(/<!--[\s\S]*?-->/g, "");

    const lines = rawText.split("\n").map(line => line.trim());

    let title = "";
    let image = "";
    let publishedAt = "";
    let author = "";
    let category = "";
    let titleIndex = -1;

    // Lấy tiêu đề chính từ metadata hoặc H1.
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!title && /^Title:\s*/i.test(line)) {
            title = line.replace(/^Title:\s*/i, "").trim();
        }

        if (!title && /^#\s+/.test(line)) {
            title = line.replace(/^#\s+/, "").trim();
        }

        if (!image && /^!\[/.test(line)) {
            const match = line.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/i);
            if (match) image = match[1];
        }
    }

    // Tìm vị trí tiêu đề bài báo để không lấy menu trước đó.
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
            .replace(/^#{1,6}\s+/, "")
            .replace(/\*\*/g, "")
            .trim();

        if (
            line &&
            title &&
            line.toLocaleLowerCase() === title.toLocaleLowerCase()
        ) {
            titleIndex = i;
            break;
        }
    }

    // Nếu metadata không khớp, tìm H1.
    if (titleIndex < 0) {
        titleIndex = lines.findIndex(line => /^#\s+/.test(line));
    }

    if (titleIndex < 0) {
        titleIndex = 0;
    }

    // Lấy ngày xuất bản và chuyên mục từ phần gần tiêu đề.
    for (
        let i = Math.max(0, titleIndex - 10);
        i < Math.min(lines.length, titleIndex + 5);
        i++
    ) {
        const line = lines[i];

        if (!publishedAt) {
            const match = line.match(
                /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–,]?\s*(\d{1,2}:\d{2})/
            );

            if (match) {
                publishedAt =
                    match[3] + "-" +
                    match[2].padStart(2, "0") + "-" +
                    match[1].padStart(2, "0") + " " +
                    match[4];
            }
        }

        if (
            !category &&
            /Thế giới|Thời sự|Kinh doanh|Bất động sản|Thể thao|Sức khỏe|Giáo dục|Du lịch|Pháp luật|Đời sống|Công nghệ|Giải trí/i.test(line) &&
            !line.includes("http")
        ) {
            category = line.replace(/^\*+\s*/, "").trim();
        }
    }

    // Bắt đầu phần nội dung sau tiêu đề.
    let bodyLines = lines.slice(titleIndex + 1);

    // Bỏ phần đầu trang trước khi gặp mô tả bài báo.
    const excerptIndex = bodyLines.findIndex(line => {
        const text = line.replace(/^#{1,6}\s+/, "").trim();

        return (
            /^\(Dân trí\)\s*[-–]/i.test(text) ||
            /^Dân trí\s*[-–:]/i.test(text)
        );
    });

    let excerpt = "";
    if (excerptIndex >= 0) {
        excerpt = bodyLines[excerptIndex]
            .replace(/^#{1,6}\s+/, "")
            .trim();

        bodyLines = bodyLines.slice(excerptIndex + 1);
    } else {
        // Nếu không thấy sapo, chỉ giữ nội dung sau tiêu đề.
        bodyLines = bodyLines.filter(line => {
            if (!line) return true;
            if (/^Published Time:/i.test(line)) return false;
            if (/^URL Source:/i.test(line)) return false;
            if (/^Markdown Content:/i.test(line)) return false;
            if (/^Title:/i.test(line)) return false;
            return true;
        });
    }

    // Dừng trước khu vực bài liên quan / bình luận / quảng cáo.
    const stopPatterns = [
        /^thêm dân trí trên google/i,
        /^không bỏ lỡ tin mới/i,
        /^hướng dẫn:/i,
        /^đóng thêm dân trí/i,
        /^bình luận\s*\(/i,
        /^đọc nhiều trong\b/i,
        /^sponsored links$/i,
        /^promoted links$/i,
        /^you may like$/i,
        /^you may also like$/i,
        /^tags?:$/i,
        /^by taboola$/i,
        /^©\s*2005-/i
    ];

    const body = [];

    for (const line of bodyLines) {
        const plain = line
            .replace(/^#{1,6}\s+/, "")
            .replace(/\*\*/g, "")
            .trim();

        if (stopPatterns.some(pattern => pattern.test(plain))) {
            break;
        }

        body.push(line);
    }

    let content = normalizeContent(body.join("\n"));

    // Lấy tác giả nếu Markdown có đường dẫn tác giả.
    const authorMatch = rawText.match(
        /\[([^\]]{2,60})\]\(https?:\/\/dantri\.com\.vn\/tac-gia\/[^)]+\)/i
    );

    if (authorMatch) {
        author = cleanText(authorMatch[1]);
    }

    // Lấy ảnh từ Open Graph trong văn bản nếu có.
    if (!image) {
        const imageMatch = rawText.match(
            /https?:\/\/cdnphoto\.dantri\.com\.vn\/[^\s)>"']+/i
        );
        if (imageMatch) image = imageMatch[0];
    }

    return buildArticle({
        url,
        title: title || titleFromSlug(info.slug),
        excerpt,
        content,
        author: author || "Dân trí",
        category: category || info.categoryInfo.title,
        publishedAt,
        image
    });
}

// ======================================================
// 5. TẢI DỮ LIỆU QUA PROXY
// ======================================================

function isBlockedResponse(text) {
    if (!text || text.length < 300) return true;

    const lower = text.toLowerCase();

    return (
        lower.includes("just a moment...") ||
        lower.includes("attention required!") ||
        lower.includes("access denied") ||
        lower.includes("enable javascript and cookies") ||
        lower.includes("verify you are human")
    );
}

async function fetchWithTimeout(url, timeout = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        return await response.text();
    } finally {
        clearTimeout(timer);
    }
}

async function fetchHtmlWithMultiProxy(url) {
    const encodedUrl = encodeURIComponent(url);

    const proxies = [
        async () => {
            const text = await fetchWithTimeout(
                "https://r.jina.ai/" + url,
                15000
            );

            if (
                isBlockedResponse(text) ||
                !/(Title:|Markdown Content:|# )/i.test(text)
            ) {
                throw new Error("Jina không trả về nội dung hợp lệ");
            }

            return { type: "markdown", content: text };
        },

        async () => {
            const text = await fetchWithTimeout(
                "https://api.allorigins.win/raw?url=" + encodedUrl,
                12000
            );

            if (
                isBlockedResponse(text) ||
                !/<html|<article|<h1/i.test(text)
            ) {
                throw new Error("AllOrigins không trả về HTML hợp lệ");
            }

            return { type: "html", content: text };
        },

        async () => {
            const text = await fetchWithTimeout(
                "https://api.codetabs.com/v1/proxy?quest=" + encodedUrl,
                12000
            );

            if (
                isBlockedResponse(text) ||
                !/<html|<article|<h1/i.test(text)
            ) {
                throw new Error("CodeTabs không trả về HTML hợp lệ");
            }

            return { type: "html", content: text };
        }
    ];

    // Thử lần lượt từng nguồn; không chọn một kết quả ngẫu nhiên
    // chỉ vì nó trả về nhanh hơn.
    for (const proxy of proxies) {
        try {
            const result = await proxy();

            if (result && result.content) {
                return result;
            }
        } catch (error) {
            console.warn("Một nguồn cào bị lỗi:", error.message);
        }
    }

    return null;
}

// ======================================================
// 6. HÀM CÀO CHÍNH
// ======================================================

async function getArticle(url, manualHtml = "") {
    let parsedUrl;

    try {
        parsedUrl = new URL(String(url || "").trim());
    } catch (error) {
        alert("URL không hợp lệ. Hãy nhập đường dẫn bài báo Dân trí.");
        return null;
    }

    if (
        parsedUrl.protocol !== "https:" ||
        !(
            parsedUrl.hostname === "dantri.com.vn" ||
            parsedUrl.hostname.endsWith(".dantri.com.vn")
        )
    ) {
        alert("Chỉ hỗ trợ URL thuộc dantri.com.vn.");
        return null;
    }

    const articleUrl = parsedUrl.href;

    // Ưu tiên HTML người dùng tự dán.
    if (typeof manualHtml === "string" && manualHtml.trim().length > 300) {
        try {
            const manualResult = parseDantriDom(manualHtml, articleUrl);

            if (isValidArticleContent(manualResult)) {
                return manualResult;
            }
        } catch (error) {
            console.warn("Không phân tích được HTML đã dán:", error);
        }
    }

    const response = await fetchHtmlWithMultiProxy(articleUrl);

    if (!response) {
        alert(
            "Không lấy được bài báo tự động. Proxy có thể bị chặn hoặc lỗi. " +
            "Hãy mở bài báo, nhấn Ctrl+U, sao chép mã nguồn rồi dán vào ô HTML dự phòng."
        );
        return null;
    }

    let article = null;

    try {
        if (response.type === "markdown") {
            article = parseJinaMarkdown(response.content, articleUrl);
        } else if (response.type === "html") {
            article = parseDantriDom(response.content, articleUrl);
        }
    } catch (error) {
        console.error("Lỗi phân tích bài báo:", error);
        alert("Có lỗi khi phân tích nội dung bài báo. Hãy thử dán HTML dự phòng.");
        return null;
    }

    if (!isValidArticleContent(article)) {
        console.warn("Bài báo không đạt kiểm tra nội dung:", article);

        alert(
            "Đã nhận được dữ liệu nhưng nội dung bài báo chưa đầy đủ. " +
            "Hệ thống không lưu dữ liệu lỗi. Hãy thử lại hoặc dán HTML bài báo."
        );

        return null;
    }

    return article;
}
