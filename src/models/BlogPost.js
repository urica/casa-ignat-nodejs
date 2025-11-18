const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titlul este obligatoriu'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    required: [true, 'Descrierea scurtă este obligatorie'],
    maxlength: [300, 'Descrierea scurtă poate avea maxim 300 caractere'],
  },
  content: {
    type: String,
    required: [true, 'Conținutul este obligatoriu'],
  },

  // Template type and specific data
  templateType: {
    type: String,
    enum: ['article', 'recipe', 'case-study', 'guide'],
    default: 'article',
  },

  // Recipe-specific data
  recipeData: {
    ingredients: [{
      item: String,
      quantity: String,
      unit: String,
    }],
    instructions: [{
      step: Number,
      description: String,
      image: String,
    }],
    prepTime: Number, // in minutes
    cookTime: Number, // in minutes
    totalTime: Number, // in minutes
    servings: Number,
    difficulty: {
      type: String,
      enum: ['ușor', 'mediu', 'dificil'],
    },
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },
  },

  // Case study specific data
  caseStudyData: {
    clientName: String,
    clientAge: Number,
    duration: String, // e.g., "3 luni"
    beforeMetrics: {
      weight: Number,
      bmi: Number,
      bodyFat: Number,
      other: mongoose.Schema.Types.Mixed,
    },
    afterMetrics: {
      weight: Number,
      bmi: Number,
      bodyFat: Number,
      other: mongoose.Schema.Types.Mixed,
    },
    beforeImages: [String],
    afterImages: [String],
    timeline: [{
      date: Date,
      milestone: String,
      description: String,
    }],
    testimonial: {
      content: String,
      rating: Number,
    },
  },

  // Guide specific data
  guideData: {
    tableOfContents: [{
      title: String,
      anchor: String,
      level: Number,
    }],
    sections: [{
      title: String,
      content: String,
      isExpandable: Boolean,
    }],
    infographics: [String],
    downloadableFiles: [{
      title: String,
      description: String,
      fileUrl: String,
      fileType: String,
      fileSize: String,
    }],
  },

  // Media content
  featuredImage: {
    type: String,
  },
  images: [{
    type: String,
  }],
  videos: [{
    platform: {
      type: String,
      enum: ['youtube', 'vimeo', 'custom'],
    },
    url: String,
    embedCode: String,
    thumbnail: String,
    title: String,
  }],

  // Downloadable PDFs
  downloadableFiles: [{
    title: String,
    description: String,
    fileUrl: String,
    fileSize: String,
    downloads: {
      type: Number,
      default: 0,
    },
  }],

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Categoria este obligatorie'],
    enum: ['nutritie-generala', 'retete-sanatoase', 'sfaturi-practice', 'studii-de-caz', 'patologii-si-nutritie'],
  },
  tags: [{
    type: String,
    trim: true,
  }],

  // Reading time (auto-calculated)
  readingTime: {
    type: Number, // in minutes
    default: 0,
  },

  // Related posts
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
  }],

  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },

  // SEO
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title poate avea maxim 60 caractere'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description poate avea maxim 160 caractere'],
    },
    keywords: [{
      type: String,
    }],
    ogImage: {
      type: String,
    },
    canonicalUrl: String,
    noIndex: {
      type: Boolean,
      default: false,
    },
  },

  // Monetization
  monetization: {
    isPremium: {
      type: Boolean,
      default: false,
    },
    courseLink: String,
    ebookLink: String,
    webinarLink: String,
    affiliateLinks: [{
      text: String,
      url: String,
      position: String, // 'sidebar', 'content', 'footer'
    }],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for comment count
blogPostSchema.virtual('commentCount', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'post',
  count: true,
  match: { status: 'approved' },
});

// Calculate reading time based on content
blogPostSchema.methods.calculateReadingTime = function() {
  const wordsPerMinute = 200;
  const text = this.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const wordCount = text.split(/\s+/).length;
  this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  return this.readingTime;
};

// Find related posts based on tags and category
blogPostSchema.methods.findRelatedPosts = async function(limit = 4) {
  const relatedPosts = await this.constructor.find({
    _id: { $ne: this._id },
    status: 'published',
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } },
    ],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title slug excerpt featuredImage category publishedAt readingTime')
    .lean();

  return relatedPosts;
};

// Auto-generate SEO meta if not provided
blogPostSchema.methods.generateSeoMeta = function() {
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  if (!this.seo.ogImage) {
    this.seo.ogImage = this.featuredImage;
  }
};

// Auto-generate slug from title
blogPostSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Set publishedAt when status changes to published
blogPostSchema.pre('save', function(next) {
  // Set published date
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Calculate reading time
  if (this.isModified('content') || this.isNew) {
    this.calculateReadingTime();
  }

  // Generate SEO meta
  if (this.isModified('title') || this.isModified('excerpt') || this.isNew) {
    this.generateSeoMeta();
  }

  next();
});

// Indexes for better performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ featured: 1, status: 1 });
blogPostSchema.index({ templateType: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
