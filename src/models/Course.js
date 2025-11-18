const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },

  description: String,

  image: String,

  category: String,

  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },

  price: {
    type: Number,
    default: 0,
  },

  duration: Number, // hours

  lessons: [{
    title: String,
    description: String,
    videoUrl: String,
    videoDuration: Number, // seconds
    content: String,
    order: Number,
    resources: [{
      title: String,
      type: String,
      url: String,
    }],
    quiz: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      }],
    },
  }],

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  enrollments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      completedLessons: [Number],
      currentLesson: Number,
      percentComplete: Number,
    },
    certificate: {
      issued: Boolean,
      issuedAt: Date,
      certificateId: String,
    },
  }],

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },

  ratings: {
    average: Number,
    count: Number,
  },
}, {
  timestamps: true,
});

courseSchema.index({ slug: 1 });
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ instructor: 1 });

courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
