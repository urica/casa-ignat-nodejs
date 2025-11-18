/**
 * SEO Helper Functions pentru Casa Ignat
 * Funcții pentru generarea meta tags, structured data (JSON-LD), și optimizări SEO
 */

/**
 * Generează meta tags complete pentru o pagină
 * @param {Object} options - Opțiuni pentru meta tags
 * @returns {Object} - Obiect cu toate meta tags necesare
 */
function generateMetaTags(options = {}) {
  const {
    title,
    description,
    keywords = [],
    url,
    image,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    siteName = 'Casa Ignat',
    locale = 'ro_RO',
    twitterCard = 'summary_large_image',
    noIndex = false,
    noFollow = false,
    canonical
  } = options;

  // Validări și limitări
  const metaTitle = title ? title.substring(0, 60) : 'Casa Ignat - Cabinet de Nutriție';
  const metaDescription = description ? description.substring(0, 160) :
    'Servicii profesionale de nutriție și consultanță în alimentație sănătoasă.';

  const metaTags = {
    // Basic meta tags
    title: metaTitle,
    description: metaDescription,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,

    // Robots meta
    robots: buildRobotsTag(noIndex, noFollow),

    // Canonical URL
    canonical: canonical || url,

    // Open Graph
    og: {
      type,
      title: metaTitle,
      description: metaDescription,
      url,
      image: image || '/images/og-default.jpg',
      siteName,
      locale
    },

    // Twitter Cards
    twitter: {
      card: twitterCard,
      title: metaTitle,
      description: metaDescription,
      image: image || '/images/og-default.jpg'
    }
  };

  // Adaugă author dacă există
  if (author) {
    metaTags.author = author;
  }

  // Adaugă date pentru articole
  if (publishedTime) {
    metaTags.og.publishedTime = publishedTime;
  }
  if (modifiedTime) {
    metaTags.og.modifiedTime = modifiedTime;
  }

  return metaTags;
}

/**
 * Construiește tag-ul robots
 */
function buildRobotsTag(noIndex, noFollow) {
  const directives = [];

  if (noIndex) directives.push('noindex');
  else directives.push('index');

  if (noFollow) directives.push('nofollow');
  else directives.push('follow');

  return directives.join(', ');
}

/**
 * Generează JSON-LD pentru Organization (Casa Ignat)
 */
function generateOrganizationSchema(settings = {}) {
  const {
    name = 'Casa Ignat',
    description = 'Cabinet profesional de nutriție și consultanță în alimentație sănătoasă',
    url = 'https://casa-ignat.ro',
    logo,
    address = {},
    contactPoint = {},
    sameAs = [],
    priceRange = '$$'
  } = settings;

  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'HealthAndBeautyBusiness', 'MedicalBusiness'],
    name,
    description,
    url,
    logo: logo || `${url}/images/logo.png`,
    image: logo || `${url}/images/logo.png`,
    priceRange,

    // Adresă
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street || '',
      addressLocality: address.city || 'București',
      addressRegion: address.region || 'București',
      postalCode: address.postalCode || '',
      addressCountry: 'RO'
    },

    // Contact
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: contactPoint.phone || '',
      email: contactPoint.email || '',
      contactType: 'customer service',
      availableLanguage: ['ro', 'en']
    },

    // Social media
    sameAs: sameAs.filter(Boolean),

    // Opening hours
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00'
      }
    ]
  };
}

/**
 * Generează JSON-LD pentru LocalBusiness
 */
function generateLocalBusinessSchema(settings = {}) {
  const orgSchema = generateOrganizationSchema(settings);

  return {
    ...orgSchema,
    '@type': ['LocalBusiness', 'HealthAndBeautyBusiness', 'MedicalBusiness'],

    // Service area
    areaServed: {
      '@type': 'City',
      name: settings.city || 'București'
    },

    // Aggregate rating (dacă există reviews)
    ...(settings.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: settings.aggregateRating.value || '4.8',
        reviewCount: settings.aggregateRating.count || '0',
        bestRating: '5',
        worstRating: '1'
      }
    })
  };
}

/**
 * Generează JSON-LD pentru BlogPosting
 */
function generateBlogPostingSchema(post = {}) {
  const {
    title,
    description,
    url,
    image,
    author = {},
    publishedAt,
    updatedAt,
    content,
    keywords = []
  } = post;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: url,
    image: image || '/images/og-default.jpg',

    // Author
    author: {
      '@type': 'Person',
      name: author.name || 'Casa Ignat',
      url: author.url || ''
    },

    // Publisher
    publisher: {
      '@type': 'Organization',
      name: 'Casa Ignat',
      logo: {
        '@type': 'ImageObject',
        url: '/images/logo.png'
      }
    },

    // Dates
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,

    // Content
    articleBody: content,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,

    // Main entity
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };
}

/**
 * Generează JSON-LD pentru Article (similar cu BlogPosting dar mai generic)
 */
function generateArticleSchema(article = {}) {
  const blogSchema = generateBlogPostingSchema(article);
  return {
    ...blogSchema,
    '@type': 'Article'
  };
}

/**
 * Generează JSON-LD pentru Person (membru echipă)
 */
function generatePersonSchema(person = {}) {
  const {
    name,
    jobTitle,
    description,
    image,
    url,
    email,
    telephone,
    sameAs = [],
    credentials = [],
    specializations = []
  } = person;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: jobTitle || 'Nutriționist',
    description,
    image,
    url,

    // Organizație
    worksFor: {
      '@type': 'Organization',
      name: 'Casa Ignat'
    },

    // Calificări
    hasCredential: credentials.map(cred => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: cred
    })),

    // Specializări
    knowsAbout: specializations,

    // Social media
    sameAs: sameAs.filter(Boolean)
  };

  // Adaugă contact dacă există
  if (email) schema.email = email;
  if (telephone) schema.telephone = telephone;

  return schema;
}

