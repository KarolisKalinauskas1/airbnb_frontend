# Airbnb Camping Frontend

A Vue.js 3 frontend for an Airbnb-like camping platform.

## Features

- Modern Vue 3 composition API
- Responsive design with Tailwind CSS
- Interactive maps with Leaflet
- Date range selection
- Location search
- Booking management
- User authentication
- Payment processing
- Offline support
- Network status monitoring

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd airbnb-frontend/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your-mapbox-token
```

## Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Testing

Run tests:
```bash
npm test
```

## Project Structure

```
src/
├── assets/         # Static assets
├── components/     # Vue components
│   ├── auth/      # Authentication components
│   ├── common/    # Common UI components
│   └── dashboard/ # Dashboard components
├── composables/   # Vue composables
├── router/        # Vue Router configuration
├── services/      # API services
├── stores/        # Pinia stores
├── utils/         # Utility functions
└── views/         # Page components
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
