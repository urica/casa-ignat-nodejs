# Documentație SEO - Casa Ignat

Această documentație descrie sistemul SEO complet implementat pentru Casa Ignat, incluzând structured data (JSON-LD), meta tags dinamice, breadcrumbs, sitemap dinamic și altele.

## 📋 Cuprins

1. [Componente Implementate](#componente-implementate)
2. [Structured Data (JSON-LD)](#structured-data-json-ld)
3. [Meta Tags Dinamice](#meta-tags-dinamice)
4. [Breadcrumbs](#breadcrumbs)
5. [Sitemap și Robots.txt](#sitemap-și-robotstxt)
6. [Utilizare în Controllere](#utilizare-în-controllere)
7. [Configurare Variabile de Mediu](#configurare-variabile-de-mediu)
8. [Validare și Testare](#validare-și-testare)
9. [Best Practices](#best-practices)

---

## Componente Implementate

### ✅ ON-PAGE SEO

- **Meta Tags Dinamice**: Title, description, keywords, Open Graph, Twitter Cards
- **Canonical URLs**: Implementate automat pe toate paginile
- **Robots Meta Tags**: Control indexare per pagină (index/noindex, follow/nofollow)
- **Breadcrumbs**: UI + Schema markup automat
- **Alt Text**: Suport pentru imagini (existent în modele)

### ✅ SCHEMA MARKUP (JSON-LD)

- **Organization & LocalBusiness**: Date despre business
- **BlogPosting**: Pentru articole de blog
- **Person**: Pentru membrii echipei
- **MedicalService / Service**: Pentru servicii
- **FAQPage**: Pentru pagini cu întrebări frecvente
- **WebSite**: Pentru Sitelinks Search Box
- **BreadcrumbList**: Pentru breadcrumbs în SERP

### ✅ TECHNICAL SEO

- **Sitemap.xml**: Generat dinamic din baza de date
- **Robots.txt**: Configurat cu reguli pentru crawlere
- **404 Page**: Pagină customizată cu SEO
- **Performanță**: Compression, caching, optimizări existente

### ✅ RICH SNIPPETS

- **Review Stars**: Suport prin aggregate rating în schema
- **FAQ Expandable**: Schema FAQPage
- **Breadcrumbs în SERP**: Schema BreadcrumbList
- **Sitelinks Search Box**: Schema WebSite cu SearchAction

---

## Structured Data (JSON-LD)

### Locație Partialuri

Toate schema-urile sunt în `views/partials/seo/`:

```
views/partials/seo/
├── meta-tags.ejs           # Meta tags complete
├── schema-organization.ejs # Organization & LocalBusiness
├── schema-website.ejs      # WebSite + Sitelinks Search Box
├── schema-blog-post.ejs    # BlogPosting
├── schema-person.ejs       # Person (echipă)
├── schema-service.ejs      # MedicalService / Service
├── schema-faq.ejs          # FAQPage
└── schema-breadcrumb.ejs   # BreadcrumbList
```

### Utilizare în Layout

Toate schema-urile sunt incluse automat în `views/layouts/main.ejs`. Schema-urile specifice paginilor se activează prin variabila `schemaType`.

**Exemplu - Blog Post:**

```javascript
// În controller
res.render('pages/blog-post', {
  title: post.title,
  description: post.excerpt,
  schemaType: 'blogPost',
  post: post,
  breadcrumbs: [
    { name: 'Acasă', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` }
  ]
});
```

### Tipuri de Schema Disponibile

| schemaType | Necesită variabilă | Descriere |
|------------|-------------------|-----------|
| `blogPost` | `post` | Articol de blog |
| `person` | `person` | Membru echipă |
| `service` | `service` | Serviciu medical/general |
| `faq` | `faqs` (array) | Pagină FAQ |

**Notă**: `Organization`, `LocalBusiness` și `WebSite` schema sunt incluse automat pe toate paginile.

---

## Meta Tags Dinamice

### Structură SEO Object

Toate paginile pot transmite un obiect `seo` cu următoarele câmpuri:

```javascript
{
  title: 'Titlu pagină (50-60 caractere)',
  description: 'Descriere pagină (150-160 caractere)',
  keywords: ['keyword1', 'keyword2'] sau 'keyword1, keyword2',
  image: '/path/to/og-image.jpg',
  type: 'website' | 'article',
  author: 'Nume autor',
  canonical: 'https://casa-ignat.ro/pagina',
  noIndex: false,  // true pentru a preveni indexarea
  noFollow: false, // true pentru a preveni follow-ul link-urilor
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: '2024-01-02T00:00:00Z',
  tags: ['tag1', 'tag2']
}
```

### Exemplu Complet în Controller

```javascript
exports.show = async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug });

  res.render('pages/blog-post', {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    seo: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      keywords: post.seo?.keywords || post.tags,
      image: post.seo?.ogImage || post.featuredImage,
      type: 'article',
      author: post.author?.name || 'Casa Ignat',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags
    },
    schemaType: 'blogPost',
    post: post,
    breadcrumbs: [
      { name: 'Acasă', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.title, url: `/blog/${post.slug}` }
    ]
  });
};
```

---

## Breadcrumbs

### Breadcrumbs Automate

Middleware-ul `autoBreadcrumbs` generează automat breadcrumbs pe baza URL-ului:

```
URL: /blog/articol-exemplu
Breadcrumbs:
  - Acasă (/)
  - Blog (/blog)
  - Articol Exemplu (/blog/articol-exemplu)
```

### Custom Breadcrumbs în Controller

Pentru control complet, poți seta breadcrumbs manual:

```javascript
const { createCustomBreadcrumbs } = require('../middleware/breadcrumbs');

exports.show = async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug });

  const breadcrumbs = createCustomBreadcrumbs([
    { name: 'Acasă', url: '/' },
    { name: 'Servicii', url: '/servicii' },
    { name: service.name, url: `/servicii/${service.slug}` }
  ], req);

  res.render('pages/service-detail', {
    title: service.name,
    service: service,
    breadcrumbs: breadcrumbs,
    schemaType: 'service'
  });
};
```

### Personalizare Nume Segmente

Editează `src/middleware/breadcrumbs.js` pentru a adăuga nume custom:

```javascript
const customSegmentNames = {
  'despre': 'Despre Noi',
  'servicii': 'Servicii',
  'echipa': 'Echipa Noastră',
  // ... adaugă mai multe
};
```

---

## Sitemap și Robots.txt

### Sitemap.xml Dinamic

**URL**: `https://casa-ignat.ro/sitemap.xml`

