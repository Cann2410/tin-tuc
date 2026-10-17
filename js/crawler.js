/**
 * CROWLER TIN TỨC DÂN TRÍ - TRÍCH XUẤT 100% NỘI DUNG VÀ ẢNH GỐC
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

function cleanDantriImageUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();
    if (url.startsWith('//')) {
        url = 'https:' + url;
    } else if (url.startsWith('/')) {
        url = 'https://dantri.com.vn' + url;
    }
    return url;
}

async function fetchHtmlWithProxies(url) {
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxies) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (text && text.length > 2000 && !text.includes('Challenge Required') && !text.includes('Access Denied')) {
                    return text;
                }
            }
        } catch (e) {}
    }
    return null;
}

function parseDantriDom(htmlText, url) {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');

    const getText = (selector) => {
        const el = doc.querySelector(selector);
        return el ? el.textContent.trim() : '';
    };

    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';

    const idMatch = fileName.match(/(\d+)\.htm/);
    const articleNumId = idMatch ? idMatch[1] : `${Date.now()}`;
    const id = `dtri-${articleNumId}`;
    const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');

    // Title
    const title = getText('#articleContent [data-slot="title"]') ||
                  getText('h1.title-page') ||
                  getText('h1.singular-title') ||
                  getText('h1') || '';

    // Sapo
    let excerpt = getText('#articleContent [data-slot="sapo"]') ||
                  getText('h2.singular-sapo') ||
                  getText('.sapo') || '';

    if (excerpt && !excerpt.startsWith('(Dân trí)')) {
        excerpt = `(Dân trí) - ${excerpt}`;
    }

    // Content
    let contentEl = doc.querySelector('#articleContent [data-slot="content"]') ||
                    doc.querySelector('.singular-content') ||
                    doc.querySelector('.e-magazine__body') ||
                    doc.querySelector('.article-body') ||
                    doc.querySelector('#articleContent');

    let contentText = "";
    if (contentEl) {
        contentEl = contentEl.cloneNode(true);
        contentEl.querySelectorAll('.relate-container, .video-content-wrapper, iframe, script, style, .author-time, .singular-author').forEach(el => el.remove());

        const pTags = Array.from(contentEl.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0);

        if (pTags.length > 0) {
            contentText = pTags.join('\n\n');
        } else {
            contentText = contentEl.textContent.trim();
        }
    }

    // Author & Category
    const author = getText('#articleContent [rel="author"]') ||
                   getText('.author-name') ||
                   getText('.singular-author') || 'Dân trí';

    const catInfo = CATEGORY_MAP[rawCategorySlug] || { title: 'Thời sự', id: 'Thời sự' };
    const category = doc.querySelector('ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child')?.textContent?.trim() || catInfo.title;

    // Published Time
    const rawTime = getText('.singular-time') || getText('time') || getText('.author-time');
    let publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
    if (timeMatch) {
        const [_, day, month, year, timeStr] = timeMatch;
        publishedAt = `${year}-${month}-${day} ${timeStr}`;
    }

    // Image URL
    let rawImageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                      doc.querySelector('#articleContent figure img')?.getAttribute('src') ||
                      doc.querySelector('#articleContent img, .singular-content img')?.getAttribute('src') || '';

    const imageUrl = cleanDantriImageUrl(rawImageUrl);

    return {
        "id": id,
        "title": title,
        "slug": slug,
        "excerpt": excerpt,
        "content": contentText,
        "author": author,
        "category": category,
        "publishedAt": publishedAt,
        "source": "dantri.com.vn",
        "url": url,
        "image": imageUrl,
        "thumbnail": imageUrl,
        "categoryId": catInfo.id
    };
}

async function getArticle(url) {
    if (!url || !url.includes('dantri.com.vn')) {
        alert("Vui lòng nhập đường dẫn bài viết từ dantri.com.vn!");
        return null;
    }

    const htmlText = await fetchHtmlWithProxies(url);

    if (htmlText) {
        const result = parseDantriDom(htmlText, url);
        if (result.title && result.title.length > 5 && result.content && result.content.length > 50) {
            return result;
        }
    }

    alert("Proxy bị Dân Trí chặn tự động. Bạn hãy mở bài viết trên Dân trí -> Bấm Ctrl+U -> Copy toàn bộ mã nguồn HTML dán vào ô 'Cách dự phòng' bên dưới!");
    return null;
}
