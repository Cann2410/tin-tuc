
/**
 * CRAWLER TIN TỨC DÂN TRÍ
 * Hỗ trợ nhiều proxy, phân tích HTML/Markdown và HTML dự phòng
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

    return url;
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

// Kiểm tra HTML có khả năng chứa bài viết
function isValidArticleHtml(text) {
    if (isCloudflareBlocked(text)) return false;

    return /<html|<article|<h1|<meta[^>]+og:title/i.test(text);
}

// Gửi yêu cầu có giới hạn thời gian
async function requestWithTimeout(requestUrl, options = {}, timeout = 8000) {
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

// 1. Lấy nội dung qua nhiều proxy
async function fetchHtmlWithMultiProxy(url) {
    const encodedUrl = encodeURIComponent(url);

    const proxyFetchers = [
        // Proxy 1: Jina Reader
        async () => {
            const response = await requestWithTimeout(
                `https://r.jina.ai/${url}`,
                {
                    headers: {
                        'X-No-Cache': 'true',
                        'Accept': 'text/plain'
                    }
                },
                10000
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

        // Proxy 2: AllOrigins JSON
        async () => {
            const response = await requestWithTimeout(
                `https://api.allorigins.win/get?url=${encodedUrl}`,
                {},
                8000
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

        // Proxy 3: CodeTabs
        async () => {
            const response = await requestWithTimeout(
                `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`,
                {},
                8000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('CodeTabs không trả về HTML bài viết');
            }

            return { type: 'html', content: text };
        },

        // Proxy 4: AllOrigins Raw
        async () => {
            const response = await requestWithTimeout(
                `https://api.allorigins.win/raw?url=${encodedUrl}`,
                {},
                8000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('AllOrigins Raw không hợp lệ');
            }

            return { type: 'html', content: text };
        },

        // Proxy 5: CorsProxy
        async () => {
            const response = await requestWithTimeout(
                `https://corsproxy.io/?url=${encodedUrl}`,
                {},
                8000
            );

            const text = await response.text();

            if (!isValidArticleHtml(text)) {
                throw new Error('CorsProxy không trả về HTML bài viết');
            }

            return { type: 'html', content: text };
        }
    ];

    // Trả về proxy đầu tiên có kết quả hợp lệ
    try {
        return await Promise.any(
            proxyFetchers.map(fetcher => fetcher())
        );
    } catch (error) {
        console.warn('Không proxy nào lấy được bài viết:', error);
        return null;
    }
}

// 2. Phân tích HTML bài viết Dân Trí
function parseDantriDom(htmlText, url) {
    const doc = new DOMParser().parseFromString(
        htmlText,
        'text/html'
    );

    const getText = selector => {
        const el = doc.querySelector(selector);
        return el ? el.textContent.trim() : '';
    };

    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';

    const idMatch = fileName.match(/(\d+)\.htm/);
    const articleNumId = idMatch ? idMatch[1] : Date.now();
    const id = `dtri-${articleNumId}`;

    const slug = fileName
        .replace(/\.htm$/, '')
        .replace(/-\d+$/, '');

    const slugFallbackTitle = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());

    const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        getText('#articleContent [data-slot="title"]') ||
        getText('h1.title-page') ||
        getText('h1.singular-title') ||
        getText('h1.e-magazine__title') ||
        getText('h1') ||
        '';

    let excerpt =
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        getText('#articleContent [data-slot="sapo"]') ||
        getText('h2.singular-sapo') ||
        getText('.sapo') ||
        getText('.e-magazine__sapo') ||
        '';

    if (excerpt && !excerpt.startsWith('(Dân trí)')) {
        excerpt = `(Dân trí) - ${excerpt}`;
    }

    let contentEl =
        doc.querySelector('#articleContent [data-slot="content"]') ||
        doc.querySelector('.singular-content') ||
        doc.querySelector('.e-magazine__body') ||
        doc.querySelector('.article-body') ||
        doc.querySelector('.e-magazine__content') ||
        doc.querySelector('#articleContent');

    let contentText = '';

    if (contentEl) {
        contentEl = contentEl.cloneNode(true);

        contentEl.querySelectorAll(
            '.relate-container, .video-content-wrapper, iframe, script, style, .author-time, .singular-author'
        ).forEach(el => el.remove());

        const paragraphs = Array.from(contentEl.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(Boolean);

        contentText = paragraphs.length
            ? paragraphs.join('\n\n')
            : contentEl.textContent.trim();
    }

    const author =
        getText('#articleContent [rel="author"]') ||
        getText('.author-name') ||
        getText('.singular-author') ||
        getText('.e-magazine__author') ||
        'Dân trí';

    const catInfo = CATEGORY_MAP[rawCategorySlug] || {
        title: 'Thời sự',
        id: 'Thời sự'
    };

    const category =
        doc.querySelector(
            'ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child'
        )?.textContent?.trim() ||
        catInfo.title;

    const rawTime =
        getText('.singular-time') ||
        getText('time') ||
        getText('.author-time');

    let publishedAt = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16);

    const timeMatch = rawTime.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/
    );

    if (timeMatch) {
        const [, day, month, year, timeStr] = timeMatch;
        publishedAt = `${year}-${month}-${day} ${timeStr}`;
    }

    const rawImageUrl =
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
        getImgSrcFromElement(doc.querySelector('#articleContent figure img')) ||
        getImgSrcFromElement(doc.querySelector('.singular-content img')) ||
        getImgSrcFromElement(doc.querySelector('#articleContent img')) ||
        '';

    const imageUrl = cleanDantriImageUrl(rawImageUrl);

    return {
        id,
        title: title || slugFallbackTitle,
        slug,
        excerpt,
        content: contentText,
        author,
        category,
        publishedAt,
        source: 'dantri.com.vn',
        url,
        image: imageUrl,
        thumbnail: imageUrl,
        categoryId: catInfo.id
    };
}

// 3. Phân tích nội dung Markdown từ Jina
function parseJinaMarkdown(text, url) {
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    let title = '';
    let image = '';
    const contentLines = [];

    for (const line of lines) {
        if (line.startsWith('Title:')) {
            title = line.replace(/^Title:\s*/, '').trim();
        } else if (line.startsWith('# ') && !title) {
            title = line.replace(/^#\s*/, '').trim();
        } else if (line.startsWith('![')) {
            const match = line.match(/!\[.*?\]\((.*?)\)/);

            if (match && !image) {
                image = match[1];
            }
        } else if (
            !line.startsWith('http') &&
            !line.startsWith('URL Source:') &&
            !line.startsWith('Markdown Content:') &&
            !line.startsWith('Title:')
        ) {
            contentLines.push(line);
        }
    }

    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';

    const idMatch = fileName.match(/(\d+)\.htm/);
    const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;

    const catInfo = CATEGORY_MAP[rawCategorySlug] || {
        title: 'Thời sự',
        id: 'Thời sự'
    };

    const slug = fileName
        .replace(/\.htm$/, '')
        .replace(/-\d+$/, '');

    const slugFallbackTitle = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());

    const excerpt = contentLines.length
        ? `(Dân trí) - ${contentLines[0]}`
        : '';

    return {
        id,
        title: title || slugFallbackTitle || 'Tin tức Dân Trí',
        slug,
        excerpt,
        content: contentLines.slice(1).join('\n\n'),
        author: 'Dân trí',
        category: catInfo.title,
        publishedAt: new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 16),
        source: 'dantri.com.vn',
        url,
        image: cleanDantriImageUrl(image),
        thumbnail: cleanDantriImageUrl(image),
        categoryId: catInfo.id
    };
}

