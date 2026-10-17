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
