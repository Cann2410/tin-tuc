
/* =========================================
   DAN TRI NEWS - CRAWLER.JS
   ========================================= */

(function () {
    "use strict";

    const DEFAULT_IMAGE =
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800";

    const CATEGORY_MAP = {
        "thoi-su": "Thời sự",
        "the-gioi": "Thế giới",
        "kinh-doanh": "Kinh doanh",
        "bat-dong-san": "Bất động sản",
        "the-thao": "Thể thao",
        "phap-luat": "Pháp luật",
        "suc-khoe": "Sức khỏe",
        "doi-song": "Đời sống",
        "du-lich": "Du lịch",
        "giai-tri": "Giải trí",
        "giao-duc": "Giáo dục",
        "cong-nghe": "Công nghệ"
    };

    function cleanText(value) {
        return String(value || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;|&#160;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&quot;/gi, '"')
            .replace(/&#39;|&apos;/gi, "'")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/\s+/g, " ")
            .trim();
    }

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

    function getUrlInfo(url) {
        try {
            const parsed = new URL(url);
            const parts = parsed.pathname.split("/").filter(Boolean);
            const slug = (parts.pop() || "")
                .replace(/\.html?$/i, "")
                .replace(/\.htm$/i, "");

            const categorySlug = parts[0] || "thoi-su";

            return {
                url: parsed.href,
                slug,
                categorySlug: normalizeCategoryId(categorySlug),
                category: CATEGORY_MAP[normalizeCategoryId(categorySlug)] ||
                    categorySlug.replace(/-/g, " ")
            };
        } catch {
            return {
                url: String(url || ""),
                slug: "",
                categorySlug: "thoi-su",
                category: "Thời sự"
            };
        }
    }

    function titleFromSlug(slug) {
        return String(slug || "")
            .replace(/-\d{10,}$/g, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase())
            .trim();
    }

    function normalizeDate(value) {
        if (!value) return "";

        const input = String(value).trim();

        const date = new Date(input);

        if (!Number.isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hour = String(date.getHours()).padStart(2, "0");
            const minute = String(date.getMinutes()).padStart(2, "0");

            return `${year}-${month}-${day} ${hour}:${minute}`;
        }

        const match = input.match(
            /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
        );

        if (match) {
            return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
        }

        return input;
    }

    function cleanImageUrl(value, baseUrl) {
        if (!value) return "";

        let url = String(value).trim();

        if (
            !url ||
            url.startsWith("data:") ||
            url.startsWith("blob:")
        ) {
            return "";
        }

        try {
            url = new URL(url, baseUrl).href;
        } catch {
            return "";
        }

        if (!/^https?:\/\//i.test(url)) return "";

        return url;
    }

    function getMeta(doc, selectors) {
        for (const selector of selectors) {
            const element = doc.querySelector(selector);

            if (!element) continue;

            const value =
                element.getAttribute("content") ||
                element.getAttribute("datetime") ||
                element.textContent;

            if (value && value.trim()) return value.trim();
        }

        return "";
    }

    function getJsonLd(doc) {
        const scripts = doc.querySelectorAll(
            'script[type="application/ld+json"]'
        );

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent || "");

                const queue = Array.isArray(data) ? [...data] : [data];

                while (queue.length) {
                    const item = queue.shift();

                    if (!item || typeof item !== "object") continue;

                    if (Array.isArray(item)) {
                        queue.push(...item);
                        continue;
                    }

                    if (item["@graph"]) {
                        queue.push(...item["@graph"]);
                    }

                    const type = item["@type"];
                    const types = Array.isArray(type) ? type : [type];

                    if (
                        types.some(name =>
                            /NewsArticle|Article|ReportageNewsArticle/i.test(
                                String(name || "")
                            )
                        )
                    ) {
                        return item;
                    }
                }
            } catch {
                // Bỏ qua JSON-LD không hợp lệ.
            }
        }

        return null;
    }

    function getAuthor(doc, jsonLd) {
        const jsonAuthor = jsonLd?.author;

        if (typeof jsonAuthor === "string" && jsonAuthor.trim()) {
            return cleanText(jsonAuthor);
        }

        if (Array.isArray(jsonAuthor)) {
            const names = jsonAuthor
                .map(item =>
                    typeof item === "string" ? item : item?.name
                )
                .filter(Boolean);

            if (names.length) return cleanText(names.join(", "));
        }

        if (jsonAuthor?.name) {
            return cleanText(jsonAuthor.name);
        }

        const metaAuthor = getMeta(doc, [
            'meta[name="author"]',
            'meta[property="article:author"]',
            'meta[name="parsely-author"]'
        ]);

        if (metaAuthor) return cleanText(metaAuthor);

        const selectors = [
            '[class*="author"] a',
            '[class*="author"]',
            '[rel="author"]',
            'a[href*="/tac-gia/"]'
        ];

        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            const text = cleanText(element?.textContent);

            if (
                text &&
                text.length < 100 &&
                !/tác giả|đăng ngày|cập nhật/i.test(text)
            ) {
                return text;
            }
        }

        return "";
    }

    function getArticleContent(doc) {
        const selectors = [
            '[itemprop="articleBody"]',
            '.singular-content',
            '.article-content',
            '.detail-content',
            '.content-detail',
            'article'
        ];

        let container = null;

        for (const selector of selectors) {
            const element = doc.querySelector(selector);

            if (element && element.textContent.trim().length > 150) {
                container = element;
                break;
            }
        }

        if (!container) return "";

        const clone = container.cloneNode(true);

        clone.querySelectorAll(
            "script, style, iframe, form, button, nav, " +
            "figure, picture, video, audio, svg, noscript"
        ).forEach(element => element.remove());

        clone.querySelectorAll(
            '[class*="related"], [class*="recommend"], ' +
            '[class*="social"], [class*="advert"], ' +
            '[class*="comment"], [class*="share"]'
        ).forEach(element => element.remove());

        const paragraphs = Array.from(
            clone.querySelectorAll("p, h2, h3, blockquote, li")
        );

        let lines = paragraphs
            .map(element => cleanText(element.textContent))
            .filter(text => {
                if (text.length < 20) return false;

                if (
                    /^(ảnh|photo|chú thích ảnh|nguồn ảnh)\s*:/i.test(text)
                ) {
                    return false;
                }

                if (/^(xem thêm|đọc thêm|theo dõi dân trí)/i.test(text)) {
                    return false;
                }

                return true;
            });

        if (!lines.length) {
            lines = clone.innerText
                .split(/\n+/)
                .map(cleanText)
                .filter(text => text.length >= 20);
        }

        return [...new Set(lines)].join("\n\n");
    }

    function parseDantriDom(html, url) {
        if (!html || typeof html !== "string") return null;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const info = getUrlInfo(url);
        const jsonLd = getJsonLd(doc);

        const title =
            getMeta(doc, [
                'meta[property="og:title"]',
                'meta[name="twitter:title"]'
            ]) ||
            jsonLd?.headline ||
            doc.querySelector("h1")?.textContent ||
            doc.title ||
            titleFromSlug(info.slug);

        const excerpt =
            getMeta(doc, [
                'meta[property="og:description"]',
                'meta[name="description"]',
                'meta[name="twitter:description"]'
            ]) ||
            jsonLd?.description ||
            doc.querySelector(
                '[class*="sapo"], [class*="summary"], [itemprop="description"]'
            )?.textContent ||
            "";

        let image =
            getMeta(doc, [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]'
            ]) ||
            jsonLd?.image?.url ||
            (typeof jsonLd?.image === "string" ? jsonLd.image : "");

        if (Array.isArray(jsonLd?.image)) {
            image = jsonLd.image[0]?.url || jsonLd.image[0] || image;
        }

        image = cleanImageUrl(image, url);

        const publishedAt = normalizeDate(
            getMeta(doc, [
                'meta[property="article:published_time"]',
                'meta[name="pubdate"]',
                'meta[name="publishdate"]',
                'meta[itemprop="datePublished"]',
                'time[datetime]'
            ]) ||
            jsonLd?.datePublished ||
            jsonLd?.dateModified ||
            ""
        );

        const author = getAuthor(doc, jsonLd);
        const content = getArticleContent(doc);

        const cleanTitle = cleanText(title)
            .replace(/^title:\s*/i, "");

        if (!cleanTitle || !content) {
            return null;
        }

        return {
            id: `dtri-${info.slug || Date.now()}`,
            title: cleanTitle,
            slug: info.slug,
            excerpt: cleanText(excerpt),
            content,
            thumbnail: image || DEFAULT_IMAGE,
            image: image || DEFAULT_IMAGE,
            author,
            category: info.category,
            categoryId: info.categorySlug,
            publishedAt,
            source: "dantri.com.vn",
            url: info.url
        };
    }

    function isValidArticle(article) {
        return Boolean(
            article &&
            article.title &&
            article.content &&
            article.content.length > 30
        );
    }

    async function fetchWithTimeout(url, timeout = 15000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();
        } finally {
            clearTimeout(timer);
        }
    }

    async function getArticle(url, manualHtml = "") {
        if (manualHtml) {
            const article = parseDantriDom(manualHtml, url);
            return isValidArticle(article) ? article : null;
        }

        const info = getUrlInfo(url);

        // Thử lấy HTML trực tiếp trước.
        try {
            const html = await fetchWithTimeout(url);

            const article = parseDantriDom(html, url);

            if (isValidArticle(article)) return article;
        } catch (error) {
            console.warn("Không lấy được HTML trực tiếp:", error.message);
        }

        // Dùng Jina Reader làm phương án dự phòng.
        try {
            const readerUrl =
                "https://r.jina.ai/" + info.url;

            const markdown = await fetchWithTimeout(readerUrl, 20000);
            const article = parseJinaMarkdown(markdown, info.url);

            if (isValidArticle(article)) return article;
        } catch (error) {
            console.warn("Không lấy được nội dung qua Reader:", error.message);
        }

        return null;
    }

    function parseJinaMarkdown(markdown, url) {
        if (!markdown) return null;

        const info = getUrlInfo(url);
        const lines = markdown
            .replace(/\r/g, "")
            .split("\n")
            .map(line => line.trim());

        function getMetadata(label) {
            const regex = new RegExp(
                "^" + label + "\\s*:\\s*(.+)$",
                "i"
            );

            const line = lines.find(item => regex.test(item));
            return line ? line.match(regex)?.[1]?.trim() || "" : "";
        }

        let title =
            getMetadata("Title") ||
            titleFromSlug(info.slug);

        title = title
            .replace(/^\[|\]$/g, "")
            .replace(/\s*\|\s*Báo Dân trí.*$/i, "")
            .trim();

        const imageMatch = markdown.match(
            /!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/
        );

        const image = imageMatch ? imageMatch[1] : "";

        const authorMatch =
            markdown.match(/(?:Tác giả|Author)\s*:\s*([^\n]+)/i) ||
            markdown.match(/\[([^\]]+)\]\(https?:\/\/[^)]*\/tac-gia\/[^)]*\)/i);

        const author = authorMatch ? cleanText(authorMatch[1]) : "";

        const date =
            getMetadata("Published Time") ||
            getMetadata("Date") ||
            getMetadata("Published");

        const bodyStart = lines.findIndex(line =>
            /^\(Dân trí\)|^Dân trí\s*[-–—]/i.test(line)
        );

        let contentLines = lines.slice(bodyStart >= 0 ? bodyStart : 0);

        contentLines = contentLines.filter(line => {
            if (!line) return false;
            if (/^(Title|URL Source|Published Time|Markdown Content)\s*:/i.test(line)) {
                return false;
            }
            if (/^!\[/.test(line)) return false;
            if (/^https?:\/\/\S+$/.test(line)) return false;
            if (/^#{1,6}\s/.test(line) && line.length < 15) return false;
            return true;
        });

        const content = contentLines
            .map(line => line
                .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
                .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
                .replace(/^#{1,6}\s*/, "")
                .trim()
            )
            .filter(line => line.length > 20)
            .join("\n\n");

        const excerptLine = contentLines.find(line =>
            line.length > 40 && line.length < 500
        ) || "";

        const excerpt = excerptLine
            .replace(/^\(Dân trí\)\s*[-–—]\s*/i, "")
            .replace(/^Dân trí\s*[-–—]\s*/i, "");

        const article = {
            id: `dtri-${info.slug || Date.now()}`,
            title: cleanText(title),
            slug: info.slug,
            excerpt: cleanText(excerpt),
            content,
            thumbnail: cleanImageUrl(image, url) || DEFAULT_IMAGE,
            image: cleanImageUrl(image, url) || DEFAULT_IMAGE,
            author,
            category: info.category,
            categoryId: info.categorySlug,
            publishedAt: normalizeDate(date),
            source: "dantri.com.vn",
            url: info.url
        };

        return article;
    }

    // Đưa các hàm ra phạm vi toàn cục để main.js gọi được.
    window.parseDantriDom = parseDantriDom;
    window.parseJinaMarkdown = parseJinaMarkdown;
    window.getArticle = getArticle;
    window.normalizeCategoryId = normalizeCategoryId;

})();