Sitemap-ul este generat automat din:
- Pagini statice (home, despre, servicii, contact, etc.)
- Blog posts (status: published)
- Servicii (available: true)
- Membri echipă (available: true)
- Camere (available: true)
- Pagini custom din baza de date

**Configurare priorități** în `src/controllers/sitemapController.js`:

```javascript
// Homepage - highest priority
{ loc: baseUrl, priority: '1.0', changefreq: 'daily' }

// Static pages
{ loc: '/servicii', priority: '0.9', changefreq: 'weekly' }

// Blog posts
{ loc: '/blog/post-slug', priority: '0.7', changefreq: 'monthly' }
```

### Robots.txt

**URL**: `https://casa-ignat.ro/robots.txt`

Configurare în `src/routes/index.js`:

```
User-agent: *
Allow: /

Sitemap: https://casa-ignat.ro/sitemap.xml

Disallow: /admin/
Disallow: /api/private/
```

---

## Utilizare în Controllere

### 1. Pagină Simplă (fără schema specifică)

```javascript
exports.index = (req, res) => {
  res.render('pages/contact', {
    title: 'Contact | Casa Ignat',
    description: 'Contactați Casa Ignat pentru consultații de nutriție',
    seo: {
      title: 'Contact | Casa Ignat',
      description: 'Contactați Casa Ignat pentru consultații de nutriție',
      keywords: ['contact', 'programare', 'consultație nutriție']
    }
  });
};
```

### 2. Articol Blog (cu BlogPosting schema)

```javascript
exports.showPost = async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug })
    .populate('author');

  res.render('pages/blog-post', {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    seo: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      keywords: post.seo?.keywords || post.tags,
      image: post.seo?.ogImage || post.featuredImage,
      type: 'article',
      author: post.author?.name,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt
    },
    schemaType: 'blogPost',
    post: {
      ...post.toObject(),
      url: `/blog/${post.slug}`,
      wordCount: post.content.split(' ').length,
      readingTime: Math.ceil(post.content.split(' ').length / 200)
    },
    breadcrumbs: [
      { name: 'Acasă', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.title, url: `/blog/${post.slug}` }
    ]
  });
};
```

