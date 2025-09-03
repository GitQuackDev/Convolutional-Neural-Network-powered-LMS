#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Create a simple test file
const testContent = 'Hello world, this is a test document for AI analysis.';
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, testContent);

console.log('Created test file:', testFilePath);
console.log('File content:', testContent);
console.log('');

// Test the API endpoint
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testAIAnalysis() {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('selectedModels', JSON.stringify(['gemini']));

    console.log('🔍 Testing API endpoint: POST /api/ai-analysis/analyze-multi');
    console.log('📤 Sending file:', path.basename(testFilePath));
    console.log('📤 Selected models: ["gemini"]');
    console.log('');

    const response = await fetch('http://localhost:5000/api/ai-analysis/analyze-multi', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token' // Using a test token
      }
    });

    console.log('📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Response received successfully');
    console.log('📊 Response structure:', JSON.stringify(result, null, 2));
    
    if (result.aiResults) {
      console.log('🔬 AI Results found:', Object.keys(result.aiResults));
      Object.entries(result.aiResults).forEach(([model, analysis]) => {
        console.log(`\n🤖 ${model.toUpperCase()} Analysis:`);
        console.log('  - Confidence:', analysis.confidence);
        console.log('  - Processing Time:', analysis.processingTime + 'ms');
        console.log('  - Insights:', analysis.results?.insights?.length || 0);
      });
    } else {
      console.log('⚠️ No aiResults found in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Cleaned up test file');
    }
  }
}

// Run the test
testAIAnalysis();
