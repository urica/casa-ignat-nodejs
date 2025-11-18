const BlogPost = require('../models/BlogPost');
const BlogComment = require('../models/BlogComment');
const BlogCategory = require('../models/BlogCategory');
const Media = require('../models/Media');
const auditLog = require('../middleware/auditLog');
const { upload } = require('../../config/upload');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// List all blog posts
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const category = req.query.category || '';

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email'),
      BlogPost.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('admin/blog/list', {
      title: 'Articole Blog',
      currentPath: '/admin/blog',
      posts,
      pagination: { page, totalPages, total, limit },
      filters: { search, status, category },
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    console.error('List blog posts error:', error);
    req.flash('error', 'Eroare la încărcarea articolelor');
    res.redirect('/admin');
  }
};

// Show create form
exports.createForm = (req, res) => {
  res.render('admin/blog/create', {
    title: 'Articol Nou',
    currentPath: '/admin/blog',
    breadcrumbs: [
      { label: 'Blog', url: '/admin/blog' },
      { label: 'Articol Nou', url: '/admin/blog/create' },
    ],
    csrfToken: req.session.csrfToken,
  });
};

// Create blog post
exports.create = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status, scheduledFor, seo, featured, allowComments } = req.body;

    // Process featured image
    let featuredImage = null;
    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      const file = req.files.featuredImage[0];
      const filename = `blog-${Date.now()}-${file.originalname}`;
      const filepath = path.join(__dirname, '../../public/uploads/blog', filename);

      await sharp(file.buffer)
        .resize(1200, 675, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      featuredImage = `/uploads/blog/${filename}`;
    }

    // Create blog post
    const post = await BlogPost.create({
      title,
      excerpt,
      content,
      featuredImage,
      author: req.user._id,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      status,
      scheduledFor: scheduledFor || null,
      featured: featured === 'on',
      allowComments: allowComments !== 'off',
      seo: seo ? JSON.parse(seo) : {},
    });

    await auditLog.log(req, 'create', 'blog_post', post._id, `Created blog post: ${title}`);

    req.flash('success', 'Articolul a fost creat cu succes');
    res.redirect(`/admin/blog/edit/${post._id}`);
  } catch (error) {
    console.error('Create blog post error:', error);
    req.flash('error', 'Eroare la crearea articolului');
    res.redirect('/admin/blog/create');
  }
};

// Show edit form
exports.editForm = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      req.flash('error', 'Articolul nu a fost găsit');
      return res.redirect('/admin/blog');
    }

    res.render('admin/blog/edit', {
      title: `Editare: ${post.title}`,
      currentPath: '/admin/blog',
      breadcrumbs: [
        { label: 'Blog', url: '/admin/blog' },
        { label: post.title, url: `/admin/blog/edit/${post._id}` },
      ],
      post,
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    console.error('Edit blog post form error:', error);
    req.flash('error', 'Eroare la încărcarea articolului');
    res.redirect('/admin/blog');
  }
};

// Update blog post
exports.update = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status, scheduledFor, seo, featured, allowComments } = req.body;
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      req.flash('error', 'Articolul nu a fost găsit');
      return res.redirect('/admin/blog');
    }

    // Process featured image if uploaded
    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      const file = req.files.featuredImage[0];
      const filename = `blog-${Date.now()}-${file.originalname}`;
      const filepath = path.join(__dirname, '../../public/uploads/blog', filename);

      await sharp(file.buffer)
        .resize(1200, 675, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      post.featuredImage = `/uploads/blog/${filename}`;
    }

    // Update fields
    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    post.category = category;
    post.tags = tags ? tags.split(',').map(t => t.trim()) : [];
    post.status = status;
    post.scheduledFor = scheduledFor || null;
    post.featured = featured === 'on';
    post.allowComments = allowComments !== 'off';
    if (seo) post.seo = JSON.parse(seo);

    await post.save();
    await auditLog.log(req, 'update', 'blog_post', post._id, `Updated blog post: ${title}`);

    req.flash('success', 'Articolul a fost actualizat');
    res.redirect(`/admin/blog/edit/${post._id}`);
  } catch (error) {
    console.error('Update blog post error:', error);
    req.flash('error', 'Eroare la actualizarea articolului');
    res.redirect(`/admin/blog/edit/${req.params.id}`);
  }
};

