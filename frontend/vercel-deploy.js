// Vercel deployment script

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel deployment preparation...');

// Check for critical files
const criticalFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  'vercel.json',
  'src/main.js',
  'src/router/index.js'
];

console.log('Checking for critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ MISSING: ${file}`);
    process.exit(1);
  }
});

// Ensure vercel.json is properly configured
console.log('\nChecking vercel.json configuration...');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
console.log(vercelConfig);

if (!vercelConfig.routes || !vercelConfig.routes.find(r => r.src === '/(.*)')) {
  console.error('❌ vercel.json is missing proper SPA route configuration');
  console.log('Adding proper SPA route configuration...');
  vercelConfig.routes = [
    {
      "src": "/assets/(.*)",
      "headers": { "cache-control": "public, max-age=31536000, immutable" },
      "continue": true
    },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html", "status": 200 }
  ];
  fs.writeFileSync(
    path.join(__dirname, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  console.log('✅ Fixed vercel.json configuration');
}

// Create environment variables file for production
console.log('\nChecking environment variables configuration...');
const envFilePath = path.join(__dirname, '.env');
const envProductionPath = path.join(__dirname, '.env.production');

if (fs.existsSync(envFilePath)) {
  console.log('✅ .env file exists');
  
  // Ensure .env.production exists with proper environment variables
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const envLines = envContent.split('\n').filter(line => 
    !line.trim().startsWith('#') && 
    line.trim() !== '' && 
    line.includes('=')
  );
  
  // Create .env.production with production values
  const prodEnvContent = envLines
    .map(line => {
      // Replace localhost URLs with production URLs if needed
      if (line.includes('VITE_API_URL=') && line.includes('localhost')) {
        return 'VITE_API_URL=https://airbnbbackend-production-5ffb.up.railway.app';
      }
      return line;
    })
    .join('\n');
  
  fs.writeFileSync(envProductionPath, prodEnvContent);
  console.log('✅ Created .env.production file');
} else {
  console.warn('⚠️ No .env file found. Make sure environment variables are set in Vercel dashboard.');
}

// Run build to ensure it works
console.log('\nRunning build to test configuration...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('\n✅ Deployment preparation complete! Your app is ready for Vercel.');
console.log('\nNext steps:');
console.log('1. Commit these changes to your repository');
console.log('2. Deploy to Vercel using the dashboard or CLI');
console.log('3. Make sure to set all environment variables in the Vercel dashboard');
