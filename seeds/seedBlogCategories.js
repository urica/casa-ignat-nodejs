const mongoose = require('mongoose');
const BlogCategory = require('../src/models/BlogCategory');
require('dotenv').config();

const categories = [
  {
    name: 'Nutriție Generală',
    slug: 'nutritie-generala',
    description: 'Informații generale despre nutriție, alimente sănătoase și obiceiuri alimentare.',
    icon: '🥗',
    color: '#27ae60',
    order: 1,
    isActive: true,
    seo: {
      metaTitle: 'Articole despre Nutriție Generală - Casa Ignat',
      metaDescription: 'Descoperă articole despre nutriție generală, alimente sănătoase și cum să-ți îmbunătățești obiceiurile alimentare.',
    },
  },
  {
    name: 'Rețete Sănătoase',
    slug: 'retete-sanatoase',
    description: 'Rețete delicioase și sănătoase, cu valori nutriționale detaliate.',
    icon: '🍽️',
    color: '#3498db',
    order: 2,
    isActive: true,
    seo: {
      metaTitle: 'Rețete Sănătoase - Casa Ignat',
      metaDescription: 'Colecție de rețete sănătoase și delicioase cu valori nutriționale complete.',
    },
  },
  {
    name: 'Sfaturi Practice',
    slug: 'sfaturi-practice',
    description: 'Sfaturi practice pentru o alimentație echilibrată și un stil de viață sănătos.',
    icon: '💡',
    color: '#f39c12',
    order: 3,
    isActive: true,
    seo: {
      metaTitle: 'Sfaturi Practice Nutriție - Casa Ignat',
      metaDescription: 'Sfaturi practice pentru o alimentație echilibrată și un stil de viață sănătos.',
    },
  },
  {
    name: 'Studii de Caz',
    slug: 'studii-de-caz',
    description: 'Povești de succes ale clienților noștri și transformări remarcabile.',
    icon: '📊',
    color: '#9b59b6',
    order: 4,
    isActive: true,
    seo: {
      metaTitle: 'Studii de Caz - Povești de Succes - Casa Ignat',
      metaDescription: 'Povești reale de succes și transformări remarcabile ale clienților noștri.',
    },
  },
  {
    name: 'Patologii și Nutriție',
    slug: 'patologii-si-nutritie',
    description: 'Informații despre nutriție în diverse afecțiuni medicale și cum poate ajuta alimentația corectă.',
    icon: '🏥',
    color: '#e74c3c',
    order: 5,
    isActive: true,
    seo: {
      metaTitle: 'Nutriție în Patologii - Casa Ignat',
      metaDescription: 'Cum poate ajuta nutriția în diverse afecțiuni medicale și patologii.',
    },
  },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casa-ignat');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await BlogCategory.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const result = await BlogCategory.insertMany(categories);
    console.log(`Successfully seeded ${result.length} blog categories`);

    console.log('\nCreated categories:');
    result.forEach(cat => {
      console.log(`- ${cat.icon} ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedCategories();
}

module.exports = seedCategories;
