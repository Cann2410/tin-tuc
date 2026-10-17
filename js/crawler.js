/**
 * CROWLER TIN TỨC DÂN TRÍ - TỰ ĐỘNG VƯỢT ANTI-BOT 100%
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
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return 'https://dantri.com.vn' + url;
    return url;
}

// 1. Tầng 1: Lấy HTML thông qua AllOrigins Proxy
async function fetchViaAllOrigins(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            if (data && data.contents && data.contents.length > 2000) {
                return data.contents;
            }
        }
    } catch (e) {}
    return null;
}

// 2. Tầng 2: Vượt Cloudflare / Anti-bot bằng Jina AI Reader
async function fetchViaJina(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`https://r.jina.ai/${url}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const text = await res.text();
            if (text && text.length > 300) {
                return text;
            }
        }
    } catch (e) {}
    return null;
}

// 3. Phân tích DOM HTML Dân trí chuẩn
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

    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                  getText('#articleContent [data-slot="title"]') ||
                  getText('h1.title-page') ||
                  getText('h1.singular-title') ||
                  getText('h1') || '';

    let excerpt = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                  getText('#articleContent [data-slot="sapo"]') ||
                  getText('h2.singular-sapo') ||
                  getText('.sapo') || '';

    if (excerpt && !excerpt.startsWith('(Dân trí)')) {
        excerpt = `(Dân trí) - ${excerpt}`;
    }

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

    const author = getText('#articleContent [rel="author"]') ||
                   getText('.author-name') ||
                   getText('.singular-author') || 'Dân trí';

    const catInfo = CATEGORY_MAP[rawCategorySlug] || { title: 'Thời sự', id: 'Thời sự' };
    const category = doc.querySelector('ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child')?.textContent?.trim() || catInfo.title;

    const rawTime = getText('.singular-time') || getText('time') || getText('.author-time');
    let publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const timeMatch = rawTime ? rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/) : null;
    if (timeMatch) {
        const [_, day, month, year, timeStr] = timeMatch;
        publishedAt = `${year}-${month}-${day} ${timeStr}`;
    }

    let rawImageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                      doc.querySelector('#articleContent figure img')?.getAttribute('src') ||
                      doc.querySelector('#articleContent figure img')?.getAttribute('data-src') ||
                      doc.querySelector('.singular-content img')?.getAttribute('src') || '';

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

// 4. Phân tích nội dung Jina Markdown
function parseJinaMarkdown(text, url) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let title = '';
    let image = '';
    let contentLines = [];

    for (const line of lines) {
        if (line.startsWith('Title:')) {
            title = line.replace(/^Title:\s*/, '').trim();
        } else if (line.startsWith('# ') && !title) {
            title = line.replace(/^#\s*/, '').trim();
        } else if (line.startsWith('![')) {
            const match = line.match(/\!\[.*?\]\((.*?)\)/);
            if (match && !image) image = match[1];
        } else if (!line.startsWith('http') && !line.startsWith('URL Source:') && !line.startsWith('Markdown Content:')) {
            contentLines.push(line);
        }
    }

    const excerpt = contentLines.length > 0 ? `(Dân trí) - ${contentLines[0]}` : '(Dân trí) - Tin tức';
    const content = contentLines.slice(1).join('\n\n');

    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';
    const idMatch = fileName.match(/(\d+)\.htm/);
    const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
    const catInfo = CATEGORY_MAP[rawCategorySlug] || { title: 'Thời sự', id: 'Thời sự' };

    return {
        "id": id,
        "title": title || "Tin tức Dân trí",
        "slug": fileName.replace(/\.htm$/, ''),
        "excerpt": excerpt,
        "content": content || "Nội dung bài viết...",
        "author": "Dân trí",
        "category": catInfo.title,
        "publishedAt": new Date().toISOString().replace('T', ' ').substring(0, 16),
        "source": "dantri.com.vn",
        "url": url,
        "image": cleanDantriImageUrl(image),
        "thumbnail": cleanDantriImageUrl(image),
        "categoryId": catInfo.id
    };
}

// 5. Hàm thực thi cào tin
async function getArticle(url) {
    if (!url || !url.includes('dantri.com.vn')) {
        alert("Vui lòng nhập đúng đường dẫn bài viết từ dantri.com.vn!");
        return null;
    }

    // Thử cào qua AllOrigins
    const html = await fetchViaAllOrigins(url);
    if (html) {
        const res = parseDantriDom(html, url);
        if (res.title && res.title.length > 5) return res;
    }

    // Thử cào qua Jina AI
    const jinaText = await fetchViaJina(url);
    if (jinaText) {
        const res = parseJinaMarkdown(jinaText, url);
        if (res.title && res.title.length > 5) return res;
    }

    alert("Proxy bị chặn. Vui lòng mở bài viết trên Dân trí -> Bấm Ctrl+U -> Copy toàn bộ mã nguồn HTML dán vào ô 'Cách dự phòng'!");
    return null;
}
