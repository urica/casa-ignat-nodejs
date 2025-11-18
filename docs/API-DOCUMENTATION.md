# Casa Ignat - API Documentation

## Base URL

```
Production: https://casaignat.ro/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using session-based auth or JWT tokens.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Analytics

### Track Event

Track a custom event.

```http
POST /api/analytics/track
Content-Type: application/json

{
  "eventName": "button_click",
  "eventCategory": "engagement",
  "properties": {
    "button_id": "cta_primary",
    "page": "/servicii"
  },
  "isConversion": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```

### Get Real-time Visitors

```http
GET /api/analytics/realtime
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "visitors": [...]
}
```

### Get Traffic Sources

```http
GET /api/analytics/traffic-sources?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "sources": [
    {
      "_id": "Google",
      "count": 1250
    },
    {
      "_id": "Direct",
      "count": 890
    }
  ]
}
```

---

## Nutritional Calculator

### Calculate Nutritional Needs

```http
POST /api/calculator/calculate
Content-Type: application/json

{
  "age": 30,
  "gender": "male",
  "height": 180,
  "weight": 80,
  "activityLevel": "moderate",
  "goal": "lose_weight",
  "dietType": "omnivore",
  "email": "user@example.com",
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bmi": {
      "value": 24.7,
      "category": "normal"
    },
    "bmr": 1765,
    "tdee": 2437,
    "idealWeight": {
      "min": 60,
      "max": 81
    },
    "waterIntake": 3.1,
    "macros": {
      "calories": 1937,
      "protein": 170,
      "carbs": 170,
      "fats": 65
    },
    "recommendations": {
      "calorieIntake": 1937,
      "tips": [...]
    }
  }
}
```

### Get Calculation History

```http
GET /api/calculator/history
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

---

## Meal Planner

### Generate Meal Plan

```http
POST /api/meal-planner/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "duration": 7,
  "dailyCalories": 2000,
  "dietType": "vegetarian",
  "restrictions": "gluten,dairy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Plan 18.11.2024",
    "duration": 7,
    "meals": [...],
    "shoppingList": [...]
  }
}
```

### Get Meal Plan

```http
GET /api/meal-planner/{id}
Authorization: Bearer {token}
```

### Export Shopping List

```http
GET /api/meal-planner/{id}/shopping-list?format=csv
Authorization: Bearer {token}
```

---

## Recipes

### List Recipes

```http
GET /api/recipes?category=lunch&dietType=vegan&difficulty=easy&page=1&limit=20
```

**Query Parameters:**
- `category`: breakfast, lunch, dinner, snack, dessert, drink
- `dietType`: omnivore, vegetarian, vegan, pescatarian, keto, paleo
- `difficulty`: easy, medium, hard
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "recipes": [...],
    "pagination": {
      "current": 1,
      "total": 5,
      "limit": 20,
      "totalRecipes": 95
    }
  }
}
```

### Get Single Recipe

```http
GET /api/recipes/{id}
```

### Create Recipe

```http
POST /api/recipes
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Salată de Quinoa",
  "description": "O salată delicioasă și nutritivă",
  "category": "lunch",
  "dietType": "vegan",
  "difficulty": "easy",
  "prepTime": 15,
  "cookTime": 20,
  "servings": 4,
  "ingredients": [
    {
      "ingredient": "quinoa",
      "quantity": 200,
      "unit": "g"
    }
  ],
  "instructions": [...],
  "nutrition": {
    "calories": 350,
    "protein": 12,
    "carbs": 45,
    "fats": 8
  }
}
```

---

## Courses

### List Courses

```http
GET /api/courses?level=beginner&page=1
```

### Get Course

```http
GET /api/courses/{id}
Authorization: Bearer {token}
```

### Enroll in Course

```http
POST /api/courses/{id}/enroll
Authorization: Bearer {token}
```

### Update Progress

```http
PUT /api/courses/{id}/progress
Content-Type: application/json
Authorization: Bearer {token}

{
  "lessonIndex": 3,
  "completed": true
}
```

---

## Webinars

### List Webinars

```http
GET /api/webinars?status=scheduled
```

### Get Webinar

```http
GET /api/webinars/{id}
```

### Register for Webinar

```http
POST /api/webinars/{id}/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+40123456789"
}
```

### Submit Question

```http
POST /api/webinars/{id}/questions
Content-Type: application/json
Authorization: Bearer {token}

{
  "question": "Care sunt beneficiile dietei vegetariene?"
}
```

---

## Digital Products

### List Products

```http
GET /api/products?category=ebook
```

### Get Product

```http
GET /api/products/{id}
```

### Purchase Product

```http
POST /api/products/{id}/purchase
Content-Type: application/json
Authorization: Bearer {token}

{
  "paymentMethod": "card"
}
```

### Download Product

```http
GET /api/products/{id}/download
Authorization: Bearer {token}
```

---

## Client Portal

### Get Dashboard Data

```http
GET /api/portal/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "consultations": [...],
    "mealPlans": [...],
    "progress": {...},
    "unreadMessages": 3
  }
}
```

### Get Consultations

```http
GET /api/portal/consultations
Authorization: Bearer {token}
```

### Get Progress

```http
GET /api/portal/progress
Authorization: Bearer {token}
```

### Add Measurement

```http
POST /api/portal/progress/measurements
Content-Type: application/json
Authorization: Bearer {token}

{
  "date": "2024-01-15",
  "weight": 75.5,
  "bodyFat": 18.2,
  "muscleMass": 35.8,
  "notes": "Feeling good!"
}
```

### Send Message

```http
POST /api/portal/messages
Content-Type: application/json
Authorization: Bearer {token}

{
  "subject": "Question about diet",
  "message": "Can I eat...?"
}
```

---

## Reviews

### List Reviews

```http
GET /api/reviews?platform=all&status=approved
```

### Submit Review

```http
POST /api/reviews
Content-Type: application/json

{
  "rating": 5,
  "title": "Excellent service!",
  "content": "Very professional and helpful",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Respond to Review

```http
POST /api/reviews/{id}/respond
Content-Type: application/json
Authorization: Bearer {token}

{
  "response": "Thank you for your feedback!"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Analytics**: 200 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### Configuration

Configure webhooks in admin panel or via API:

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://your-server.com/webhook",
  "events": ["appointment.created", "booking.confirmed"],
  "secret": "your-webhook-secret"
}
```

### Events

- `appointment.created`
- `appointment.confirmed`
- `appointment.cancelled`
- `booking.created`
- `booking.confirmed`
- `payment.success`
- `payment.failed`
- `review.submitted`

### Webhook Payload

```json
{
  "event": "appointment.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "...": "..."
  }
}
```

---

## SDKs & Client Libraries

### JavaScript

```javascript
import CasaIgnatClient from 'casa-ignat-sdk';

const client = new CasaIgnatClient({
  apiKey: 'your-api-key'
});

// Track event
await client.analytics.track({
  eventName: 'page_view',
  properties: { page: '/servicii' }
});

// Get recipes
const recipes = await client.recipes.list({
  category: 'lunch',
  dietType: 'vegan'
});
```

---

## Support

For API support, contact:
- **Email**: api@casaignat.ro
- **Documentation**: https://docs.casaignat.ro
- **Status Page**: https://status.casaignat.ro

---

**Last Updated**: November 18, 2025
**API Version**: 2.0
