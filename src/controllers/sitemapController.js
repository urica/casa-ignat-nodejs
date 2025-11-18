/**
 * Sitemap Controller
 * Generează sitemap.xml dinamic pentru SEO
 */

const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const Service = require('../models/Service');
const Page = require('../models/Page');
const TeamMember = require('../models/TeamMember');
const Room = require('../models/Room');

/**
 * Generează și returnează sitemap.xml
 */
exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

    // Fetch all data needed for sitemap
    const [blogPosts, blogCategories, services, pages, teamMembers, rooms] = await Promise.all([
      BlogPost.find({ status: 'published' }).select('slug updatedAt').lean(),
      BlogCategory.find({ isActive: true }).select('slug updatedAt').lean(),
      Service.find({ available: true }).select('slug updatedAt').lean(),
      Page.find({ status: 'published' }).select('slug updatedAt').lean(),
      TeamMember.find({ available: true }).select('slug updatedAt').lean(),
      Room.find({ available: true }).select('slug updatedAt').lean()
    ]);

    // Build sitemap URLs array
    const urls = [];

    // Homepage - highest priority
    urls.push({
      loc: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    });

    // Static pages - high priority
    const staticPages = [
      { path: '/despre', priority: '0.9' },
      { path: '/servicii', priority: '0.9' },
      { path: '/echipa', priority: '0.8' },
      { path: '/blog', priority: '0.8' },
      { path: '/contact', priority: '0.8' },
      { path: '/galerie', priority: '0.7' },
      { path: '/camere', priority: '0.7' },
      { path: '/restaurant', priority: '0.7' }
    ];

    staticPages.forEach(page => {
      urls.push({
        loc: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: page.priority
      });
    });

    // Blog categories - medium-high priority
    blogCategories.forEach(category => {
      urls.push({
        loc: `${baseUrl}/blog/categorie/${category.slug}`,
        lastmod: new Date(category.updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    // Blog posts - medium-high priority
    blogPosts.forEach(post => {
      urls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: new Date(post.updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.7'
      });
    });

    // Services - high priority
    services.forEach(service => {
      urls.push({
        loc: `${baseUrl}/servicii/${service.slug}`,
        lastmod: new Date(service.updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.8'
      });
    });

    // Team members - medium priority
    teamMembers.forEach(member => {
      urls.push({
        loc: `${baseUrl}/echipa/${member.slug}`,
        lastmod: new Date(member.updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.6'
      });
    });

    // Rooms - medium priority
    rooms.forEach(room => {
      urls.push({
        loc: `${baseUrl}/camere/${room.slug}`,
        lastmod: new Date(room.updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.6'
      });
    });

    // Custom pages from database
    pages.forEach(page => {
      urls.push({
        loc: `${baseUrl}/${page.slug}`,
        lastmod: new Date(page.updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.6'
      });
    });

    // Generate XML
    const xml = generateSitemapXML(urls);

    // Set headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return res.send(xml);
  } catch (error) {
    console.error('Eroare la generarea sitemap:', error);
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
  }
};

/**
 * Generează XML pentru sitemap
 */
function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXML(url.loc)}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    if (url.priority) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = exports;