### 3. Membru Echipă (cu Person schema)

```javascript
exports.showTeamMember = async (req, res) => {
  const member = await TeamMember.findOne({ slug: req.params.slug });

  res.render('pages/team-member', {
    title: `${member.name} - ${member.position} | Casa Ignat`,
    description: member.seo?.metaDescription || member.bio.substring(0, 160),
    seo: {
      title: member.seo?.metaTitle || `${member.name} - ${member.position}`,
      description: member.seo?.metaDescription || member.bio.substring(0, 160),
      keywords: member.seo?.keywords || member.specializations,
      image: member.photo,
      type: 'profile'
    },
    schemaType: 'person',
    person: {
      ...member.toObject(),
      url: `/echipa/${member.slug}`
    },
    breadcrumbs: [
      { name: 'Acasă', url: '/' },
      { name: 'Echipa', url: '/echipa' },
      { name: member.name, url: `/echipa/${member.slug}` }
    ]
  });
};
```

### 4. Serviciu (cu MedicalService schema)

```javascript
exports.showService = async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug });

  res.render('pages/service-detail', {
    title: service.seo?.metaTitle || service.name,
    description: service.seo?.metaDescription || service.description,
    seo: {
      title: service.seo?.metaTitle || service.name,
      description: service.seo?.metaDescription || service.description,
      keywords: service.seo?.keywords,
      type: 'website'
    },
    schemaType: 'service',
    service: {
      ...service.toObject(),
      url: `/servicii/${service.slug}`
    },
    breadcrumbs: [
      { name: 'Acasă', url: '/' },
      { name: 'Servicii', url: '/servicii' },
      { name: service.name, url: `/servicii/${service.slug}` }
    ]
  });
};
```

### 5. Pagină FAQ (cu FAQPage schema)

```javascript
exports.faq = (req, res) => {
  const faqs = [
    {
      question: 'Ce este nutriția?',
      answer: 'Nutriția este știința care studiază...'
    },
    {
      question: 'Cum pot programa o consultație?',
      answer: 'Puteți programa o consultație prin...'
    }
  ];

  res.render('pages/faq', {
    title: 'Întrebări Frecvente | Casa Ignat',
    description: 'Răspunsuri la întrebările frecvente despre serviciile de nutriție',
    seo: {
      title: 'Întrebări Frecvente | Casa Ignat',
      description: 'Răspunsuri la întrebările frecvente despre serviciile de nutriție',
      keywords: ['FAQ', 'întrebări', 'răspunsuri', 'nutriție']
    },
    schemaType: 'faq',
    faqs: faqs,
    breadcrumbs: [
      { name: 'Acasă', url: '/' },
      { name: 'FAQ', url: '/faq' }
    ]
  });
};
```

---

## Configurare Variabile de Mediu

Adaugă următoarele variabile în `.env`:

```bash
# SEO & Business Info
SITE_URL=https://casa-ignat.ro
CONTACT_PHONE=+40123456789
CONTACT_EMAIL=contact@casa-ignat.ro

# Address
ADDRESS_STREET=Strada Exemplu, Nr. 123
ADDRESS_CITY=București
ADDRESS_REGION=București
ADDRESS_POSTAL_CODE=012345

# Social Media
SOCIAL_FACEBOOK=https://facebook.com/casaignat
SOCIAL_INSTAGRAM=https://instagram.com/casaignat
SOCIAL_LINKEDIN=https://linkedin.com/company/casaignat
```

Aceste variabile sunt folosite automat în schema Organization/LocalBusiness.

---

## Validare și Testare

### Google Tools

1. **Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Testează toate paginile cu structured data

2. **Google Search Console**
   - Înregistrează site-ul
   - Verifică indexarea și structured data
   - Submit sitemap.xml

3. **PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Verifică performanța și Core Web Vitals

### Schema Validators

1. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Validează JSON-LD

2. **Google Structured Data Testing Tool**
   - URL: https://developers.google.com/search/docs/appearance/structured-data

