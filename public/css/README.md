# Casa Ignat Design System

Un sistem de design complet și profesional pentru website-ul Casa Ignat, construit cu CSS modular și BEM methodology.

## 📁 Structura Fișierelor

```
public/css/
├── variables.css    # CSS Custom Properties (culori, spacing, fonts)
├── base.css         # Reset, typography, stiluri de bază
├── layout.css       # Grid system, containers, flexbox utilities
├── components.css   # Componente UI (buttons, cards, forms, nav, footer)
├── sections.css     # Hero sections, feature grids, galleries
├── utilities.css    # Helper classes (spacing, colors, shadows)
├── main.css         # Entry point - importă toate fișierele
└── README.md        # Această documentație
```

## 🚀 Utilizare

### Import în HTML

```html
<link rel="stylesheet" href="/css/main.css">
```

Acest fișier importă automat toate celelalte module CSS în ordinea corectă.

## 🎨 Sistem de Culori

### Culori Principale

```css
--color-primary: #E0CBC3      /* Roz pal */
--color-secondary: #CAE0C3    /* Verde deschis */
--color-tertiary: #C3D8E0     /* Bleu deschis */
--color-accent: #DAC3E0       /* Lila */
--color-dark: #2C2C2C         /* Text principal */
```

### Scala de Gri

```css
--color-gray-100: #F7F7F5
--color-gray-200: #EFEFED
--color-gray-300: #DCDCDA
--color-gray-400: #B4B4B2
--color-gray-500: #8C8C8A
--color-gray-600: #646462
--color-gray-700: #3C3C3A
```

### Utilizare în HTML

```html
<!-- Background colors -->
<div class="bg-primary"></div>
<div class="bg-secondary-light"></div>

<!-- Text colors -->
<p class="text-primary"></p>
<p class="text-muted"></p>
```

## 📝 Tipografie

### Font Families

- **Primary**: Inter (UI, interfață)
- **Secondary**: Merriweather (articole, conținut)

### Scale Tipografică

```css
--font-size-display: 3.5rem  /* 56px - Hero headings */
--font-size-h1: 2.5rem       /* 40px */
--font-size-h2: 2rem         /* 32px */
--font-size-h3: 1.5rem       /* 24px */
--font-size-h4: 1.25rem      /* 20px */
--font-size-body: 1rem       /* 16px */
--font-size-small: 0.875rem  /* 14px */
--font-size-caption: 0.75rem /* 12px */
```

### Exemple

```html
<h1 class="display">Casa Ignat</h1>
<h2 class="h2">Bine ați venit</h2>
<p class="lead">Text mai mare pentru introduceri</p>
<p class="text-small">Text mai mic</p>
```

## 📐 Spacing (Grid de 8px)

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
--spacing-4xl: 96px
```

### Utility Classes

```html
<!-- Margin -->
<div class="m-lg">Margin pe toate părțile</div>
<div class="mt-xl">Margin top</div>
<div class="mx-auto">Center horizontal</div>

<!-- Padding -->
<div class="p-xl">Padding pe toate părțile</div>
<div class="py-lg">Padding vertical</div>
```

## 🔘 Butoane

### Variante

```html
<!-- Primary Button -->
<button class="btn btn--primary">Rezervă acum</button>

<!-- Secondary Button -->
<button class="btn btn--secondary">Află mai multe</button>

<!-- Ghost Button (Outline) -->
<button class="btn btn--ghost">Contact</button>

<!-- Accent Button -->
<button class="btn btn--accent">Special</button>
```

### Dimensiuni

```html
<button class="btn btn--primary btn--sm">Mic</button>
<button class="btn btn--primary">Normal</button>
<button class="btn btn--primary btn--lg">Mare</button>
```

### Full Width

```html
<button class="btn btn--primary btn--block">Buton lățime completă</button>
```

## 🎴 Cards

### Service Card

```html
<div class="card card--service">
  <div class="card__body">
    <div class="card__icon">
      🏠
    </div>
    <h3 class="card__title">Cazare Confortabilă</h3>
    <p class="card__text">Camere moderne și spațioase</p>
  </div>
</div>
```

### Testimonial Card

```html
<div class="card card--testimonial">
  <div class="card__body">
    <p class="card__text">
      "Experiență minunată! Recomand cu căldură Casa Ignat."
    </p>
    <div class="card--testimonial__author">
      <img src="avatar.jpg" alt="Maria P." class="card--testimonial__avatar">
      <div>
        <div class="card--testimonial__name">Maria P.</div>
        <div class="card--testimonial__rating">★★★★★</div>
      </div>
    </div>
  </div>
</div>
```

### Blog Card

```html
<div class="card card--blog">
  <img src="image.jpg" alt="" class="card__image">
  <div class="card__body">
    <span class="card__category">Evenimente</span>
    <div class="card__meta">
      <span>15 Nov 2024</span>
      <span>5 min citire</span>
    </div>
    <h3 class="card__title">Titlu articol</h3>
    <p class="card__text">Descriere scurtă...</p>
  </div>
</div>
```

## 📝 Formulare

### Form Group

```html
<div class="form-group">
  <label class="form-label form-label--required" for="name">
    Nume
  </label>
  <input type="text" id="name" class="form-control" placeholder="Introduceți numele">
  <span class="form-text">Text auxiliar aici</span>
</div>
```

### Validare

```html
<!-- Valid -->
<input type="email" class="form-control form-control--valid">
<span class="form-feedback form-feedback--valid">Email valid!</span>