// 4. Hàm cào bài viết chính
// manualHtml là mã HTML được dán vào ô dự phòng nếu có.
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

    // Ưu tiên HTML được người dùng dán vào.
    if (typeof manualHtml === 'string' && manualHtml.trim().length > 300) {
        const manualResult = parseDantriDom(manualHtml, articleUrl);

        if (
            manualResult.title &&
            manualResult.title.length > 3 &&
            (
                manualResult.content.length > 0 ||
                manualResult.excerpt.length > 0
            )
        ) {
            return manualResult;
        }
    }

    // Thử lấy tự động qua proxy.
    const resData = await fetchHtmlWithMultiProxy(articleUrl);

    if (resData?.type === 'markdown') {
        const result = parseJinaMarkdown(resData.content, articleUrl);

        if (
            result.title &&
            result.title.length > 3 &&
            result.content.length > 0
        ) {
            return result;
        }
    }

    if (resData?.type === 'html') {
        const result = parseDantriDom(resData.content, articleUrl);

        if (
            result.title &&
            result.title.length > 3 &&
            (
                result.content.length > 0 ||
                result.excerpt.length > 0
            )
        ) {
            return result;
        }
    }

    alert(
        'Không lấy được bài viết tự động vì proxy có thể bị chặn. ' +
        'Hãy mở bài viết Dân Trí, nhấn Ctrl+U, sao chép mã nguồn HTML ' +
        'rồi dán vào ô Cách dự phòng.'
    );

    return null;
}
