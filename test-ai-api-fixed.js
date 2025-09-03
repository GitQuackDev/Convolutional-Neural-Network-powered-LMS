// Test script to verify AI API endpoint after fixes
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testAIAnalysis() {
  try {
    console.log('🧪 Testing AI Analysis API with fixes...');
    
    // Create test file
    const testContent = "This is a test document for AI analysis. It contains educational content about programming concepts.";
    const testFilePath = './test-content.txt';
    fs.writeFileSync(testFilePath, testContent);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('selectedModels', JSON.stringify(['gemini']));
    
    console.log('📤 Making API request...');
    
    // Make request to backend
    const response = await fetch('http://localhost:5000/api/ai-analysis/analyze-multi', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
        // Add auth header if needed
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success! Response received:');
    console.log('📊 AI Results structure:', JSON.stringify(result, null, 2));
    
    // Verify expected structure
    if (result.aiResults) {
      console.log('✅ aiResults field present');
      Object.keys(result.aiResults).forEach(model => {
        const modelResult = result.aiResults[model];
        console.log(`🤖 Model ${model}:`, {
          hasModel: !!modelResult.model,
          hasStatus: !!modelResult.status,
          hasConfidence: typeof modelResult.confidence === 'number',
          hasResults: !!modelResult.results,
          hasDescription: !!modelResult.results?.description,
          hasInsights: Array.isArray(modelResult.results?.insights),
          hasRecommendations: Array.isArray(modelResult.results?.recommendations)
        });
      });
    } else {
      console.log('❌ No aiResults field in response');
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('🧹 Test file cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIAnalysis();
