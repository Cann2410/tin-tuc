function createGridHtml(postsList) {
    if (!postsList || postsList.length === 0) return '';

    const featuredLarge = postsList[0];
    const featuredSmall = postsList.slice(1, 3);

    let html = `<div class="featured-grid">`;

    if (featuredLarge) {
        const rawExcerpt = featuredLarge.excerpt || '';
        const excerptText = rawExcerpt.startsWith('(Dân trí)') ? rawExcerpt : (rawExcerpt ? `(Dân trí) - ${rawExcerpt}` : '');
        // Sử dụng ảnh gốc từ Dân Trí
        const imgUrl = featuredLarge.thumbnail || featuredLarge.image || '';

        html += `
            <div class="card-clean" onclick="renderArticleDetail('${featuredLarge.id}')">
                ${imgUrl ? `<img src="${imgUrl}" class="card-img-large" alt="thumb">` : ''}
                <div class="card-category-green">${(featuredLarge.category || 'THỜI SỰ').toUpperCase()}</div>
                <h3 class="card-title-large-green">${featuredLarge.title}</h3>
                <p class="card-excerpt-clean">${excerptText}</p>
            </div>
        `;
    }

    html += `<div class="featured-small-group">`;
    featuredSmall.forEach(post => {
        const imgUrlSmall = post.thumbnail || post.image || '';

        html += `
            <div class="card-clean" onclick="renderArticleDetail('${post.id}')">
                ${imgUrlSmall ? `<img src="${imgUrlSmall}" class="card-img-small" alt="thumb">` : ''}
                <h4 class="card-title-small-clean">${post.title}</h4>
                <div class="card-time-clean">${post.publishedAt || ''}</div>
            </div>
        `;
    });
    html += `</div></div>`;

    return html;
}
