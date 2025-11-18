const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../config/app');

/**
 * Process and optimize uploaded image
 * Creates multiple sizes: thumbnail, medium, large
 */
exports.processImage = async (filePath, outputDir) => {
  try {
    const filename = path.basename(filePath, path.extname(filePath));
    const ext = '.webp'; // Convert all images to WebP for better compression

    const sizes = {
      thumbnail: {
        width: config.image.thumbnail.width,
        height: config.image.thumbnail.height,
        path: path.join(outputDir, `${filename}-thumb${ext}`),
      },
      medium: {
        width: config.image.medium.width,
        height: config.image.medium.height,
        path: path.join(outputDir, `${filename}-medium${ext}`),
      },
      large: {
        width: config.image.large.width,
        height: config.image.large.height,
        path: path.join(outputDir, `${filename}-large${ext}`),
      },
    };

    const results = {};

    // Process each size
    for (const [key, size] of Object.entries(sizes)) {
      await sharp(filePath)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: config.image.quality })
        .toFile(size.path);

      results[key] = size.path.replace('public/', '/');
    }

    // Delete original file
    await fs.unlink(filePath);

    return results;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Delete image and all its variants
 */
exports.deleteImage = async (imagePath) => {
  try {
    const dir = path.dirname(imagePath);
    const filename = path.basename(imagePath, path.extname(imagePath));

    // Delete all variants
    const variants = ['thumb', 'medium', 'large'];
    for (const variant of variants) {
      const variantPath = path.join('public', dir, `${filename}-${variant}.webp`);
      try {
        await fs.unlink(variantPath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }

    // Delete original
    try {
      await fs.unlink(path.join('public', imagePath));
    } catch (err) {
      // Ignore if file doesn't exist
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
