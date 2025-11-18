/**
 * Image Helpers for Responsive Images
 * Generates srcset, sizes, and optimized image tags
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate responsive image sizes
 * @param {string} imagePath - Original image path
 * @param {Array} sizes - Array of widths to generate
 * @returns {Promise<Array>} - Array of generated image paths
 */
async function generateResponsiveImages(imagePath, sizes = [320, 640, 768, 1024, 1280, 1920]) {
    const results = [];
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);

    for (const size of sizes) {
        try {
            const outputPath = path.join(dir, `${basename}-${size}w${ext}`);

            await sharp(imagePath)
                .resize(size, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: 85, progressive: true })
                .toFile(outputPath);

            results.push({
                width: size,
                path: outputPath,
                url: outputPath.replace(/^.*public/, '')
            });
        } catch (error) {
            console.error(`Error generating ${size}w image:`, error);
        }
    }

    return results;
}

/**
 * Generate WebP versions
 * @param {string} imagePath - Original image path
 * @param {Array} sizes - Array of widths
 * @returns {Promise<Array>} - Array of WebP image paths
 */
async function generateWebPImages(imagePath, sizes = [320, 640, 768, 1024, 1280, 1920]) {
    const results = [];
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);

    for (const size of sizes) {
        try {
            const outputPath = path.join(dir, `${basename}-${size}w.webp`);

            await sharp(imagePath)
                .resize(size, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .webp({ quality: 85 })
                .toFile(outputPath);

            results.push({
                width: size,
                path: outputPath,
                url: outputPath.replace(/^.*public/, '')
            });
        } catch (error) {
            console.error(`Error generating ${size}w WebP:`, error);
        }
    }

    return results;
}

/**
 * Generate srcset string
 * @param {Array} images - Array of image objects with url and width
 * @returns {string} - srcset string
 */
function generateSrcset(images) {
    return images
        .map(img => `${img.url} ${img.width}w`)
        .join(', ');
}

/**
 * Generate sizes attribute
 * @param {Object} breakpoints - Object with breakpoint: size pairs
 * @returns {string} - sizes string
 */
function generateSizes(breakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
    'default': '25vw'
}) {
    const sizes = [];

    for (const [bp, size] of Object.entries(breakpoints)) {
        if (bp === 'default') {
            sizes.push(size);
        } else {
            sizes.push(`${bp} ${size}`);
        }
    }

    return sizes.join(', ');
}

/**
 * Generate responsive image HTML
 * @param {string} src - Original image source
 * @param {Object} options - Options for image generation
 * @returns {string} - HTML picture element
 */
function generateResponsiveImageHTML(src, options = {}) {
    const {
        alt = '',
        className = '',
        loading = 'lazy',
        sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
        srcset = '',
        webpSrcset = '',
        width,
        height,
        aspectRatio = '16/9'
    } = options;

    let html = '<picture>';

    // WebP source
    if (webpSrcset) {
        html += `<source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">`;
    }

    // JPEG/PNG source
    if (srcset) {
        html += `<source type="image/jpeg" srcset="${srcset}" sizes="${sizes}">`;
    }

    // Fallback img
    html += `<img src="${src}" alt="${alt}" class="${className}" loading="${loading}"`;

    if (width) html += ` width="${width}"`;
    if (height) html += ` height="${height}"`;
    if (aspectRatio) html += ` style="aspect-ratio: ${aspectRatio}"`;

    html += '>';
    html += '</picture>';

    return html;
}

/**
 * Generate lazy load image HTML
 * @param {string} src - Image source
 * @param {Object} options - Options
 * @returns {string} - HTML with data-src for lazy loading
 */
function generateLazyLoadHTML(src, options = {}) {
    const {
        alt = '',
        className = 'img-lazy',
        srcset = '',
        sizes = '',
        placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
        aspectRatio = '16/9'
    } = options;

    let html = `<img src="${placeholder}" data-src="${src}"`;

    if (srcset) html += ` data-srcset="${srcset}"`;
    if (sizes) html += ` sizes="${sizes}"`;

    html += ` alt="${alt}" class="${className}"`;
    html += ` style="aspect-ratio: ${aspectRatio}"`;
    html += '>';

    return html;
}

/**
 * Optimize image for web
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output image path
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} - Optimization result
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
    const {
        width,
        height,
        quality = 85,
        format = 'jpeg',
        progressive = true
    } = options;

    try {
        const pipeline = sharp(inputPath);

        // Resize if dimensions provided
        if (width || height) {
            pipeline.resize(width, height, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        // Apply format-specific options
        if (format === 'jpeg') {
            pipeline.jpeg({ quality, progressive });
        } else if (format === 'webp') {
            pipeline.webp({ quality });
        } else if (format === 'png') {
            pipeline.png({ quality, progressive });
        }

        // Save optimized image
        const info = await pipeline.toFile(outputPath);

        return {
            success: true,
            path: outputPath,
            size: info.size,
            width: info.width,
            height: info.height,
            format: info.format
        };
    } catch (error) {
        console.error('Image optimization error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get image metadata
 * @param {string} imagePath - Image path
 * @returns {Promise<Object>} - Image metadata
 */
async function getImageMetadata(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();

        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
            size: (await fs.stat(imagePath)).size
        };
    } catch (error) {
        console.error('Get metadata error:', error);
        return null;
    }
}

/**
 * Generate blur placeholder
 * @param {string} imagePath - Original image path
 * @returns {Promise<string>} - Base64 blur placeholder
 */
async function generateBlurPlaceholder(imagePath) {
    try {
        const buffer = await sharp(imagePath)
            .resize(20, 20, { fit: 'inside' })
            .blur(10)
            .toBuffer();

        const base64 = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('Blur placeholder error:', error);
        return null;
    }
}

/**
 * Calculate aspect ratio
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Aspect ratio as string (e.g., "16/9")
 */
function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}/${height / divisor}`;
}

module.exports = {
    generateResponsiveImages,
    generateWebPImages,
    generateSrcset,
    generateSizes,
    generateResponsiveImageHTML,
    generateLazyLoadHTML,
    optimizeImage,
    getImageMetadata,
    generateBlurPlaceholder,
    calculateAspectRatio
};
