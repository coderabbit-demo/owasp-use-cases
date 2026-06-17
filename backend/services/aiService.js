/**
 * AI Service - Main interface for AI operations
 * Supports both mock simulator and real LLM integration
 * Controlled by USE_REAL_LLM environment variable
 */

const aiSimulator = require('./aiSimulator');
const geminiService = require('./geminiService');
const anthropicService = require('./anthropicService');
require('dotenv').config();

const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';
const PREFERRED_PROVIDER = process.env.AI_PROVIDER || 'gemini'; // 'gemini' or 'anthropic'

class AIService {
  constructor() {
    this.mode = USE_REAL_LLM ? 'real' : 'mock';
    this.provider = PREFERRED_PROVIDER;

    console.log(`🤖 AI Service initialized in ${this.mode} mode`);
    if (USE_REAL_LLM) {
      console.log(`   Using provider: ${this.provider}`);
    }
  }

  /**
   * Get the appropriate AI service based on configuration
   */
  getService() {
    if (!USE_REAL_LLM) {
      return aiSimulator;
    }

    if (this.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      return anthropicService;
    } else if (this.provider === 'gemini' && process.env.GOOGLE_API_KEY) {
      return geminiService;
    } else {
      console.warn('⚠️  Real LLM requested but no API key found. Falling back to mock.');
      return aiSimulator;
    }
  }

  /**
   * Vulnerable chat endpoint - susceptible to prompt injection
   */
  async vulnerableChat(userInput) {
    const service = this.getService();
    try {
      const response = await service.vulnerableChat(userInput);
      return {
        success: true,
        response,
        mode: this.mode,
        provider: USE_REAL_LLM ? this.provider : 'mock'
      };
    } catch (error) {
      console.error('Error in vulnerable chat:', error);
      return {
        success: false,
        error: error.message,
        mode: this.mode
      };
    }
  }

  /**
   * Secure chat endpoint - protected against prompt injection
   */
  async secureChat(userInput) {
    const service = this.getService();
    try {
      const response = await service.secureChat(userInput);
      return {
        success: true,
        ...response,
        mode: this.mode,
        provider: USE_REAL_LLM ? this.provider : 'mock'
      };
    } catch (error) {
      console.error('Error in secure chat:', error);
      return {
        success: false,
        error: error.message,
        mode: this.mode
      };
    }
  }

  /**
   * Vulnerable content generation - produces unsafe output
   */
  async vulnerableGenerate(prompt) {
    const service = this.getService();
    try {
      const output = await service.vulnerableGenerate(prompt);
      return {
        success: true,
        output,
        mode: this.mode,
        provider: USE_REAL_LLM ? this.provider : 'mock'
      };
    } catch (error) {
      console.error('Error in vulnerable generate:', error);
      return {
        success: false,
        error: error.message,
        mode: this.mode
      };
    }
  }

  /**
   * Secure content generation - sanitizes output
   */
  async secureGenerate(prompt) {
    const service = this.getService();
    try {
      const result = await service.secureGenerate(prompt);
      return {
        success: true,
        ...result,
        mode: this.mode,
        provider: USE_REAL_LLM ? this.provider : 'mock'
      };
    } catch (error) {
      console.error('Error in secure generate:', error);
      return {
        success: false,
        error: error.message,
        mode: this.mode
      };
    }
  }

  /**
   * Get service information
   */
  getInfo() {
    return {
      mode: this.mode,
      provider: USE_REAL_LLM ? this.provider : 'mock',
      useRealLLM: USE_REAL_LLM,
      availableProviders: {
        gemini: !!process.env.GOOGLE_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY
      }
    };
  }
}

// Export singleton instance
module.exports = new AIService();
