const BlogPost = require('../models/BlogPost');
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
