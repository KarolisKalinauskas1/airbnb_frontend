# Airbnb for Camping - Frontend

A modern, responsive Vue.js 3 frontend application for the Airbnb for Camping platform. This single-page application (SPA) provides an intuitive user interface for discovering, booking, and managing camping experiences.

## Technology Stack

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: TailwindCSS with responsive design
- **HTTP Client**: Axios
- **Maps**: Leaflet for interactive location maps
- **Date Picker**: Vue3-Datepicker
- **Testing**: Vitest for unit tests
- **Authentication**: Supabase integration

## Detailed Architecture

### Directory Structure

```
frontend/
├── public/              # Static assets
├── scripts/             # Build and utility scripts
├── src/
│   ├── assets/          # Static assets (images, fonts, etc.)
│   │   ├── icons/       # SVG icons
│   │   ├── images/      # Application images
│   │   └── styles/      # Global stylesheets
│   ├── components/      # Reusable Vue components
│   │   ├── auth/        # Authentication-related components
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── ...
│   │   ├── booking/     # Booking-related components
│   │   │   ├── BookingCalendar.vue
│   │   │   ├── BookingSummary.vue
│   │   │   └── ...
│   │   ├── camper/      # Camping spot components
│   │   │   ├── CamperCard.vue
│   │   │   ├── CamperGallery.vue
│   │   │   └── ...
│   │   ├── dashboard/   # Owner dashboard components
│   │   │   ├── AnalyticsChart.vue
│   │   │   ├── BookingTable.vue
│   │   │   └── ...
│   │   ├── map/         # Map-related components
│   │   │   ├── CampingMap.vue
│   │   │   ├── LocationMarker.vue
│   │   │   └── ...
│   │   ├── reviews/     # Review components
│   │   │   ├── ReviewForm.vue
│   │   │   ├── ReviewList.vue
│   │   │   └── ...
│   │   ├── ui/          # UI building blocks
│   │   │   ├── Button.vue
│   │   │   ├── Card.vue
│   │   │   ├── Modal.vue
│   │   │   └── ...
│   │   └── shared/      # Shared components across features
│   │       ├── AppFooter.vue
│   │       ├── AppHeader.vue
│   │       ├── NotificationBanner.vue
│   │       └── ...
│   ├── composables/     # Vue composables (reusable logic)
│   │   ├── useAuth.js   # Authentication logic
│   │   ├── useBooking.js # Booking-related logic
│   │   ├── useGeolocation.js # Location services
│   │   └── ...
│   ├── router/          # Vue Router configuration
│   │   ├── index.js     # Router setup
│   │   ├── routes.js    # Route definitions
│   │   └── guards.js    # Navigation guards
│   ├── services/        # API service modules
│   │   ├── api.js       # Base API service
│   │   ├── authService.js # Authentication API
│   │   ├── bookingService.js # Booking API
│   │   ├── camperService.js # Camping spot API
│   │   └── ...
│   ├── stores/          # Pinia state stores
│   │   ├── auth.js      # Authentication state
│   │   ├── booking.js   # Booking state
│   │   ├── campers.js   # Camping spots state
│   │   ├── dashboard.js # Dashboard state
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   ├── dateUtils.js # Date manipulation
│   │   ├── formatters.js # Text/number formatting
│   │   ├── validators.js # Form validation
│   │   └── ...
│   ├── views/           # Page components
│   │   ├── AccountView.vue # User account page
│   │   ├── BookingSuccessView.vue # Booking confirmation
│   │   ├── CamperDetailView.vue # Camping spot details
│   │   ├── DashboardView.vue # Owner dashboard
│   │   ├── HomeView.vue # Landing page
│   │   ├── ApiDebugView.vue # API debugging (development)
│   │   └── ...
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   └── e2e/             # End-to-end tests
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── tailwind.config.js   # TailwindCSS configuration
└── vite.config.js       # Vite bundler configuration
```

## Core Features

### User Authentication and Profiles

- User registration and login with email/password
- Social authentication options
- User profile management
- Session persistence with automatic token refresh
- Role-based access control (regular users vs. camping spot owners)

### Camping Spot Browsing

- Featured camping spots on the homepage
- Advanced search with multiple filters:
  - Location (map-based or text search)
  - Date range availability
  - Guest capacity
  - Amenities
  - Price range