<!-- Invalid -->
<input type="email" class="form-control form-control--invalid">
<span class="form-feedback form-feedback--invalid">Email invalid!</span>
```

### Checkbox & Radio

```html
<div class="form-check">
  <input type="checkbox" id="terms" class="form-check__input">
  <label for="terms" class="form-check__label">
    Accept termenii și condițiile
  </label>
</div>
```

## 🧭 Navigation

```html
<nav class="navbar">
  <div class="navbar__container">
    <a href="/" class="navbar__brand">Casa Ignat</a>

    <button class="navbar__toggle">
      <span class="navbar__toggle-bar"></span>
      <span class="navbar__toggle-bar"></span>
      <span class="navbar__toggle-bar"></span>
    </button>

    <ul class="navbar__menu">
      <li class="navbar__item">
        <a href="/" class="navbar__link navbar__link--active">Acasă</a>
      </li>
      <li class="navbar__item">
        <a href="/camere" class="navbar__link">Camere</a>
      </li>
      <li class="navbar__item">
        <a href="/restaurant" class="navbar__link">Restaurant</a>
      </li>
    </ul>
  </div>
</nav>
```

## 🦶 Footer

```html
<footer class="footer">
  <div class="footer__container">
    <div class="footer__grid">
      <div>
        <h4 class="footer__section-title">Casa Ignat</h4>
        <p class="footer__text">Descriere pensiune...</p>

        <div class="footer__social">
          <a href="#" class="footer__social-link">FB</a>
          <a href="#" class="footer__social-link">IG</a>
        </div>
      </div>

      <div>
        <h4 class="footer__section-title">Link-uri</h4>
        <ul class="footer__list">
          <li class="footer__list-item">
            <a href="/" class="footer__link">Acasă</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <p>&copy; 2024 Casa Ignat. Toate drepturile rezervate.</p>
    </div>
  </div>
</footer>
```

## 🦸 Hero Section

```html
<section class="hero">
  <div class="hero__background">
    <img src="hero.jpg" alt="" class="hero__background-image">
  </div>
  <div class="hero__overlay"></div>

  <div class="hero__content">
    <h1 class="hero__title">Bine ați venit la Casa Ignat</h1>
    <p class="hero__subtitle">Cazare și restaurant tradițional</p>

    <div class="hero__cta">
      <a href="/rezervare" class="btn btn--primary btn--lg">Rezervă acum</a>
      <a href="/camere" class="btn btn--ghost btn--lg">Vezi camere</a>
    </div>
  </div>
</section>
```

## 📦 Layout System

### Container

```html
<div class="container">Conținut centrat</div>
<div class="container container--lg">Container mare</div>
<div class="container container--fluid">Container full width</div>
```

### Grid System

```html
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    Coloană responsivă
  </div>
  <div class="col-12 col-md-6 col-lg-8">
    Coloană responsivă
  </div>
</div>
```

### Flexbox Utilities

```html
<div class="d-flex justify-content-between align-items-center gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 🏷️ Badges & Tags

```html
<span class="badge badge--primary">Nou</span>
<span class="badge badge--secondary">Disponibil</span>
<span class="badge badge--success">Confirmat</span>
<span class="badge badge--warning">În așteptare</span>
<span class="badge badge--error">Anulat</span>
```

## ⚠️ Alerts

```html
<div class="alert alert--success">
  <div class="alert__title">Succes!</div>
  <p class="alert__text">Rezervarea a fost confirmată.</p>
</div>

<div class="alert alert--error">
  <div class="alert__title">Eroare!</div>
  <p class="alert__text">A apărut o problemă.</p>
</div>
```

## 🎭 Animations

```html
<!-- Fade in up -->
<div class="animate-fade-in-up">Conținut animat</div>

<!-- Slide in from left -->
<div class="animate-slide-in-left">Conținut animat</div>

<!-- Pulse animation -->
<div class="animate-pulse">Pulsează</div>
```

## ♿ Accesibilitate

### Focus Visible

Toate elementele interactive au focus styles pentru navigare cu tastatura.

### Skip to Main Content

```html
<a href="#main-content" class="skip-to-main">
  Sari la conținutul principal
</a>

<main id="main-content">
  <!-- Conținut principal -->
</main>
```

### Screen Reader Only

```html
<span class="sr-only">Text vizibil doar pentru screen readers</span>
```

## 🌓 Dark Mode (Opțional)

Dark mode este activat automat dacă utilizatorul are preferința setată sau poate fi forțat:

```html
<!-- Force dark mode -->
<html data-theme="dark">

<!-- Force light mode -->
<html data-theme="light">

<!-- Auto (follows system preference) -->
<html data-theme="auto">
```

## 📱 Responsive Breakpoints

```css
--breakpoint-sm: 576px   /* Small tablets */
--breakpoint-md: 768px   /* Tablets */
--breakpoint-lg: 992px   /* Desktop */
--breakpoint-xl: 1200px  /* Large desktop */
--breakpoint-2xl: 1400px /* Extra large */
```

### Responsive Utilities

```html
<!-- Hide on mobile, show on desktop -->
<div class="d-none d-md-block">Vizibil doar pe desktop</div>

<!-- Show on mobile, hide on desktop -->
<div class="d-block d-md-none">Vizibil doar pe mobile</div>
```

## 🎨 Customizare

Pentru a customiza design system-ul, modifică variabilele din `variables.css`:

```css
:root {
  --color-primary: #YOUR_COLOR;
  --font-primary: 'Your Font', sans-serif;
  --spacing-md: 20px; /* Schimbă spacing-ul */
}
```

## 📄 Licență

MIT License - Casa Ignat Design System

---

**Dezvoltat cu ❤️ pentru Casa Ignat**