// Delete blog post
exports.delete = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Articolul nu a fost găsit' });
    }

    await post.deleteOne();
    await auditLog.log(req, 'delete', 'blog_post', post._id, `Deleted blog post: ${post.title}`);

    req.flash('success', 'Articolul a fost șters');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ success: false, message: 'Eroare la ștergerea articolului' });
  }
};

// Publish/unpublish post
exports.togglePublish = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Articolul nu a fost găsit' });
    }

    post.status = post.status === 'published' ? 'draft' : 'published';
    if (post.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    await auditLog.log(req, 'publish', 'blog_post', post._id, `Changed status to: ${post.status}`);

    res.json({ success: true, status: post.status });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ success: false, message: 'Eroare' });
  }
};

// ============================================
// PUBLIC BLOG ENDPOINTS
// ============================================

// Public: List blog posts with filters
exports.publicList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const tag = req.query.tag || '';

    // Build query
    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (tag) query.tags = tag;

    const [posts, total, categories] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .select('-content') // Don't send full content in list
        .lean(),
      BlogPost.countDocuments(query),
      BlogCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get popular posts
    const popularPosts = await BlogPost.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views featuredImage')
      .lean();

    // Get all tags
    const allTags = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.render('blog/list', {
      title: 'Blog - Casa Ignat',
      currentPath: '/blog',
      posts,
      pagination: { page, totalPages, total, limit },
      filters: { search, category, tag },
      categories,
      popularPosts,
      tags: allTags,
      seo: {
        metaTitle: 'Blog Nutriție - Casa Ignat',
        metaDescription: 'Descoperă articole despre nutriție, rețete sănătoase, studii de caz și sfaturi practice pentru o viață sănătoasă.',
        keywords: ['nutriție', 'rețete sănătoase', 'sănătate', 'blog nutriție'],
      },
    });
  } catch (error) {
    console.error('Public blog list error:', error);
    res.status(500).render('pages/404', { title: 'Eroare', currentPath: '' });
  }
};