/**
 * Generează JSON-LD pentru MedicalService
 */
function generateMedicalServiceSchema(service = {}) {
  const {
    name,
    description,
    url,
    image,
    provider = {},
    priceRange,
    areaServed,
    serviceType
  } = service;

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalService',
    name,
    description,
    url,
    image,
    serviceType: serviceType || 'Nutrition Counseling',

    // Provider
    provider: {
      '@type': 'MedicalOrganization',
      name: provider.name || 'Casa Ignat',
      url: provider.url || 'https://casa-ignat.ro'
    },

    // Area served
    areaServed: {
      '@type': 'City',
      name: areaServed || 'București'
    },

    // Price
    ...(priceRange && {
      offers: {
        '@type': 'Offer',
        priceRange: priceRange,
        priceCurrency: 'RON'
      }
    })
  };
}

/**
 * Generează JSON-LD pentru Service (mai generic)
 */
function generateServiceSchema(service = {}) {
  const {
    name,
    description,
    url,
    image,
    provider = {},
    price,
    priceCurrency = 'RON'
  } = service;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    image,

    // Provider
    provider: {
      '@type': 'Organization',
      name: provider.name || 'Casa Ignat',
      url: provider.url || 'https://casa-ignat.ro'
    },

    // Offer
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: priceCurrency
    }
  };
}

/**
 * Generează JSON-LD pentru FAQPage
 */
function generateFAQPageSchema(faqs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generează JSON-LD pentru BreadcrumbList
 */
function generateBreadcrumbSchema(breadcrumbs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generează JSON-LD pentru WebSite (pentru Sitelinks Search Box)
 */
function generateWebSiteSchema(settings = {}) {
  const {
    name = 'Casa Ignat',
    url = 'https://casa-ignat.ro',
    description = 'Cabinet profesional de nutriție',
    potentialAction = true
  } = settings;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description
  };

  // Sitelinks Search Box
  if (potentialAction) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/cautare?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    };
  }

  return schema;
}

/**
 * Generează JSON-LD pentru Review
 */
function generateReviewSchema(review = {}) {
  const {
    author,
    rating,
    reviewBody,
    datePublished,
    itemReviewed = {}
  } = review;

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: '5',
      worstRating: '1'
    },
    reviewBody,
    datePublished,
    itemReviewed: {
      '@type': itemReviewed.type || 'LocalBusiness',
      name: itemReviewed.name || 'Casa Ignat'
    }
  };
}

/**
 * Generează breadcrumbs pentru UI și SEO
 */
function generateBreadcrumbs(path, customNames = {}) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Acasă', url: '/' }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Folosește nume custom dacă există, altfel formatează segment-ul
    const name = customNames[segment] ||
                 segment.charAt(0).toUpperCase() +
                 segment.slice(1).replace(/-/g, ' ');

    breadcrumbs.push({
      name,
      url: currentPath
    });
  });

  return breadcrumbs;
}

/**
 * Validează și optimizează meta description
 */
function optimizeMetaDescription(text, maxLength = 160) {
  if (!text) return '';

  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Truncate la maxLength
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...';
  }

  return cleaned;
}

/**
 * Generează keywords din text
 */
function extractKeywords(text, maxKeywords = 10) {
  if (!text) return [];

  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // Common Romanian stop words
  const stopWords = [
    'și', 'în', 'de', 'la', 'cu', 'pe', 'un', 'o', 'pentru', 'este', 'sunt',
    'ca', 'că', 'sau', 'dar', 'dacă', 'acest', 'această', 'ei', 'ele', 'lui'
  ];

  // Extract words
  const words = cleaned.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !stopWords.includes(word));

  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(entry => entry[0]);
}

/**
 * Generează URL canonical
 */
function generateCanonicalUrl(req, customPath = null) {
  const protocol = req.protocol;
  const host = req.get('host');
  const path = customPath || req.originalUrl.split('?')[0]; // Remove query params

  return `${protocol}://${host}${path}`;
}

/**
 * Verifică dacă o pagină ar trebui să fie indexată
 */
function shouldIndexPage(page = {}) {
  // Nu indexa pagini draft, arhivate, sau admin
  if (page.status === 'draft' || page.status === 'archived') return false;
  if (page.url && page.url.startsWith('/admin')) return false;

  // Nu indexa dacă este setat explicit noIndex
  if (page.seo && page.seo.noIndex) return false;

  return true;
}

/**
 * Convertește schema object în string JSON-LD pentru inserare în HTML
 */
function schemaToJsonLd(schema) {
  return JSON.stringify(schema, null, 0);
}

/**
 * Generează multiple schemas într-un array
 */
function generateMultipleSchemas(schemas = []) {
  return schemas.filter(Boolean);
}

module.exports = {
  // Meta tags
  generateMetaTags,
  buildRobotsTag,
  optimizeMetaDescription,
  extractKeywords,
  generateCanonicalUrl,
  shouldIndexPage,

  // Schema.org JSON-LD
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateBlogPostingSchema,
  generateArticleSchema,
  generatePersonSchema,
  generateMedicalServiceSchema,
  generateServiceSchema,
  generateFAQPageSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateReviewSchema,

  // Breadcrumbs
  generateBreadcrumbs,

  // Utilities
  schemaToJsonLd,
  generateMultipleSchemas
};
