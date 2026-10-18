
/**
 * CRAWLER TIN TỨC DÂN TRÍ
 * Trích xuất bài báo và chuẩn hóa JSON.
 */

// ======================================================
// 1. DANH MỤC
// ======================================================

const CATEGORY_MAP = {
    "thoi-su": "Thời sự",
    "the-gioi": "Thế giới",
    "kinh-doanh": "Kinh doanh",
    "bat-dong-san": "Bất động sản",
    "the-thao": "Thể thao",
    "lao-dong-viec-lam": "Lao động",
    "suc-khoe": "Sức khỏe",
    "van-hoa": "Văn hóa",
    "giai-tri": "Giải trí",
    "du-lich": "Du lịch",
    "phap-luat": "Pháp luật",
    "doi-song": "Đời sống",
    "cong-nghe": "Công nghệ",
    "giao-duc": "Giáo dục",
    "o-to-xe-may": "Xe ++",
    "xe": "Xe ++",
    "tinh-yeu-gioi-tinh": "Tình yêu",
    "khoa-hoc": "Khoa học",
    "tam-long-nhan-ai": "Nhân ái",
    "noi-vu": "Nội vụ",
    "no-vu": "Nội vụ"
};

// ======================================================
// 2. CHUẨN HÓA DỮ LIỆU
// ======================================================

function cleanText(value) {
    return String(value || "")
        .replace(/\u00a0/g, " ")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .trim();
}

function cleanTitle(value) {
    return cleanText(value)
        .replace(/^Title:\s*/i, "")
        .replace(/^#{1,6}\s+/, "")
        .replace(/\s*[-|]\s*Báo Dân trí\s*$/i, "")
        .replace(/\s*-\s*Dân trí\s*$/i, "")
        .trim();
}

function cleanDantriImageUrl(rawUrl, baseUrl = "https://dantri.com.vn") {
    if (!rawUrl) return "";

    let value = String(rawUrl).trim();

    if (!value || /^(data:|blob:|javascript:)/i.test(value)) {
        return "";
    }

    if (value.startsWith("//")) {
        value = "https:" + value;
    } else if (value.startsWith("/")) {
        value = new URL(value, baseUrl).href;
    } else if (!/^https?:\/\//i.test(value)) {
        return "";
    }

    try {
        const parsed = new URL(value);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return "";
        }

        return parsed.href;
    } catch {
        return "";
    }
}

