# AI API Integration Guide

## 🎯 RECOMMENDED: OpenRouter (Single API for 499+ Models)

**Why OpenRouter is Perfect:**
- ✅ **One API Key** = Access to GPT-4, Claude, Gemini, and 496+ other models
- ✅ **FREE Models Available** (DeepSeek V3.1, Gemini 2.5 Flash, etc.)
- ✅ **Much Cheaper** than direct APIs
- ✅ **Built-in Fallbacks** and automatic model selection
- ✅ **OpenAI Compatible** - uses existing OpenAI SDK

### OpenRouter Quick Setup (EASIEST)

1. **Get OpenRouter API Key**
   - Go to https://openrouter.ai/keys
   - Create account and get API key (starts with `sk-or-`)

2. **Install OpenAI SDK**
   ```bash
   cd backend
   npm install openai
   ```

3. **Add to .env**
   ```bash
   OPENROUTER_API_KEY=sk-or-your-actual-openrouter-key
   ```

4. **Replace Mock in AIModelFactory.ts**
   ```typescript
   import { createOpenRouterModels } from './OpenRouterIntegration';
   
   // Replace mock classes with:
   const openRouterModels = createOpenRouterModels(process.env.OPENROUTER_API_KEY!);
   
   export const gpt4Model = openRouterModels.gpt4;      // GPT-4 Omni
   export const claudeModel = openRouterModels.claude;  // Claude 3.5 Sonnet  
   export const geminiModel = openRouterModels.deepseek; // DeepSeek V3.1 (FREE!)
   ```

**Cost Comparison:**
- OpenRouter GPT-4: ~$0.005/1K tokens (vs $0.03 direct)
- OpenRouter Claude: ~$0.003/1K tokens (vs $0.015 direct)  
- DeepSeek V3.1: **FREE** (unlimited)
- Gemini 2.5 Flash: **FREE** (with limits)

---

## Alternative: Individual APIs

### 1. Install Required Dependencies

```bash
cd backend
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. Get API Keys

**OpenAI (GPT-4):**
- Go to https://platform.openai.com/api-keys
- Create a new secret key
- Copy the key (starts with `sk-`)

**Anthropic (Claude):**
- Go to https://console.anthropic.com/
- Navigate to API Keys
- Create a new key
- Copy the key (starts with `sk-ant-`)

**Google AI (Gemini):**
- Go to https://makersuite.google.com/app/apikey
- Create a new API key
- Copy the key

### 3. Configure Environment Variables

Copy `env.example` to `.env` in the backend directory:
```bash
cp env.example .env
```

Edit `.env` and add your actual API keys:
```bash
OPENAI_API_KEY=sk-your-actual-openai-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
GOOGLE_AI_API_KEY=your-actual-google-ai-key
```

### 4. Replace Mock Implementations

Replace the mock classes in `backend/src/services/aiModels/AIModelFactory.ts` with the real implementations from the `examples/` folder.

## File Structure

```
backend/src/
├── config/
│   └── aiServices.ts              # ✅ Already configured - reads environment variables
├── services/
│   └── aiModels/
│       ├── AIModelFactory.ts      # 🔄 Replace mocks with real implementations
│       └── examples/              # 📁 Real integration examples created
│           ├── GPT4Integration.ts
│           ├── ClaudeIntegration.ts
│           └── GeminiIntegration.ts
└── controllers/
    └── aiAnalysisController.ts    # ✅ Already set up to use AIModelFactory
```

## How It Works

1. **Environment Configuration**: `aiServices.ts` automatically detects which API keys are available
2. **Service Registration**: Only services with valid API keys get registered
3. **Automatic Fallbacks**: If one service fails, it tries the next in the fallback order
4. **Rate Limiting**: Built-in rate limiting per service
5. **Circuit Breaker**: Prevents cascading failures

## Testing

You can test one service at a time by only setting one API key:

```bash
# Test only GPT-4
OPENAI_API_KEY=your-key
AI_ENABLED_SERVICES=gpt4

# Test only Claude
ANTHROPIC_API_KEY=your-key
AI_ENABLED_SERVICES=claude

# Test only Gemini
GOOGLE_AI_API_KEY=your-key
AI_ENABLED_SERVICES=gemini
```

## Cost Considerations

- **GPT-4**: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
- **Claude**: ~$0.015 per 1K tokens (input) + $0.075 per 1K tokens (output)
- **Gemini**: ~$0.0005 per 1K characters (much cheaper for text)

Start with Gemini for development/testing due to lower costs.

## Security Best Practices

1. Never commit `.env` files to version control
2. Use different API keys for dev/staging/production
3. Set up billing alerts on your AI service accounts
4. Monitor API usage regularly
5. Implement proper error handling and rate limiting
