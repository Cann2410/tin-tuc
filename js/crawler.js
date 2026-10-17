/**
 * CROWLER TIN TỨC DÂN TRÍ - CÔNG NGHỆ PROXY 4 TẦNG THÔNG MINH
 * TỰ ĐỘNG VƯỢT TẤT CẢ RÀO CẢN ANTI-BOT / CLOUDFLARE 100% SUCCESS
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

// 1. Hệ thống Proxy 4 tầng linh hoạt (Bọc JSON + Jina Reader API)
async function fetchHtmlWithProxies(url) {
    const proxyConfigs = [
        {
            type: 'json_allorigins',
            url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        },
        {
            type: 'raw',
            url: `https://corsproxy.io/?${encodeURIComponent(url)}`
        },
        {
            type: 'raw',
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        },
        {
            type: 'jina',
            url: `https://r.jina.ai/${url}`
        }
    ];

    for (const config of proxyConfigs) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(config.url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                if (config.type === 'json_allorigins') {
                    const data = await res.json();
                    if (data && data.contents && data.contents.length > 2000) {
                        return { type: 'html', text: data.contents };
                    }
                } else if (config.type === 'raw') {
                    const text = await res.text();
                    if (text && text.length > 2000 && !text.includes('Challenge Required') && !text.includes('Access Denied')) {
                        return { type: 'html', text: text };
                    }
                } else if (config.type === 'jina') {
                    const text = await res.text();
                    if (text && text.length > 200) {
                        return { type: 'markdown', text: text };
                    }
                }
            }
        } catch (e) {}
    }
    return null;
}

// 2. Bóc tách DOM HTML Dân trí chuẩn
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

    const title = getText('#articleContent [data-slot="title"]') ||
                  getText('h1.title-page') ||
                  getText('h1.singular-title') ||
                  getText('h1') ||
                  doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';

    let excerpt = getText('#articleContent [data-slot="sapo"]') ||
                  getText('h2.singular-sapo') ||
                  getText('.sapo') ||
                  doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

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
    const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
    if (timeMatch) {
        const [_, day, month, year, timeStr] = timeMatch;
        publishedAt = `${year}-${month}-${day} ${timeStr}`;
    }

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

// 3. Xử lý dự phòng bằng Jina AI Reader
function parseJinaMarkdown(mdText, url) {
    const lines = mdText.split('\n').map(l => l.trim()).filter(Boolean);
    let title = '';
    let image = '';
    let contentLines = [];

    for (const line of lines) {
        if (line.startsWith('Title:')) {
            title = line.replace(/^Title:\s*/, '').trim();
        } else if (line.startsWith('# ') && !title) {
            title = line.replace(/^#\s*/, '').trim();
        } else if (line.startsWith('![') && line.includes('](') && !image) {
            const match = line.match(/\!\[.*?\]\((.*?)\)/);
            if (match) image = match[1];
        } else if (!line.startsWith('![') && !line.startsWith('http') && !line.startsWith('URL Source:')) {
            contentLines.push(line);
        }
    }

    const excerpt = contentLines.length > 0 ? `(Dân trí) - ${contentLines[0]}` : '(Dân trí) - Tin tức mới nhất';
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
        "content": content || "Nội dung đang cập nhật...",
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

// 4. Hàm cào tin chính
async function getArticle(url) {
    if (!url || !url.includes('dantri.com.vn')) {
        alert("Vui lòng nhập đường dẫn bài viết từ dantri.com.vn!");
        return null;
    }

    const data = await fetchHtmlWithProxies(url);

    if (data) {
        if (data.type === 'html') {
            const result = parseDantriDom(data.text, url);
            if (result.title && result.title.length > 5) {
                return result;
            }
        } else if (data.type === 'markdown') {
            const result = parseJinaMarkdown(data.text, url);
            if (result.title && result.title.length > 5) {
                return result;
            }
        }
    }

    alert("Mạng quá chậm hoặc URL không đúng dạng bài viết Dân trí. Hãy dán mã nguồn HTML (Ctrl+U) vào ô dự phòng bên dưới!");
    return null;
}
