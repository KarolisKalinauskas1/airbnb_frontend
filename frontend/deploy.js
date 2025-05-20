// Deploy preparation script for Vercel

const fs = require('fs');
const path = require('path');

console.log('Starting Vercel deployment preparation...');

// Ensure the package.json is correctly formatted
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = require(packageJsonPath);
  
  console.log('Checking package.json...');
  console.log(`Current build command: ${packageJson.scripts.build}`);
  
  // Make sure dependencies are up-to-date
  if (!packageJson.dependencies['@vitejs/plugin-vue']) {
    console.log('Adding missing vue plugin dependency...');
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies['@vitejs/plugin-vue'] = '^4.3.4';
  }
  
  // Write back package.json if modified
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json is ready for deployment');
} catch (err) {
  console.error('Error processing package.json:', err);
}

// Create a version file to help with debugging
try {
  const versionInfo = {
    deployTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'public', 'version.json'), 
    JSON.stringify(versionInfo, null, 2)
  );
  console.log('Created version.json for debugging');
} catch (err) {
  console.error('Error creating version file:', err);
}

console.log('Deployment preparation complete!');
