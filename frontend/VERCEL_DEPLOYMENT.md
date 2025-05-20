# Camping Spots Frontend

This is the frontend application for the Camping Spots project, built with Vue.js and Vite.

## Deploying to Vercel

This project is set up for easy deployment to Vercel. Follow these steps:

### 1. Install the Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy using Vercel CLI (Optional)

Navigate to the `frontend` directory and run:

```bash
vercel
```

Follow the prompts to link your Vercel account and project.

### 3. Deploy via Vercel Dashboard

1. Create a new account or log in to your existing account on [Vercel](https://vercel.com/)
2. Click "Add New" and select "Project"
3. Import your Git repository
4. Configure these settings:
   - Framework Preset: Vue.js
   - Root Directory: `airbnb_frontend/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"

### Environment Variables

Make sure to add these environment variables in your Vercel project settings:

- `VITE_API_URL`: Your backend API URL
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GEOAPIFY_API_KEY`: Your Geoapify API key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

- `/src` - Application source code
- `/public` - Static assets
- `/dist` - Production build output (generated after running build command)