### Verificare Locală

```bash
# Testează sitemap.xml
curl http://localhost:3000/sitemap.xml

# Testează robots.txt
curl http://localhost:3000/robots.txt

# Testează 404 page
curl http://localhost:3000/pagina-inexistenta
```

---

## Best Practices

### 1. Meta Tags

- **Title**: 50-60 caractere, include keyword-ul principal
- **Description**: 150-160 caractere, call-to-action
- **Keywords**: 5-10 keywords relevante
- **Images**: Folosește imagini optimizate (min 1200x630px pentru OG)

### 2. Structured Data

- **Testează mereu**: Folosește Rich Results Test înainte de deploy
- **Evită duplicarea**: Nu include același schema de mai multe ori
- **Folosește date reale**: Nu crea date false pentru reviews/ratings
- **Actualizează datele**: Ține schema sincronizate cu conținutul

### 3. Breadcrumbs

- **Maxim 3-4 nivele**: Evită breadcrumbs prea lungi
- **Nume scurte**: Folosește nume concise și clare
- **Omite pentru homepage**: Nu afișa breadcrumbs pe homepage

### 4. Sitemap

- **Limită**: Maxim 50,000 URL-uri per sitemap
- **Actualizări**: Sitemap-ul se generează dinamic, nu necesită update manual
- **Submit**: Trimite la Google Search Console după deploy

### 5. URLs

- **Clean URLs**: Folosește slug-uri SEO-friendly (fără caractere speciale)
- **Lowercase**: Toate URL-urile în lowercase
- **Hyphens**: Folosește `-` în loc de `_`
- **Canonical**: Toate paginile au canonical URL automat

### 6. Performance

- **Imagini**: Optimizează imagini (folosește Sharp - deja implementat)
- **Caching**: Folosește cache pentru sitemap și static files (implementat)
- **Compression**: GZIP activat (implementat)
- **Lazy Loading**: Implementează pentru imagini în views

---

## Exemple de Implementare

### Adăugare SEO la Model Existent

Dacă ai un model care nu are SEO object:

```javascript
// models/NewModel.js
const mongoose = require('mongoose');

const newModelSchema = new mongoose.Schema({
  // ... alte câmpuri

  seo: {
    metaTitle: {
      type: String,
      maxlength: 60,
      trim: true,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      trim: true,
    },
    keywords: [{
      type: String,
      trim: true,
    }],
    ogImage: {
      type: String,
      trim: true,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('NewModel', newModelSchema);
```

### Creare Partial Custom Schema

Pentru un tip nou de structured data:

```ejs
<!-- views/partials/seo/schema-custom.ejs -->
<%
const schema = {
  '@context': 'https://schema.org',
  '@type': 'YourSchemaType',
  name: data.name,
  // ... alte câmpuri
};
%>

<script type="application/ld+json">
<%- JSON.stringify(schema, null, 0) %>
</script>
```

Apoi include în layout:

```ejs
<% if (schemaType === 'custom' && typeof data !== 'undefined') { %>
  <%- include('../partials/seo/schema-custom', { data: data }) %>
<% } %>
```

---

## Suport și Întreținere

### Monitorizare

- **Google Search Console**: Weekly check pentru erori
- **Analytics**: Monitorizează traficul organic
- **Core Web Vitals**: Verifică lunar performanța

### Updates

- **Schema.org**: Verifică updates la https://schema.org/
- **Google Guidelines**: Monitorizează https://developers.google.com/search

### Debugging

**Log-uri pentru troubleshooting**:

```javascript
// În controller, pentru debug SEO data
console.log('SEO Data:', {
  title: res.locals.title,
  seo: res.locals.seo,
  breadcrumbs: res.locals.breadcrumbs,
  schemaType: res.locals.schemaType
});
```

---

## 📞 Contact

Pentru sugestii sau întrebări despre implementarea SEO:
- Verifică codul în `src/utils/seoHelpers.js`
- Consultă partialurile din `views/partials/seo/`
- Revizuiește middleware-ul din `src/middleware/breadcrumbs.js`

---

**Ultima actualizare**: Noiembrie 2024
**Versiune**: 1.0.0
**Status**: ✅ Implementat și Funcțional