- Detailed camping spot pages with:
  - Photo galleries
  - Amenity listings
  - Location maps
  - Availability calendar
  - Guest reviews and ratings
  - Booking form

### Booking Process

- Date range selection with availability checking
- Guest count selection
- Booking summary with cost breakdown
- Secure payment processing via Stripe
- Booking confirmation and receipt
- Booking management (view, modification, cancellation)

### Reviews and Ratings

- Post-stay review submission
- Rating system for different aspects (cleanliness, accuracy, etc.)
- Review display on camping spot pages
- Review management in user account

### Owner Dashboard

- Comprehensive overview of owner's camping spots
- Booking management
- Revenue analytics and reporting
- Camping spot management (add, edit, remove)
- Calendar availability management
- Image upload and management

### Maps and Location

- Interactive maps for camping spot locations
- Location search with autocomplete
- Distance calculation
- Map filters

## State Management

The application uses Pinia for state management with the following main stores:

1. **Auth Store** (`stores/auth.js`)
   - Manages user authentication state
   - Handles token storage and refresh
   - Provides login, logout, and registration methods
   - Maintains current user information

2. **Campers Store** (`stores/campers.js`)
   - Manages camping spot listings
   - Provides search and filtering functionality
   - Caches camping spot details

3. **Booking Store** (`stores/booking.js`)
   - Manages booking process state
   - Stores date selections, guest count, and pricing
   - Handles booking creation and management

4. **Dashboard Store** (`stores/dashboard.js`)
   - Handles owner dashboard data
   - Manages owner's camping spots
   - Provides booking and revenue analytics

## API Integration

All API calls are organized into service modules that communicate with the backend:

1. **api.js** - Base API configuration with Axios
   - Configures base URL and headers
   - Handles authentication token inclusion
   - Manages request/response interceptors
   - Implements error handling

2. **authService.js** - Authentication API calls
   - Registration and login
   - Token refresh
   - User profile management

3. **camperService.js** - Camping spot API calls
   - Listing retrieval and filtering
   - Camping spot details
   - Camping spot creation and management

4. **bookingService.js** - Booking API calls
   - Availability checking
   - Booking creation
   - Booking management
   - Payment integration

## Routing

Vue Router is used for client-side routing with the following main routes:

- `/` - Home page with featured camping spots
- `/login` and `/register` - Authentication pages
- `/campers` - Camping spot search results
- `/camper/:id` - Individual camping spot details
- `/booking/:id` - Booking details and management
- `/booking-success` - Successful booking confirmation
- `/account` - User account management
- `/account/bookings` - User's booking history
- `/dashboard` - Owner dashboard
- `/dashboard/spots` - Owner's camping spot management
- `/dashboard/bookings` - Owner's booking management

## Responsive Design

The application is fully responsive, built with TailwindCSS:

- Mobile-first approach
- Responsive grid layouts
- Adaptive components based on screen size
- Touch-friendly interfaces for mobile devices
- Desktop-optimized views for larger screens

## Error Handling & Status Management

- Comprehensive error handling for API calls
- Meaningful error messages for users
- Loading states with visual indicators
- Offline detection and recovery
- Connection status monitoring

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Backend server running (see backend documentation)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd airbnb_frontend/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

### Docker Setup

```bash
# Build the Docker image
docker build -t airbnb-camping-frontend .

# Run the container
docker run -p 8080:80 airbnb-camping-frontend
```

Or use Docker Compose from the project root:

```bash
docker-compose up -d frontend
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Development Utilities

### Debugging Tools

The application includes several debugging tools for development:

1. **API Debug View** (`/api-debug`)
   - Test API connections
   - View authentication status
   - Clear user data

2. **Vue DevTools**
   - Monitor component state
   - Track Pinia store changes
   - Debug routing

### Performance Optimization

Several strategies are used to optimize performance:

1. **Code Splitting**
   - Routes are lazy-loaded
   - Large components are chunked

2. **Asset Optimization**
   - Images are optimized
   - CSS is minimized
   - SVG optimization

3. **Caching**
   - API responses are cached where appropriate
   - Persistent storage for application state

## Browser Compatibility

The application is designed to work in all modern browsers:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

## Accessibility

- ARIA attributes for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Development Guidelines

- Use the Composition API for new components
- Follow the established project structure
- Write tests for new features
- Maintain responsive design across all views
- Document complex logic with comments
- Use TailwindCSS for styling