// Public: Show single blog post
exports.publicShow = async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: 'published',
    })
      .populate('author', 'name email')
      .populate('relatedPosts', 'title slug excerpt featuredImage category publishedAt readingTime');

    if (!post) {
      return res.status(404).render('pages/404', {
        title: 'Articol negăsit',
        currentPath: '/blog',
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    // Get related posts if not set
    let relatedPosts = post.relatedPosts;
    if (!relatedPosts || relatedPosts.length === 0) {
      relatedPosts = await post.findRelatedPosts(4);
    }

    // Get approved comments
    const comments = await BlogComment.find({
      post: post._id,
      status: 'approved',
      parentComment: null,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'replies',
        match: { status: 'approved' },
        options: { sort: { createdAt: 1 } },
      })
      .lean();

    // Get categories for sidebar
    const categories = await BlogCategory.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Get popular posts
    const popularPosts = await BlogPost.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views featuredImage')
      .lean();

    res.render(`blog/templates/${post.templateType}`, {
      title: post.seo.metaTitle || post.title,
      currentPath: '/blog',
      post,
      relatedPosts,
      comments,
      categories,
      popularPosts,
      seo: {
        metaTitle: post.seo.metaTitle || post.title,
        metaDescription: post.seo.metaDescription || post.excerpt,
        keywords: post.seo.keywords || post.tags,
        ogImage: post.seo.ogImage || post.featuredImage,
        canonicalUrl: post.seo.canonicalUrl || `/blog/${post.slug}`,
        article: {
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
          author: post.author.name,
          section: post.category,
          tags: post.tags,
        },
      },
    });
  } catch (error) {
    console.error('Public blog show error:', error);
    // Fallback to article template if specific template not found
    if (error.message.includes('Failed to lookup view')) {
      try {
        const post = await BlogPost.findOne({
          slug: req.params.slug,
          status: 'published',
        })
          .populate('author', 'name email')
          .lean();

        return res.render('blog/templates/article', {
          title: post.title,
          currentPath: '/blog',
          post,
        });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
    res.status(500).render('pages/404', { title: 'Eroare', currentPath: '' });
  }
};

// Public: List posts by category
exports.publicCategory = async (req, res) => {
  try {
    const categorySlug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const [posts, total, categories] = await Promise.all([
      BlogPost.find({ category: categorySlug, status: 'published' })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .select('-content')
        .lean(),
      BlogPost.countDocuments({ category: categorySlug, status: 'published' }),
      BlogCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);

    const currentCategory = categories.find(cat => cat.slug === categorySlug);
    const totalPages = Math.ceil(total / limit);

    res.render('blog/category', {
      title: `${currentCategory?.name || 'Categorie'} - Blog Casa Ignat`,
      currentPath: '/blog',
      posts,
      category: currentCategory,
      categories,
      pagination: { page, totalPages, total, limit },
      seo: {
        metaTitle: currentCategory?.seo?.metaTitle || `${currentCategory?.name} - Blog Casa Ignat`,
        metaDescription: currentCategory?.seo?.metaDescription || currentCategory?.description,
      },
    });
  } catch (error) {
    console.error('Public category error:', error);
    res.status(500).render('pages/404', { title: 'Eroare', currentPath: '' });
  }
};

// ============================================
// COMMENT ENDPOINTS
// ============================================

// Submit comment
exports.submitComment = async (req, res) => {
  try {
    const { postId, name, email, website, content, parentCommentId } = req.body;

    // Verify post exists and allows comments
    const post = await BlogPost.findById(postId);
    if (!post || !post.allowComments) {
      return res.status(400).json({ success: false, message: 'Comentariile nu sunt permise' });
    }

    // Create comment
    const comment = await BlogComment.create({
      post: postId,
      author: {
        name,
        email,
        website,
        user: req.user ? req.user._id : null,
      },
      content,
      parentComment: parentCommentId || null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Comentariul a fost trimis și așteaptă moderare',
      comment: {
        id: comment._id,
        status: comment.status,
      },
    });
  } catch (error) {
    console.error('Submit comment error:', error);
    res.status(500).json({ success: false, message: 'Eroare la trimiterea comentariului' });
  }
};

// Admin: List comments
exports.listComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    const query = {};
    if (status) query.status = status;

    const [comments, total] = await Promise.all([
      BlogComment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('post', 'title slug')
        .lean(),
      BlogComment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('admin/blog/comments', {
      title: 'Comentarii Blog',
      currentPath: '/admin/blog/comments',
      comments,
      pagination: { page, totalPages, total, limit },
      filters: { status },
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    console.error('List comments error:', error);
    req.flash('error', 'Eroare la încărcarea comentariilor');
    res.redirect('/admin/blog');
  }
};

// Admin: Moderate comment
exports.moderateComment = async (req, res) => {
  try {
    const { status } = req.body;
    const comment = await BlogComment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comentariul nu a fost găsit' });
    }

    comment.status = status;
    await comment.save();

    await auditLog.log(req, 'moderate', 'blog_comment', comment._id, `Changed status to: ${status}`);

    res.json({ success: true, status: comment.status });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({ success: false, message: 'Eroare' });
  }
};

// Admin: Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comentariul nu a fost găsit' });
    }

    await comment.deleteOne();
    await auditLog.log(req, 'delete', 'blog_comment', comment._id, 'Deleted comment');

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Eroare' });
  }
};
