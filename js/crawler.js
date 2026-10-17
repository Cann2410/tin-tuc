
/**
 * CRAWLER TIN TỨC DÂN TRÍ
 * Hỗ trợ nhiều proxy, ưu tiên nội dung bài viết đầy đủ
 * Không tự tạo nội dung khi không lấy được bài thật
 */

const CATEGORY_MAP = {
    'thoi-su': { title: 'Thời sự', id: 'Thời sự' },
    'the-gioi': { title: 'Thế giới', id: 'Thế giới' },
    'kinh-doanh': { title: 'Kinh doanh', id: 'Kinh doanh' },
    'bat-dong-san': { title: 'Bất động sản', id: 'Bất động sản' },
    'the-thao': { title: 'Thể thao', id: 'Thể thao' },
    'lao-dong-viec-lam': { title: 'Lao động', id: 'Lao động' },
    'suc-khoe': { title: 'Sức khỏe', id: 'Sức khỏe' },
    'van-hoa': { title: 'Văn hóa', id: 'Văn hóa' },
    'giai-tri': { title: 'Giải trí', id: 'Giải trí' },
    'du-lich': { title: 'Du lịch', id: 'Du lịch' },
    'phap-luat': { title: 'Pháp luật', id: 'Pháp luật' },
    'doi-song': { title: 'Đời sống', id: 'Đời sống' },
    'cong-nghe': { title: 'Công nghệ', id: 'Công nghệ' },
    'giao-duc': { title: 'Giáo dục', id: 'Giáo dục' },
    'xe': { title: 'Xe ++', id: 'xe' }
};

// Chuẩn hóa URL ảnh
function cleanDantriImageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';

    const url = rawUrl.trim();

    if (!url || url.startsWith('data:')) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return 'https://dantri.com.vn' + url;

    try {
        return new URL(url, 'https://dantri.com.vn').href;
    } catch {
        return '';
    }
}

// Lấy URL ảnh từ thẻ img
function getImgSrcFromElement(imgEl) {
    if (!imgEl) return '';

    const src =
        imgEl.getAttribute('data-original') ||
        imgEl.getAttribute('data-src') ||
        imgEl.getAttribute('data-lazy-src') ||
        imgEl.getAttribute('src') ||
        '';

    return cleanDantriImageUrl(src);
}

// Kiểm tra phản hồi lỗi hoặc bị chặn
function isCloudflareBlocked(text) {
    if (!text || text.length < 300) return true;

    const lower = text.toLowerCase();

    return (
        lower.includes('just a moment...') ||
        lower.includes('attention required!') ||
        lower.includes('access denied') ||
        lower.includes('enable javascript to continue') ||
        lower.includes('error 403') ||
        lower.includes('error 503') ||
        lower.includes('request blocked')
    );
}

// Kiểm tra phản hồi có dấu hiệu là HTML bài viết
function isValidArticleHtml(text) {
    if (isCloudflareBlocked(text)) return false;

    return (
        /<html|<article|<h1|<meta[^>]+og:title/i.test(text) ||
        /articleBody|articleContent|singular-content/i.test(text)
    );
}

// Gửi yêu cầu có giới hạn thời gian
async function requestWithTimeout(requestUrl, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(requestUrl, {
            ...options,
            signal: controller.signal,
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response;
    } finally {
        clearTimeout(timer);
    }
}

// Tạo thông tin chung từ URL
function getArticleUrlInfo(url) {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';

    const idMatch = fileName.match(/(\d+)\.htm/i);
    const articleNumId = idMatch ? idMatch[1] : '';
    const id = articleNumId ? `dtri-${articleNumId}` : `dtri-${Date.now()}`;

    const slug = fileName
        .replace(/\.htm$/i, '')
        .replace(/-\d+$/, '');

    const slugFallbackTitle = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());

    const catInfo = CATEGORY_MAP[rawCategorySlug] || {
        title: 'Thời sự',
        id: 'Thời sự'
    };

    return {
        id,
        slug,
        slugFallbackTitle,
        rawCategorySlug,
        catInfo
    };
}

// Chuẩn hóa ngày xuất bản
function parsePublishedDate(rawTime) {
    if (!rawTime) return '';

    const text = String(rawTime).trim();

    // Ví dụ: 18/10/2026 - 10:30
    const match = text.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s*[-|,]?\s*(\d{1,2}:\d{2})/
    );

    if (match) {
        const [, day, month, year, time] = match;
        return `${year}-${month}-${day} ${time.padStart(5, '0')}`;
    }

    // Thử đọc ngày dạng ISO
    const isoMatch = text.match(
        /(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/
    );

    if (isoMatch) {
        return `${isoMatch[1]} ${isoMatch[2] || '00:00'}`;
    }

    return '';
}

