const NutritionalProfile = require('../../../src/models/NutritionalProfile');

describe('NutritionalProfile Model', () => {
  describe('BMI Calculation', () => {
    test('should calculate BMI correctly', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
        },
        activityLevel: 'moderate',
        goal: 'maintain',
      });

      profile.calculateBMI();

      expect(profile.calculations.bmi.value).toBeCloseTo(24.7, 1);
      expect(profile.calculations.bmi.category).toBe('normal');
    });

    test('should categorize BMI as underweight', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 25,
          gender: 'female',
          height: 170,
          weight: 50,
        },
        activityLevel: 'moderate',
        goal: 'gain_weight',
      });

      profile.calculateBMI();

      expect(profile.calculations.bmi.category).toBe('underweight');
    });

    test('should categorize BMI as overweight', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 35,
          gender: 'male',
          height: 175,
          weight: 85,
        },
        activityLevel: 'sedentary',
        goal: 'lose_weight',
      });

      profile.calculateBMI();

      expect(profile.calculations.bmi.category).toBe('overweight');
    });
  });

  describe('BMR Calculation', () => {
    test('should calculate BMR for male', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
        },
        activityLevel: 'moderate',
        goal: 'maintain',
      });

      const bmr = profile.calculateBMR();

      expect(bmr).toBeGreaterThan(1600);
      expect(bmr).toBeLessThan(2000);
    });

    test('should calculate BMR for female', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 25,
          gender: 'female',
          height: 165,
          weight: 60,
        },
        activityLevel: 'moderate',
        goal: 'maintain',
      });

      const bmr = profile.calculateBMR();

      expect(bmr).toBeGreaterThan(1200);
      expect(bmr).toBeLessThan(1600);
    });
  });

  describe('TDEE Calculation', () => {
    test('should calculate TDEE based on activity level', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
        },
        activityLevel: 'very_active',
        goal: 'maintain',
      });

      profile.calculateBMR();
      const tdee = profile.calculateTDEE();

      expect(tdee).toBeGreaterThan(profile.calculations.bmr);
    });
  });

  describe('Water Intake Calculation', () => {
    test('should calculate water intake', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
        },
        activityLevel: 'moderate',
        goal: 'maintain',
      });

      const waterIntake = profile.calculateWaterIntake();

      expect(waterIntake).toBeGreaterThan(2);
      expect(waterIntake).toBeLessThan(4);
    });
  });

  describe('Full Calculation', () => {
    test('should calculate all metrics', () => {
      const profile = new NutritionalProfile({
        personalInfo: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
        },
        activityLevel: 'moderate',
        goal: 'lose_weight',
      });

      profile.calculateAll();

      expect(profile.calculations.bmi).toBeDefined();
      expect(profile.calculations.bmr).toBeDefined();
      expect(profile.calculations.tdee).toBeDefined();
      expect(profile.calculations.idealWeight).toBeDefined();
      expect(profile.calculations.waterIntake).toBeDefined();
      expect(profile.calculations.macros).toBeDefined();
      expect(profile.recommendations.tips.length).toBeGreaterThan(0);
    });
  });
});
