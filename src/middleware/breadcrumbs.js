/**
 * Breadcrumbs Middleware
 * Generează automat breadcrumbs pe baza URL-ului curent
 */

const { generateBreadcrumbs } = require('../utils/seoHelpers');

/**
 * Custom names pentru segmente URL specifice
 * Mapează slug-uri la nume user-friendly
 */
const customSegmentNames = {
  // Romanian route names
  'despre': 'Despre Noi',
  'servicii': 'Servicii',
  'echipa': 'Echipa Noastră',
  'blog': 'Blog',
  'contact': 'Contact',
  'galerie': 'Galerie',
  'camere': 'Camere',
  'restaurant': 'Restaurant',
  'meniu': 'Meniu',
  'rezervare': 'Rezervare',

  // Admin routes
  'admin': 'Administrare',
  'dashboard': 'Panou de Control',
  'settings': 'Setări',
  'create': 'Creare Nouă',
  'edit': 'Editare',

  // Other common routes
  'cautare': 'Căutare',
  'articol': 'Articol',
  'profil': 'Profil'
};

/**
 * Middleware pentru generarea automată a breadcrumbs
 */
function autoBreadcrumbs(req, res, next) {
  // Skip pentru API, admin login, și alte rute specifice
  if (
    req.path.startsWith('/api') ||
    req.path === '/admin/login' ||
    req.path === '/health' ||
    req.path === '/sitemap.xml' ||
    req.path === '/robots.txt'
  ) {
    return next();
  }

  // Generează breadcrumbs dacă nu există deja
  if (!res.locals.breadcrumbs) {
    const baseUrl = res.locals.settings?.siteUrl || `${req.protocol}://${req.get('host')}`;
    const breadcrumbs = generateBreadcrumbs(req.path, customSegmentNames);

    // Adaugă base URL la fiecare breadcrumb
    res.locals.breadcrumbs = breadcrumbs.map(bc => ({
      ...bc,
      url: bc.url === '/' ? baseUrl : `${baseUrl}${bc.url}`
    }));
  }

  next();
}

/**
 * Helper pentru a crea breadcrumbs custom în controllere
 * Exemplu de utilizare în controller:
 *
 * const breadcrumbs = createCustomBreadcrumbs([
 *   { name: 'Acasă', url: '/' },
 *   { name: 'Blog', url: '/blog' },
 *   { name: post.title, url: `/blog/${post.slug}` }
 * ], req);
 */
function createCustomBreadcrumbs(items, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return items.map(item => ({
    name: item.name,
    url: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
  }));
}

module.exports = {
  autoBreadcrumbs,
  createCustomBreadcrumbs,
  customSegmentNames
};