// Chuẩn hóa văn bản, bỏ dòng rỗng liên tiếp
function normalizeArticleText(text) {
    return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Kiểm tra đoạn văn có khả năng là nội dung bài viết
function isUsefulParagraph(text) {
    const value = normalizeArticleText(text);

    if (!value) return false;
    if (value.length < 25) return false;

    const lower = value.toLowerCase();

    const excludedPhrases = [
        'bài viết liên quan',
        'tin đọc nhiều',
        'tin mới nhất',
        'xem thêm',
        'đọc thêm',
        'theo dõi dân trí',
        'chia sẻ bài viết',
        'bình luận bài viết',
        'bạn đọc phản hồi',
        'ảnh minh họa',
        'video đang được xem nhiều'
    ];

    return !excludedPhrases.some(phrase => lower.includes(phrase));
}

// Lấy nội dung từ một vùng HTML
function extractTextFromContentElement(element) {
    if (!element) return '';

    const clone = element.cloneNode(true);

    clone.querySelectorAll([
        'script',
        'style',
        'noscript',
        'iframe',
        'form',
        'button',
        'nav',
        'aside',
        '.relate-container',
        '.video-content-wrapper',
        '.author-time',
        '.singular-author',
        '.related-news',
        '.box-tin-lien-quan',
        '.article-related',
        '.social-share',
        '.box-related',
        '.comment',
        '.comment-wrapper',
        '[class*="related"]',
        '[class*="recommend"]',
        '[class*="advert"]',
        '[class*="banner"]'
    ].join(',')).forEach(el => el.remove());

    const paragraphs = Array.from(clone.querySelectorAll('p'))
        .map(p => normalizeArticleText(p.textContent))
        .filter(isUsefulParagraph);

    // Ưu tiên các đoạn văn bài viết
    if (paragraphs.length >= 2) {
        return normalizeArticleText(paragraphs.join('\n\n'));
    }

    // Dự phòng khi bài viết không dùng thẻ p
    return normalizeArticleText(clone.textContent);
}

// 1. Lấy nội dung qua nhiều proxy
async function fetchHtmlWithMultiProxy(url) {
    const encodedUrl = encodeURIComponent(url);

    const proxyFetchers = [
        // Jina Reader: thường trả về Markdown
        async () => {
            const response = await requestWithTimeout(
                `https://r.jina.ai/${url}`,
                {
                    headers: {
                        'X-No-Cache': 'true',
                        'Accept': 'text/plain'
                    }
                },
                12000
            );

            const text = await response.text();

            if (
                isCloudflareBlocked(text) ||
                !/(Title:|Markdown Content:|^# )/im.test(text)
            ) {
                throw new Error('Jina không trả về nội dung hợp lệ');
            }

            return { type: 'markdown', content: text };
        },

        // AllOrigins JSON
        async () => {
            const response = await requestWithTimeout(
                `https://api.allorigins.win/get?url=${encodedUrl}`,
                {},
                10000
            );

            const data = await response.json();

            if (
                !data ||
                typeof data.contents !== 'string' ||
                !isValidArticleHtml(data.contents)
            ) {
                throw new Error('AllOrigins JSON không hợp lệ');
            }

            return { type: 'html', content: data.contents };
        },

        // CodeTabs
        async () => {
            const response = await requestWithTimeout(
                `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`,
                {},
                10000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('CodeTabs không trả về HTML bài viết');
            }

            return { type: 'html', content: text };
        },

        // AllOrigins Raw
        async () => {
            const response = await requestWithTimeout(
                `https://api.allorigins.win/raw?url=${encodedUrl}`,
                {},
                10000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('AllOrigins Raw không hợp lệ');
            }

            return { type: 'html', content: text };
        },

        // CorsProxy
        async () => {
            const response = await requestWithTimeout(
                `https://corsproxy.io/?url=${encodedUrl}`,
                {},
                10000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('CorsProxy không trả về HTML bài viết');
            }

            return { type: 'html', content: text };
        }
    ];

    /*
     * Không dùng Promise.any để lấy proxy đầu tiên nữa.
     * Thử tất cả proxy, phân tích kết quả và chọn nội dung tốt nhất.
     */
    const results = await Promise.allSettled(
        proxyFetchers.map(fetcher => fetcher())
    );

    const validResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

    if (!validResults.length) {
        console.warn('Không proxy nào lấy được bài viết.');
        return null;
    }

    const scoredResults = validResults.map(result => {
        let article;

        try {
            article = result.type === 'markdown'
                ? parseJinaMarkdown(result.content, url)
                : parseDantriDom(result.content, url);
        } catch (error) {
            console.warn('Lỗi phân tích phản hồi proxy:', error);
            article = null;
        }

        return {
            result,
            article,
            score: scoreArticle(article)
        };
    });

    scoredResults.sort((a, b) => b.score - a.score);

    const best = scoredResults[0];

    if (!best || best.score < 1) {
        console.warn('Các proxy không trả về nội dung bài viết đủ tốt.');
        return null;
    }

    console.info(
        'Đã chọn phản hồi tốt nhất:',
        best.result.type,
        'Độ dài nội dung:',
        best.article?.content?.length || 0
    );

    return best.result;
}

// Chấm điểm chất lượng bài viết
function scoreArticle(article) {
    if (!article) return 0;

    const title = normalizeArticleText(article.title);
    const content = normalizeArticleText(article.content);
    const excerpt = normalizeArticleText(article.excerpt);

    let score = 0;

    if (title.length > 10) score += 10;
    if (excerpt.length > 30) score += 5;
    if (content.length > 100) score += 10;
    if (content.length > 500) score += 20;
    if (content.length > 1500) score += 20;
    if (content.length > 3000) score += 10;

    // Nội dung chỉ lặp lại tiêu đề không được coi là bài đầy đủ
    if (content && title && content === title) score -= 30;

    return score;
}

// 2. Phân tích HTML bài viết Dân Trí
function parseDantriDom(htmlText, url) {
    const doc = new DOMParser().parseFromString(
        htmlText,
        'text/html'
    );

    const getText = selector => {
        const el = doc.querySelector(selector);
        return el ? normalizeArticleText(el.textContent) : '';
    };

    const info = getArticleUrlInfo(url);

    const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
        getText('#articleContent [data-slot="title"]') ||
        getText('h1.title-page') ||
        getText('h1.singular-title') ||
        getText('h1.e-magazine__title') ||
        getText('h1') ||
        '';

    let excerpt =
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
        getText('#articleContent [data-slot="sapo"]') ||
        getText('h2.singular-sapo') ||
        getText('.singular-sapo') ||
        getText('.e-magazine__sapo') ||
        getText('.sapo') ||
        '';

    if (excerpt && !excerpt.startsWith('(Dân trí)')) {
        excerpt = `(Dân trí) - ${excerpt}`;
    }

    /*
     * Ưu tiên vùng nội dung bài viết cụ thể.
     * Chỉ dùng vùng rộng hơn khi không tìm được nội dung phù hợp.
     */
    const contentSelectors = [
        '#articleContent [data-slot="content"]',
        '#articleContent .singular-content',
        '.singular-content',
        '.e-magazine__body',
        '.e-magazine__content',
        '.article-body',
        '[itemprop="articleBody"]',
        '#articleContent'
    ];

    let contentText = '';

    for (const selector of contentSelectors) {
        const elements = Array.from(doc.querySelectorAll(selector));

        for (const element of elements) {
            const candidate = extractTextFromContentElement(element);

            if (candidate.length > contentText.length) {
                contentText = candidate;
            }
        }

        // Đã tìm được nội dung tương đối dài ở vùng cụ thể thì dừng.
        if (
            contentText.length > 500 &&
            selector !== '#articleContent'
        ) {
            break;
        }
    }

    // Không lưu nội dung quá ngắn như thể đó là toàn bài
    if (contentText.length < 80) {
        contentText = '';
    }

    const author =
        getText('#articleContent [rel="author"]') ||
        getText('[rel="author"]') ||
        getText('.author-name') ||
        getText('.singular-author') ||
        getText('.e-magazine__author') ||
        'Dân trí';

    const category =
        doc.querySelector(
            'ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child'
        )?.textContent?.trim() ||
        info.catInfo.title;

    const rawTime =
        doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
        doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
        getText('.singular-time') ||
        getText('time') ||
        getText('.author-time');

    const publishedAt = parsePublishedDate(rawTime);

    const rawImageUrl =
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
        getImgSrcFromElement(doc.querySelector('#articleContent figure img')) ||
        getImgSrcFromElement(doc.querySelector('.singular-content img')) ||
        getImgSrcFromElement(doc.querySelector('#articleContent img')) ||
        '';

    const imageUrl = cleanDantriImageUrl(rawImageUrl);

    return {
        id: info.id,
        title: title || info.slugFallbackTitle,
        slug: info.slug,
        excerpt,
        content: contentText,
        author,
        category,
        publishedAt,
        source: 'dantri.com.vn',
        url,
        image: imageUrl,
        thumbnail: imageUrl,
        categoryId: info.catInfo.id
    };
}

// 3. Phân tích nội dung Markdown từ Jina
function parseJinaMarkdown(text, url) {
    const lines = String(text || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const info = getArticleUrlInfo(url);

    let title = '';
    let image = '';
    const articleLines = [];

    for (const line of lines) {
        if (/^Title:/i.test(line)) {
            title = line.replace(/^Title:\s*/i, '').trim();
            continue;
        }

        if (/^#\s+/.test(line) && !title) {
            title = line.replace(/^#\s*/, '').trim();
            continue;
        }

        if (/^!\[/.test(line)) {
            const match = line.match(/!\[.*?\]\((.*?)\)/);
            if (match && !image) image = match[1];
            continue;
        }

        if (
            /^URL Source:/i.test(line) ||
            /^Markdown Content:/i.test(line) ||
            /^Title:/i.test(line) ||
            /^https?:\/\//i.test(line)
        ) {
            continue;
        }

        // Bỏ tiêu đề Markdown phụ và dòng trống
        const cleaned = line.replace(/^#{1,6}\s*/, '').trim();

        if (cleaned) articleLines.push(cleaned);
    }

    const cleanedTitle = normalizeArticleText(title);
    let excerpt = '';

    if (articleLines.length) {
        excerpt = articleLines[0];

        if (!excerpt.startsWith('(Dân trí)')) {
            excerpt = `(Dân trí) - ${excerpt}`;
        }
    }

    // Nếu dòng đầu trùng tiêu đề thì không dùng làm nội dung
    const bodyLines = articleLines.filter((line, index) => {
        if (index === 0 && cleanedTitle) {
            return line.toLowerCase() !== cleanedTitle.toLowerCase();
        }
        return true;
    });

    const content = normalizeArticleText(bodyLines.join('\n\n'));

    return {
        id: info.id,
        title: cleanedTitle || info.slugFallbackTitle || 'Tin tức Dân trí',
        slug: info.slug,
        excerpt,
        content: content.length >= 80 ? content : '',
        author: 'Dân trí',
        category: info.catInfo.title,
        publishedAt: '',
        source: 'dantri.com.vn',
        url,
        image: cleanDantriImageUrl(image),
        thumbnail: cleanDantriImageUrl(image),
        categoryId: info.catInfo.id
    };
}

// 4. Hàm cào bài viết chính
// manualHtml là HTML người dùng dán vào ô dự phòng.
async function getArticle(url, manualHtml = '') {
    let parsedUrl;

    try {
        parsedUrl = new URL(String(url || '').trim());
    } catch (error) {
        alert('Vui lòng nhập URL bài viết hợp lệ từ dantri.com.vn!');
        return null;
    }

    if (
        parsedUrl.protocol !== 'https:' ||
        !(
            parsedUrl.hostname === 'dantri.com.vn' ||
            parsedUrl.hostname.endsWith('.dantri.com.vn')
        )
    ) {
        alert('Vui lòng nhập đường dẫn bài viết từ https://dantri.com.vn/');
        return null;
    }

    const articleUrl = parsedUrl.href;

    // Ưu tiên HTML người dùng dán
    if (
        typeof manualHtml === 'string' &&
        manualHtml.trim().length > 300
    ) {
        const manualResult = parseDantriDom(manualHtml, articleUrl);

        if (
            manualResult.title &&
            manualResult.title.length > 3 &&
            manualResult.content.length >= 80
        ) {
            return manualResult;
        }

        console.warn(
            'HTML dán vào chưa lấy được nội dung bài viết đầy đủ.'
        );
    }

    // Thử tự động qua nhiều proxy
    const resData = await fetchHtmlWithMultiProxy(articleUrl);

    if (resData?.type === 'markdown') {
        const result = parseJinaMarkdown(resData.content, articleUrl);

        if (
            result.title &&
            result.title.length > 3 &&
            result.content.length >= 80
        ) {
            return result;
        }
    }

    if (resData?.type === 'html') {
        const result = parseDantriDom(resData.content, articleUrl);

        if (
            result.title &&
            result.title.length > 3 &&
            result.content.length >= 80
        ) {
            return result;
        }
    }

    alert(
        'Không lấy được nội dung bài viết đầy đủ. Proxy có thể bị chặn ' +
        'hoặc HTML trả về không chứa phần thân bài. ' +
        'Hãy mở bài Dân Trí, nhấn Ctrl+U, sao chép mã nguồn HTML đầy đủ ' +
        'và dán vào ô Cách dự phòng.'
    );

    return null;
}
