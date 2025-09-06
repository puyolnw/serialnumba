const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building frontend for unified server...');

try {
  // Build the frontend
  console.log('📦 Running npm run build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if dist folder exists
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist folder not found');
  }
  
  console.log('✅ Frontend build completed successfully!');
  console.log('📁 Build files are in: frontend/dist/');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. cd ../back');
  console.log('2. node server-unified.js');
  console.log('3. ngrok http 5000');
  console.log('');
  console.log('🌐 Your app will be available at:');
  console.log('   - Frontend: http://localhost:5000');
  console.log('   - API: http://localhost:5000/api');
  console.log('   - Ngrok URL: https://xxxx.ngrok-free.app');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
