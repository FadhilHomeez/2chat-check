const config = require('./src/config/config');

console.log('🔧 2Chat Chat Checker - Setup Test\n');

// Test configuration
console.log('📋 Configuration:');
console.log(`   API Base URL: ${config.api.baseUrl}`);
console.log(`   API Key: ${config.api.key ? '✅ Set' : '❌ Not set'}`);
console.log(`   Port: ${config.server.port}`);
console.log(`   Environment: ${config.server.env}\n`);

if (!config.api.key) {
  console.log('❌ Please set your 2Chat API key in the .env file');
  console.log('   Example: API_KEY=your_api_key_here');
  process.exit(1);
}

console.log('✅ Configuration looks good!');
console.log('\n📖 Next steps:');
console.log('   1. Start the API server: npm start');
console.log('   2. Use the CLI tool: npm run cli');
console.log('   3. Or make API requests to http://localhost:3000');
console.log('\n📚 Check README.md for detailed usage instructions'); 