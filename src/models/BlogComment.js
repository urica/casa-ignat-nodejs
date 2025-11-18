const mongoose = require('mongoose');

const blogCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true,
    index: true,
  },
  author: {
    name: {
      type: String,
      required: [true, 'Numele este obligatoriu'],
      trim: true,
      maxlength: [100, 'Numele poate avea maxim 100 caractere'],
    },
    email: {
      type: String,
      required: [true, 'Email-ul este obligatoriu'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalid'],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'URL invalid'],
    },
    // Link to registered user if authenticated
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  content: {
    type: String,
    required: [true, 'Conținutul comentariului este obligatoriu'],
    trim: true,
    minlength: [3, 'Comentariul trebuie să aibă minim 3 caractere'],
    maxlength: [2000, 'Comentariul poate avea maxim 2000 caractere'],
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogComment',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'spam', 'rejected'],
    default: 'pending',
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  spamScore: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for replies
blogCommentSchema.virtual('replies', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'parentComment',
});

// Indexes for better performance
blogCommentSchema.index({ post: 1, status: 1, createdAt: -1 });
blogCommentSchema.index({ 'author.email': 1 });
blogCommentSchema.index({ parentComment: 1 });

// Method to check if comment is spam
blogCommentSchema.methods.checkSpam = function() {
  const spamKeywords = ['viagra', 'casino', 'poker', 'loan', 'credit', 'buy now'];
  const content = this.content.toLowerCase();

  let score = 0;
  spamKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 10;
  });

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 2) score += linkCount * 5;

  // Check for repeated characters
  if (/(.)\1{4,}/.test(content)) score += 15;

  this.spamScore = score;

  // Auto-mark as spam if score is too high
  if (score >= 30) {
    this.status = 'spam';
  }

  return score >= 30;
};

// Pre-save hook to check spam
blogCommentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('content')) {
    this.checkSpam();
  }
  next();
});

module.exports = mongoose.model('BlogComment', blogCommentSchema);
