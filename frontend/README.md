# Camping Spots - Frontend

A modern, responsive Vue.js 3 frontend application for the Camping Spots platform. This single-page application (SPA) provides an intuitive user interface for discovering, booking, and managing camping experiences.

## Technology Stack

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Maps**: Leaflet for interactive location maps
- **Form Handling**: VeeValidate
- **Date Picker**: Vue3-Datepicker
- **Testing**: Vitest

## Directory Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, and styles
│   ├── components/      # Reusable Vue components
│   │   ├── auth/        # Authentication components
│   │   ├── booking/     # Booking components
│   │   ├── camping/     # Camping spot components
│   │   ├── common/      # Shared components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── layout/      # Layout components
│   │   ├── map/         # Map components
│   │   └── reviews/     # Review components
│   ├── composables/     # Vue composition functions
│   ├── router/          # Vue Router configuration
│   ├── services/        # API services
│   ├── stores/          # Pinia stores
│   ├── utils/           # Utility functions
│   ├── views/           # Page components
│   ├── App.vue          # Root component
│   └── main.js          # Entry point
├── .env                 # Environment variables
├── index.html           # HTML entry point
├── tailwind.config.js   # Tailwind configuration
└── vite.config.js       # Vite configuration
```

## Features

### User Authentication

- Login/Register with email and password
- Social login with Google
- Password reset functionality
- Protected routes for authenticated users
- Role-based access control

### Camping Spot Discovery

- Browse camping spots with filtering options
- Search by location, dates, and amenities
- Interactive map view with markers
- Detailed camping spot pages with image galleries
- Availability calendar

### Booking Management

- Book camping spots with date selection
- View bookings history
- Cancel bookings
- Leave reviews for past bookings

### User Dashboard

- View and edit profile information
- Manage bookings
- View favorite camping spots
- Upload profile pictures

### Owner Dashboard

- Manage camping spots
- Add new camping spots with details and images
- View booking requests and history
- Monitor earnings and statistics

## Setup Instructions

### Prerequisites

- Node.js 16+
- npm or yarn

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` file:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_APP_NAME=Camping Spots
   VITE_DEBUG_ENABLED=true
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Access the application at http://localhost:5173

### Building for Production

1. Update environment variables in `.env.production`
2. Build the application:
   ```bash
   npm run build
   ```
3. Preview the production build:
   ```bash
   npm run preview
   ```

## State Management

The application uses Pinia for state management with the following stores:

- **authStore**: Authentication state and user information
- **campingStore**: Camping spot data and filtering
- **bookingStore**: Booking functionality
- **reviewStore**: Review management
- **uiStore**: UI state (modals, notifications)

Example store usage:
```javascript
import { useCampingStore } from '@/stores/camping'

export default {
  setup() {
    const campingStore = useCampingStore()
    
    // Access state
    const spots = computed(() => campingStore.filteredSpots)
    
    // Call actions
    const loadSpots = async () => {
      await campingStore.fetchCampingSpots()
    }
    
    return { spots, loadSpots }
  }
}
```

## API Integration

The application communicates with the backend API using Axios. API services are organized by domain:

```javascript
// src/services/bookingService.js
import api from '@/plugins/axios'

export default {
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData)
    return response.data
  },
  
  async getUserBookings() {
    const response = await api.get('/bookings')
    return response.data
  }
}
```

## Routing

Vue Router is configured with the following routes:

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/camping-spots` - Browse camping spots
- `/camping-spots/:id` - Camping spot details
- `/booking/:id` - Booking page
- `/account` - User account page
- `/dashboard` - Owner dashboard
- `/favorites` - Favorite camping spots

Protected routes require authentication:

```javascript
// src/router/index.js
const routes = [
  {
    path: '/account',
    component: AccountView,
    meta: { requiresAuth: true }
  }
]
```

## Responsive Design

The application is fully responsive with:

- Mobile-first design approach
- Breakpoints for different screen sizes
- Tailwind utility classes for responsive layouts
- Custom responsive components

## Testing

The project uses Vitest for unit testing:

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## Deployment on Vercel

This frontend application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Root directory: `airbnb_frontend/frontend`
   - Framework preset: `Vue`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables
4. Deploy

## Best Practices

- Component composition for reusability
- Proper typing with JSDoc or TypeScript
- Lazy loading of routes for better performance
- Efficient state management with Pinia
- Centralized API error handling
- Consistent code style with ESLint

## License

This project is licensed under the MIT License.