function getImgSrcFromElement(img) {
    if (!img) return "";

    return cleanDantriImageUrl(
        img.getAttribute("data-original") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy-src") ||
        img.getAttribute("data-srcset")?.split(",")[0]?.trim().split(/\s+/)[0] ||
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
    const articleId = idMatch ? idMatch[1] : "";

    const slug = fileName
        .replace(/\.htm$/i, "")
        .replace(/-\d+$/, "");

    return {
        id: articleId ? "dtri-" + articleId : "dtri-" + slug,
        slug,
        categorySlug,
        categoryInfo: {
            title: CATEGORY_MAP[categorySlug] || "Thời sự",
            id: categorySlug
        }
    };
}

function titleFromSlug(slug) {
    return String(slug || "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeExcerpt(value) {
    return cleanText(value)
        .replace(/^sapo:\s*/i, "")
        .replace(/^mô tả:\s*/i, "")
        .replace(/^#{1,6}\s+/, "")
        .replace(/^\(Dân trí\)\s*[-–]\s*/i, "")
        .replace(/^Dân trí\s*[-–:]\s*/i, "")
        .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .trim();
}

/**
 * Chuẩn hóa ngày về YYYY-MM-DD HH:mm
 * Hỗ trợ ISO, ngày/tháng/năm và định dạng phổ biến.
 */
function normalizeDate(value) {
    if (!value) return "";

    const text = cleanText(value);

    // ISO: 2026-10-18T09:24:00+07:00
    let match = text.match(
        /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
    );

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
    }

    // ISO chỉ có ngày
    match = text.match(/(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    // Ngày/tháng/năm giờ:phút
    match = text.match(
        /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–,]?\s*(\d{1,2}):(\d{2})/
    );

    if (match) {
        return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")} ${match[4].padStart(2, "0")}:${match[5]}`;
    }

    // Chỉ có ngày/tháng/năm
    match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if (match) {
        return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }

    return "";
}

// ======================================================
// 3. LÀM SẠCH NỘI DUNG
// ======================================================

function normalizeContent(text) {
    if (!text) return "";

    const lines = String(text)
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.trim());

    const stopPatterns = [
        /^thêm dân trí trên google/i,
        /^không bỏ lỡ tin mới/i,
        /^đọc nhiều trong\b/i,
        /^bình luận\s*\(/i,
        /^sponsored links$/i,
        /^promoted links$/i,
        /^you may like$/i,
        /^you may also like$/i,
        /^related articles$/i,
        /^bài liên quan/i,
        /^tin liên quan/i,
        /^by taboola$/i,
        /^©\s*2005-/i,
        /^cơ quan của bộ nội vụ/i,
        /^tổng biên tập:/i,
        /^giấy phép hoạt động/i,
        /^địa chỉ tòa soạn:/i,
        /^văn phòng đại diện/i,
        /^liên hệ quảng cáo/i,
        /^theo dõi dân trí/i,
        /^đọc báo dân trí trên mobile/i,
        /^quảng cáo của\b/i
    ];

    const unwantedPatterns = [
        /^Published Time:/i,
        /^URL Source:/i,
        /^Markdown Content:/i,
        /^Title:/i,
        /^quảng cáo của\b/i,
        /^xem thêm$/i,
        /^facebook$/i,
        /^youtube$/i,
        /^tiktok$/i,
        /^telegram$/i,
        /^giọng nam/i,
        /^giọng nữ/i,
        /^tags?:$/i,
        /^ảnh:\s*/i,
        /^photo:\s*/i,
        /^chú thích ảnh:\s*/i,
        /^caption:\s*/i
    ];

    const result = [];
    let previous = "";

    for (let line of lines) {
        line = line
            .replace(/^#{1,6}\s+/, "")
            .replace(/^\*\s+/, "")
            .trim();

        if (!line) continue;

        if (stopPatterns.some(pattern => pattern.test(line))) {
            break;
        }

        if (unwantedPatterns.some(pattern => pattern.test(line))) {
            continue;
        }

        if (/^https?:\/\/\S+$/i.test(line)) continue;
        if (/^!\[[^\]]*\]\([^)]*\)$/.test(line)) continue;
        if (/^\[[^\]]*\]\(https?:\/\/[^)]+\)$/.test(line)) continue;

        if (/^(trang chủ|mới nhất|sự kiện|thế giới|thời sự|kinh doanh|giải trí|thể thao|giáo dục|du lịch|pháp luật|sức khỏe)$/i.test(line)) {
            continue;
        }

        line = line
            .replace(/\*\*/g, "")
            .replace(/`/g, "")
            .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
            .trim();

        if (line.length < 2 || line === previous) continue;

        result.push(line);
        previous = line;
    }

    return result.join("\n\n").trim();
}

function isValidArticleContent(article) {
    if (!article || !article.title || !article.content) {
        return false;
    }

    if (cleanText(article.title).length < 8) return false;
    if (cleanText(article.content).length < 150) return false;

    const badContent = [
        "Nội dung bài viết...",
        "Published Time:",
        "Markdown Content:",
        "Access denied",
        "Just a moment..."
    ];

    return !badContent.some(value =>
        article.content.includes(value)
    );
}

// ======================================================
// 4. ẢNH ĐẠI DIỆN
// ======================================================

function isLikelyLogoOrIcon(url) {
    if (!url) return true;

    let path = "";

    try {
        path = new URL(url).pathname.toLowerCase();
    } catch {
        return true;
    }

    return /logo|favicon|icon|avatar|default|placeholder|no-image|noimage/.test(path);
}

function chooseArticleImage(candidates, baseUrl) {
    for (const candidate of candidates) {
        const url = cleanDantriImageUrl(candidate, baseUrl);

        if (!url || isLikelyLogoOrIcon(url)) continue;

        // Ưu tiên ảnh CDN của Dân trí hoặc ảnh HTTP(S) hợp lệ.
        return url;
    }

    return "";
}

// ======================================================
// 5. TẠO JSON CHUẨN
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
    const cleanImage = chooseArticleImage([image], url);

    return {
        id: info.id,
        title: cleanTitle(title) || titleFromSlug(info.slug),
        slug: info.slug,
        excerpt: normalizeExcerpt(excerpt),
        content: normalizeContent(content),
        author: cleanText(author)
            .replace(/^tác giả:\s*/i, "")
            .replace(/^by\s*:\s*/i, "")
            .trim(),
        category: cleanText(category) || info.categoryInfo.title,
        publishedAt: normalizeDate(publishedAt),
        source: "dantri.com.vn",
        url,
        image: cleanImage,
        thumbnail: cleanImage,
        categoryId: info.categorySlug
    };
}

// ======================================================
// 6. PHÂN TÍCH HTML
// ======================================================

function parseDantriDom(htmlText, url) {
    const doc = new DOMParser().parseFromString(
        htmlText,
        "text/html"
    );

    const info = getUrlInfo(url);

    const getText = selector => {
        const element = doc.querySelector(selector);
        return element ? cleanText(element.textContent) : "";
    };

    const getMeta = selector => {
        const element = doc.querySelector(selector);
        return element
            ? cleanText(element.getAttribute("content"))
            : "";
    };

    // Đọc JSON-LD để dự phòng metadata.
    const structuredData = [];

    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
            const parsed = JSON.parse(script.textContent);

            const collect = item => {
                if (!item) return;

                if (Array.isArray(item)) {
                    item.forEach(collect);
                    return;
                }

                if (typeof item !== "object") return;

                structuredData.push(item);

                if (Array.isArray(item["@graph"])) {
                    item["@graph"].forEach(collect);
                }
            };

            collect(parsed);
        } catch {
            // Bỏ qua JSON-LD không hợp lệ.
        }
    });

    const articleData = structuredData.find(item => {
        const type = item["@type"];
        const types = Array.isArray(type) ? type : [type];

        return types.some(value =>
            ["NewsArticle", "Article", "ReportageNewsArticle"].includes(value)
        );
    }) || {};

    const jsonAuthor = articleData.author;
    let jsonAuthorName = "";

    if (typeof jsonAuthor === "string") {
        jsonAuthorName = jsonAuthor;
    } else if (Array.isArray(jsonAuthor)) {
        jsonAuthorName = jsonAuthor
            .map(item => typeof item === "string" ? item : item?.name || "")
            .filter(Boolean)
            .join(", ");
    } else if (jsonAuthor && typeof jsonAuthor === "object") {
        jsonAuthorName = jsonAuthor.name || "";
    }

    const title = cleanTitle(
        getMeta('meta[property="og:title"]') ||
        getMeta('meta[name="twitter:title"]') ||
        articleData.headline ||
        getText("#articleContent h1") ||
        getText("h1.title-page") ||
        getText("h1.singular-title") ||
        getText("article h1") ||
        getText("h1") ||
        titleFromSlug(info.slug)
    );

    const excerpt = normalizeExcerpt(
        getMeta('meta[property="og:description"]') ||
        getMeta('meta[name="description"]') ||
        articleData.description ||
        getText("#articleContent [data-slot='sapo']") ||
        getText("#articleContent .singular-sapo") ||
        getText(".singular-sapo") ||
        getText(".e-magazine__sapo") ||
        getText(".sapo") ||
        ""
    );

    const contentSelectors = [
        "#articleContent [data-slot='content']",
        "#articleContent .singular-content",
        "#articleContent .e-magazine__body",
        "#articleContent .e-magazine__content",
        "#articleContent .article-body",
        "[itemprop='articleBody']",
        "article .singular-content",
        "article .e-magazine__body",
        "article .article-body",
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
            "script", "style", "iframe", "button", "form",
            "nav", "header", "footer",
            "figure figcaption",
            ".relate-container", ".related-news",
            ".box-tin-lien-quan", ".article-related",
            ".related-articles", ".tags", ".article-tags",
            ".comment", ".comments", ".advertisement", ".ads",
            "[class*='related']", "[class*='recommend']",
            "[class*='comment']", "[class*='advert']",
            "[class*='banner']", "[id*='related']",
            "[id*='comment']", "[id*='ads']"
        ].join(",")).forEach(node => node.remove());

        const blocks = Array.from(
            clone.querySelectorAll("p, h2, h3, h4, blockquote")
        );

        const candidate = blocks
            .map(node => cleanText(node.textContent))
            .filter(text => text.length >= 2)
            .join("\n\n");

        if (candidate.length > contentText.length) {
            contentText = candidate;
        }

        if (contentText.length > 500) break;
    }

    if (contentText.length < 150) {
        const articleElement = doc.querySelector("article");

        if (articleElement) {
            const clone = articleElement.cloneNode(true);

            clone.querySelectorAll(
                "script, style, iframe, nav, header, footer, button, form, " +
                "figure figcaption, [class*='related'], [class*='comment'], " +
                "[class*='advert'], [class*='banner']"
            ).forEach(node => node.remove());

            contentText = Array.from(
                clone.querySelectorAll("p, h2, h3, h4, blockquote")
            )
                .map(node => cleanText(node.textContent))
                .filter(text => text.length >= 2)
                .join("\n\n");
        }
    }

    // Tác giả
    let author =
        getMeta('meta[name="author"]') ||
        getMeta('meta[property="article:author"]') ||
        jsonAuthorName ||
        getText("#articleContent [rel='author']") ||
        getText("[rel='author']") ||
        getText(".author-name") ||
        getText(".singular-author") ||
        getText(".e-magazine__author") ||
        getText("[itemprop='author']");

    if (!author) {
        const authorLink = doc.querySelector('a[href*="/tac-gia/"]');

        if (authorLink) {
            author = cleanText(authorLink.textContent);
        }
    }

    // Danh mục
    const category =
        getText("ul.breadcrumbs li:last-child a") ||
        getText(".breadcrumbs a:last-child") ||
        info.categoryInfo.title;

    // Ngày đăng: ưu tiên ngày xuất bản, không ưu tiên ngày sửa đổi.
    let publishedAt =
        getMeta('meta[property="article:published_time"]') ||
        getMeta('meta[name="pubdate"]') ||
        getMeta('meta[name="publishdate"]') ||
        getMeta('meta[itemprop="datePublished"]') ||
        articleData.datePublished ||
        doc.querySelector('[itemprop="datePublished"]')?.getAttribute("content") ||
        "";

    if (!normalizeDate(publishedAt)) {
        const timeElements = Array.from(doc.querySelectorAll("time"));

        const timeElement = timeElements.find(element =>
            Boolean(normalizeDate(
                element.getAttribute("datetime") ||
                element.textContent
            ))
        );

        if (timeElement) {
            publishedAt =
                timeElement.getAttribute("datetime") ||
                timeElement.textContent;
        }
    }

    if (!normalizeDate(publishedAt)) {
        publishedAt =
            getText(".singular-time") ||
            getText(".author-time") ||
            getMeta('meta[name="date"]') ||
            getMeta('meta[property="article:modified_time"]') ||
            "";
    }

    // Ảnh: ưu tiên ảnh đại diện, sau đó mới tìm ảnh trong phần nội dung.
    const imageCandidates = [
        getMeta('meta[property="og:image"]'),
        getMeta('meta[property="og:image:secure_url"]'),
        getMeta('meta[name="twitter:image"]'),
        getMeta('meta[name="twitter:image:src"]'),
        typeof articleData.image === "string" ? articleData.image : "",
        articleData.image?.url || ""
    ];

    const articleImageSelectors = [
        "#articleContent figure img",
        "#articleContent .singular-content img",
        "#articleContent [data-slot='content'] img",
        "article .singular-content img",
        "article figure img",
        "[itemprop='articleBody'] img"
    ];

    for (const selector of articleImageSelectors) {
        const elements = Array.from(doc.querySelectorAll(selector));

        for (const element of elements) {
            imageCandidates.push(getImgSrcFromElement(element));
        }
    }

    const image = chooseArticleImage(imageCandidates, url);

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
// 7. PHÂN TÍCH JINA MARKDOWN
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
    let excerpt = "";
    const category = info.categoryInfo.title;

    // Metadata
    for (const line of lines) {
        if (!title && /^Title:\s*/i.test(line)) {
            title = cleanTitle(line.replace(/^Title:\s*/i, ""));
        }

        if (!publishedAt && /^Published Time:\s*/i.test(line)) {
            publishedAt = line.replace(/^Published Time:\s*/i, "").trim();
        }

        if (!image && /^og:image:\s*/i.test(line)) {
            image = line.replace(/^og:image:\s*/i, "").trim();
        }
    }

    // Tiêu đề
    let titleIndex = lines.findIndex(line => {
        const text = cleanTitle(
            line.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "")
        );

        return title && text.toLowerCase() === title.toLowerCase();
    });

    if (titleIndex < 0) {
        titleIndex = lines.findIndex(line => /^#\s+/.test(line));

        if (titleIndex >= 0) {
            title = cleanTitle(lines[titleIndex].replace(/^#\s+/, ""));
        }
    }

    if (!title) title = titleFromSlug(info.slug);
    if (titleIndex < 0) titleIndex = 0;

    // Tác giả qua link trang tác giả
    const authorMatch = rawText.match(
        /\[([^\]]{2,60})\]\(https?:\/\/(?:www\.)?dantri\.com\.vn\/tac-gia\/[^)]+\)/i
    );

    if (authorMatch) {
        author = cleanText(authorMatch[1]);
    }

    if (!author) {
        const authorLine = lines
            .slice(titleIndex + 1, titleIndex + 30)
            .find(line => /^(tác giả|by)\s*:/i.test(line));

        if (authorLine) {
            author = authorLine
                .replace(/^(tác giả|by)\s*:/i, "")
                .trim();
        }
    }

    // Ngày đăng
    if (!normalizeDate(publishedAt)) {
        const dateLine = lines.find(line =>
            Boolean(normalizeDate(line)) &&
            (
                /^\d{4}-\d{2}-\d{2}/.test(line) ||
                /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line)
            )
        );

        if (dateLine) publishedAt = dateLine;
    }

    const bodyCandidates = lines.slice(titleIndex + 1);

    const isMetadataOrImage = line => {
        const text = line.trim();

        return (
            !text ||
            /^(Title|URL Source|Published Time|Markdown Content):/i.test(text) ||
            /^!\[/.test(text) ||
            /^https?:\/\//i.test(text) ||
            /^\[[^\]]*\]\(https?:\/\//.test(text)
        );
    };

    // Tìm sapo
    const sapoIndex = bodyCandidates.findIndex(line => {
        const text = line
            .replace(/^#{1,6}\s+/, "")
            .replace(/\*\*/g, "")
            .trim();

        return (
            /^\(Dân trí\)\s*[-–]/i.test(text) ||
            /^Dân trí\s*[-–:]/i.test(text)
        );
    });

    let bodyLines = [];

    if (sapoIndex >= 0) {
        excerpt = bodyCandidates[sapoIndex]
            .replace(/^#{1,6}\s+/, "")
            .trim();

        bodyLines = bodyCandidates.slice(sapoIndex + 1);
    } else {
        const firstParagraphIndex = bodyCandidates.findIndex(line => {
            const text = line
                .replace(/^#{1,6}\s+/, "")
                .replace(/\*\*/g, "")
                .trim();

            return (
                !isMetadataOrImage(text) &&
                text.length >= 80 &&
                !/^(tác giả|by)\s*:/i.test(text) &&
                !/^(ảnh|photo|caption|chú thích ảnh)\s*:/i.test(text) &&
                !/^\d{1,2}\/\d{1,2}\/\d{4}/.test(text)
            );
        });

        if (firstParagraphIndex >= 0) {
            excerpt = bodyCandidates[firstParagraphIndex]
                .replace(/^#{1,6}\s+/, "")
                .trim();

            bodyLines = bodyCandidates.slice(firstParagraphIndex);
        } else {
            bodyLines = bodyCandidates;
        }
    }

    const stopPatterns = [
        /^thêm dân trí trên google/i,
        /^không bỏ lỡ tin mới/i,
        /^hướng dẫn:/i,
        /^bình luận\s*\(/i,
        /^đọc nhiều trong\b/i,
        /^sponsored links$/i,
        /^promoted links$/i,
        /^you may like$/i,
        /^you may also like$/i,
        /^related articles$/i,
        /^bài liên quan/i,
        /^tin liên quan/i,
        /^tags?:$/i,
        /^by taboola$/i,
        /^©\s*2005-/i,
        /^cơ quan của bộ nội vụ/i,
        /^tổng biên tập:/i,
        /^giấy phép hoạt động/i,
        /^liên hệ quảng cáo/i
    ];

    const cleanedLines = [];

    for (const line of bodyLines) {
        const plain = line
            .replace(/^#{1,6}\s+/, "")
            .replace(/\*\*/g, "")
            .trim();

        if (!plain) {
            cleanedLines.push("");
            continue;
        }

        if (stopPatterns.some(pattern => pattern.test(plain))) {
            break;
        }

        if (/^(Title|URL Source|Published Time|Markdown Content):/i.test(plain)) {
            continue;
        }

        if (/^https?:\/\/\S+$/i.test(plain)) continue;
        if (/^!\[[^\]]*\]\([^)]*\)$/.test(plain)) continue;
        if (/^\[[^\]]*\]\(https?:\/\/[^)]+\)$/.test(plain)) continue;
        if (/^(tác giả|by)\s*:/i.test(plain)) continue;
        if (/^(ảnh|photo|caption|chú thích ảnh)\s*:/i.test(plain)) continue;

        if (/^\d{1,2}\/\d{1,2}\/\d{4}\s*[-–,]?\s*\d{1,2}:\d{2}$/.test(plain)) {
            continue;
        }

        cleanedLines.push(line);
    }

    const content = normalizeContent(cleanedLines.join("\n"));

    // Ảnh trong Markdown: ưu tiên ảnh từ CDN Dân trí, bỏ ảnh logo.
    const imageCandidates = [];

    if (image) imageCandidates.push(image);

    const markdownImageRegex =
        /!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+["'][^)]*["'])?\)/gi;

    let match;

    while ((match = markdownImageRegex.exec(rawText)) !== null) {
        imageCandidates.push(match[1]);
    }

    const cdnImageRegex =
        /https?:\/\/cdnphoto\.dantri\.com\.vn\/[^\s)"'<>]+/gi;

    while ((match = cdnImageRegex.exec(rawText)) !== null) {
        imageCandidates.push(match[0]);
    }

    image = chooseArticleImage(imageCandidates, url);

    return buildArticle({
        url,
        title,
        excerpt,
        content,
        author,
        category,
        publishedAt,
        image
    });
}

// ======================================================
// 8. TẢI DỮ LIỆU QUA PROXY
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

async function fetchWithTimeout(url, timeout = 15000) {
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
                18000
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
                15000
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
                15000
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

    for (const proxy of proxies) {
        try {
            const result = await proxy();

            if (result?.content) return result;
        } catch (error) {
            console.warn("Nguồn crawl bị lỗi:", error.message);
        }
    }

    return null;
}

// ======================================================
// 9. HÀM CRAWL CHÍNH
// ======================================================

async function getArticle(url, manualHtml = "") {
    let parsedUrl;

    try {
        parsedUrl = new URL(String(url || "").trim());
    } catch {
        alert("URL không hợp lệ. Hãy nhập đường dẫn bài báo Dân Trí.");
        return null;
    }

    if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        !(
            parsedUrl.hostname === "dantri.com.vn" ||
            parsedUrl.hostname.endsWith(".dantri.com.vn")
        )
    ) {
        alert("Chỉ hỗ trợ URL thuộc dantri.com.vn.");
        return null;
    }

    const articleUrl = parsedUrl.href;

    // Ưu tiên HTML do người dùng cung cấp.
    if (
        typeof manualHtml === "string" &&
        manualHtml.trim().length > 300
    ) {
        try {
            const manualResult = parseDantriDom(manualHtml, articleUrl);

            if (isValidArticleContent(manualResult)) {
                return manualResult;
            }

            console.warn("HTML dự phòng chưa đủ nội dung:", manualResult);
        } catch (error) {
            console.warn("Không phân tích được HTML dự phòng:", error);
        }
    }

    const response = await fetchHtmlWithMultiProxy(articleUrl);

    if (!response) {
        alert(
            "Không lấy được bài báo tự động. Proxy có thể bị chặn " +
            "hoặc không phản hồi. Hãy thử lại hoặc sử dụng HTML dự phòng."
        );

        return null;
    }

    let article;

    try {
        article = response.type === "markdown"
            ? parseJinaMarkdown(response.content, articleUrl)
            : parseDantriDom(response.content, articleUrl);
    } catch (error) {
        console.error("Lỗi phân tích bài báo:", error);
        alert("Có lỗi khi phân tích bài báo. Hãy thử lại.");
        return null;
    }

    if (!isValidArticleContent(article)) {
        console.warn("Bài báo chưa đạt kiểm tra nội dung:", article);

        alert(
            "Đã tải được dữ liệu nhưng nội dung bài báo chưa đầy đủ. " +
            "Hãy thử lại hoặc dùng HTML dự phòng."
        );

        return null;
    }

    return article;
}
