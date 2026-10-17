/**
 * CROWLER TIN TỨC DÂN TRÍ - CÀO SONG SONG MULTI-PROXY (CÀO SIÊU TỐC 1-2S)
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

// Chuẩn hóa link ảnh thật từ Dân Trí (Bỏ qua ảnh rỗng data:image)
function cleanDantriImageUrl(rawUrl) {
    if (!rawUrl || rawUrl.startsWith('data:')) return '';
    let url = rawUrl.trim();
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return 'https://dantri.com.vn' + url;
    return url;
}

// Trích xuất link ảnh thực tế từ thẻ img (Ưu tiên data-original, data-src trước src)
function getImgSrcFromElement(imgEl) {
    if (!imgEl) return '';
    const src = imgEl.getAttribute('data-original') ||
                imgEl.getAttribute('data-src') ||
                imgEl.getAttribute('src') || '';
    return (src && !src.startsWith('data:')) ? src : '';
}

// Kiểm tra mã HTML hoặc Markdown có bị Cloudflare/Anti-bot chặn hay không
function isCloudflareBlocked(text) {
    if (!text || text.length < 300) return true;
    const lower = text.toLowerCase();
    return lower.includes('just a moment...') || 
           lower.includes('attention required!') || 
           lower.includes('access denied') || 
           (lower.includes('cloudflare') && lower.includes('enable javascript'));
}

// 1. KÍCH HOẠT CÀO SONG SONG SONG MULTI-PROXY (Proxy nào nhanh nhất lấy ngay)
async function fetchHtmlWithMultiProxy(url) {
    const encodedUrl = encodeURIComponent(url);

    const proxyFetchers = [
        // Proxy 1: Jina AI Reader (Vượt Cloudflare cực mạnh)
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`https://r.jina.ai/${url}`, { 
                signal: controller.signal,
                headers: { 'X-No-Cache': 'true' }
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (!isCloudflareBlocked(text)) return { type: 'markdown', content: text };
            }
            throw new Error('Jina failed');
        },
        // Proxy 2: AllOrigins JSON API
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`https://api.allorigins.win/get?url=${encodedUrl}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.contents && !isCloudflareBlocked(data.contents)) {
                    return { type: 'html', content: data.contents };
                }
            }
            throw new Error('AllOrigins JSON failed');
        },
        // Proxy 3: CodeTabs Proxy
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (!isCloudflareBlocked(text)) return { type: 'html', content: text };
            }
            throw new Error('CodeTabs failed');
        },
        // Proxy 4: AllOrigins Raw
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodedUrl}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (!isCloudflareBlocked(text)) return { type: 'html', content: text };
            }
            throw new Error('AllOrigins Raw failed');
        },
        // Proxy 5: CorsProxy.io
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`https://corsproxy.io/?${encodedUrl}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (!isCloudflareBlocked(text)) return { type: 'html', content: text };
            }
            throw new Error('CorsProxy failed');
        }
    ];

    try {
        // Trả về ngay kết quả từ Proxy đầu tiên phản hồi thành công!
        return await Promise.any(proxyFetchers.map(fn => fn()));
    } catch (e) {
        return null;
    }
}

// 2. Phân tích DOM HTML Dân trí chuẩn
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

    // Tạo tiêu đề dự phòng từ đường dẫn URL nếu DOM bị thiếu
    const slugFallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                  getText('#articleContent [data-slot="title"]') ||
                  getText('h1.title-page') ||
                  getText('h1.singular-title') ||
                  getText('h1.e-magazine__title') ||
                  getText('h1') || 
                  slugFallbackTitle;

    let excerpt = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                  getText('#articleContent [data-slot="sapo"]') ||
                  getText('h2.singular-sapo') ||
                  getText('.sapo') ||
                  getText('.e-magazine__sapo') || '';

    if (excerpt && !excerpt.startsWith('(Dân trí)')) {
        excerpt = `(Dân trí) - ${excerpt}`;
    }

    let contentEl = doc.querySelector('#articleContent [data-slot="content"]') ||
                    doc.querySelector('.singular-content') ||
                    doc.querySelector('.e-magazine__body') ||
                    doc.querySelector('.article-body') ||
                    doc.querySelector('.e-magazine__content') ||
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
                   getText('.singular-author') ||
                   getText('.e-magazine__author') || 'Dân trí';

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
                      getImgSrcFromElement(doc.querySelector('#articleContent figure img')) ||
                      getImgSrcFromElement(doc.querySelector('.singular-content img')) ||
                      getImgSrcFromElement(doc.querySelector('#articleContent img')) || '';

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

// 3. Phân tích nội dung Jina Markdown
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
            if (match && !image && !match[1].startsWith('data:')) image = match[1];
        } else if (!line.startsWith('http') && !line.startsWith('URL Source:') && !line.startsWith('Markdown Content:') && !line.startsWith('Title:')) {
            contentLines.push(line);
        }
    }

    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const rawCategorySlug = pathSegments[0] || 'thoi-su';
    const fileName = pathSegments[pathSegments.length - 1] || '';
    const idMatch = fileName.match(/(\d+)\.htm/);
    const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
    const catInfo = CATEGORY_MAP[rawCategorySlug] || { title: 'Thời sự', id: 'Thời sự' };

    const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');
    const slugFallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const excerpt = contentLines.length > 0 ? `(Dân trí) - ${contentLines[0]}` : '(Dân trí) - Tin tức';
    const content = contentLines.slice(1).join('\n\n');

    return {
        "id": id,
        "title": title || slugFallbackTitle || "Tin tức Dân trí",
        "slug": slug,
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

// 4. Hàm thực thi cào tin chính
async function getArticle(url) {
    if (!url || !url.includes('dantri.com.vn')) {
        alert("Vui lòng nhập đúng đường dẫn bài viết từ dantri.com.vn!");
        return null;
    }

    const resData = await fetchHtmlWithMultiProxy(url);

    if (resData) {
        if (resData.type === 'markdown') {
            const res = parseJinaMarkdown(resData.content, url);
            if (res.title && res.title.length > 3) return res;
        } else if (resData.type === 'html') {
            const res = parseDantriDom(resData.content, url);
            if (res.title && res.title.length > 3) return res;
        }
    }

    alert("Proxy bị chặn. Vui lòng mở bài viết trên Dân trí -> Bấm Ctrl+U -> Copy toàn bộ mã nguồn HTML dán vào ô 'Cách dự phòng'!");
    return null;
}
