const OpenAI = require('openai');
const LLMSettings = require('../models/LLMSettings');
const aiQueueService = require('./aiQueueService');
const { AIServiceError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

class AIService {
  static openRouterClient = null;
  static currentSettings = null;
  static responseFormatCache = new Map(); // Cache successful response formats per model
  static modelCapabilities = new Map(); // Cache model capabilities

  /**
   * Initialize or get OpenRouter client with current settings
   */
  static async getClient() {
    const settings = await LLMSettings.getActiveSettings();
    
    if (!settings) {
      // Use default settings if none exist
      const defaultApiKey = process.env.OPENROUTER_API_KEY || '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';
      const defaultSettings = new LLMSettings({
        provider: 'openrouter',
        apiKey: defaultApiKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        selectedModel: 'openai/gpt-4o-mini',
        isActive: true
      });
      await defaultSettings.save();
      this.currentSettings = defaultSettings;
    } else {
      this.currentSettings = settings;
    }

    // Recreate client if settings changed or client doesn't exist
    if (!this.openRouterClient || this.settingsChanged(settings)) {
      const apiKey = this.currentSettings.getDecryptedApiKey();
      
      this.openRouterClient = new OpenAI({
        apiKey: apiKey,
        baseURL: this.currentSettings.baseUrl || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.CLIENT_URL || 'https://brainybees.org',
          'X-Title': 'BrainyBees Educational Platform'
        }
      });
    }

    return this.openRouterClient;
  }

  static settingsChanged(newSettings) {
    if (!this.currentSettings) return true;
    return this.currentSettings._id.toString() !== newSettings._id.toString() ||
           this.currentSettings.updatedAt.getTime() !== newSettings.updatedAt.getTime();
  }

  static calculateProblemQuality({ question, options, answer, type, explanation, grade, subject }) {
    let score = 0;
    let factors = 0;
    
    // Question length and clarity (0-0.25)
    if (question && question.length > 20) {
      score += 0.15;
      factors++;
    }
    if (question && question.length > 50) {
      score += 0.10;
      factors++;
    }
    
    // For multiple choice problems, check options quality
    if (type === 'multiple-choice' && options) {
      // Options quality (0-0.25)
      if (options.length >= 4) {
        score += 0.15;
        factors++;
      }
      // Check for unique options
      if (options.length > 0) {
        const uniqueOptions = new Set(options);
        if (uniqueOptions.size === options.length) {
          score += 0.10;
          factors++;
        }
      }
    } else if (answer) {
      // For other problem types, check if answer exists
      score += 0.25;
      factors++;
    }
    
    // Explanation quality (0-0.25)
    if (explanation && explanation.length > 10 && explanation !== 'No explanation provided') {
      score += 0.15;
      factors++;
    }
    if (explanation && explanation.length > 30) {
      score += 0.10;
      factors++;
    }
    
    // Grade appropriateness (0-0.25)
    // Basic check - can be enhanced with more sophisticated analysis
    const gradeKeywords = {
      'K': ['count', 'color', 'shape', 'add', 'subtract'],
      '1': ['add', 'subtract', 'count', 'compare'],
      '2': ['add', 'subtract', 'multiply', 'measure'],
      '3': ['multiply', 'divide', 'fraction', 'area'],
      '4': ['fraction', 'decimal', 'angle', 'perimeter'],
      '5': ['decimal', 'percent', 'volume', 'coordinate']
    };
    
    const keywords = gradeKeywords[grade] || [];
    const questionLower = question?.toLowerCase() || '';
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      score += 0.25;
      factors++;
    }
    
    return factors > 0 ? score : 0.5; // Default to 0.5 if no factors
  }

  static removeDuplicateProblems(problems) {
    const seen = new Set();
    const unique = [];
    
    for (const problem of problems) {
      // Create a normalized key for comparison
      const questionKey = problem.question.toLowerCase().replace(/\s+/g, ' ').trim();
      const optionsKey = problem.options.map(o => o.toLowerCase().trim()).sort().join('|');
      const key = `${questionKey}::${optionsKey}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(problem);
      } else {
        console.warn('Duplicate problem detected:', problem.question.substring(0, 50) + '...');
      }
    }
    
    return unique;
  }

  /**
   * Generate problems based on subject, grade and parameters
   */
  static getModelFamily(model) {
    if (model.includes('claude')) return 'claude';
    if (model.includes('gemini')) return 'gemini';
    if (model.includes('gpt')) return 'gpt';
    if (model.includes('llama')) return 'llama';
    if (model.includes('mistral')) return 'mistral';
    return 'unknown';
  }

  static getModelCapabilities(model) {
    // Check cache first
    if (this.modelCapabilities.has(model)) {
      return this.modelCapabilities.get(model);
    }
    
    const family = this.getModelFamily(model);
    const capabilities = {
      supportsJsonMode: false,
      supportsSystemPrompt: true,
      maxRetries: 3,
      preferredFormat: 'text'
    };
    
    // Set capabilities based on model family and specific models
    if (family === 'gpt' && (model.includes('gpt-4') || model.includes('gpt-3.5-turbo'))) {
      capabilities.supportsJsonMode = true;
      capabilities.preferredFormat = 'json';
    } else if (family === 'claude') {
      capabilities.supportsJsonMode = false;
      capabilities.preferredFormat = 'markdown';
    } else if (family === 'gemini') {
      capabilities.supportsJsonMode = true;
      capabilities.preferredFormat = 'json';
    }
    
    // Cache the capabilities
    this.modelCapabilities.set(model, capabilities);
    return capabilities;
  }

  static parseClaudeResponse(content) {
    // Claude often returns markdown-wrapped JSON
    content = content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '');
      content = content.replace(/\n?```\s*$/, '');
    }
    return JSON.parse(content);
  }

  static parseGeminiResponse(content) {
    // Gemini sometimes adds extra text before/after JSON
    content = content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in Gemini response');
  }

  static parseGPTResponse(content) {
    // GPT models usually return clean JSON
    return JSON.parse(content.trim());
  }

  static parseModelResponse(content, model) {
    const modelFamily = this.getModelFamily(model);
    
    // Check cache for known response format
    const cachedFormat = this.responseFormatCache.get(model);
    if (cachedFormat) {
      console.log(`Using cached response format for ${model}: ${cachedFormat}`);
    }
    
    try {
      let parsed;
      switch (modelFamily) {
        case 'claude':
          parsed = this.parseClaudeResponse(content);
          break;
        case 'gemini':
          parsed = this.parseGeminiResponse(content);
          break;
        case 'gpt':
          parsed = this.parseGPTResponse(content);
          break;
        default:
          parsed = this.parseAIResponse(content);
      }
      
      // Normalize response format and cache successful format
      if (Array.isArray(parsed)) {
        this.responseFormatCache.set(model, 'array');
        return parsed;
      } else if (parsed.problems && Array.isArray(parsed.problems)) {
        this.responseFormatCache.set(model, 'object-with-problems');
        return parsed.problems;
      } else if (parsed["0"]) {
        this.responseFormatCache.set(model, 'numeric-keys');
        return Object.values(parsed);
      } else if (parsed.question) {
        this.responseFormatCache.set(model, 'single-problem');
        return [parsed];
      }
      
      console.error('Unexpected response format from', model, ':', parsed);
      return [];
    } catch (error) {
      console.error(`Failed to parse ${modelFamily} response:`, error.message);
      // Fallback to generic parser
      return this.parseAIResponse(content);
    }
  }

  static parseAIResponse(content) {
    // Generic parser for unknown models
    content = content.trim();
    
    // Debug log for different models
    if (content.length < 1000) {
      console.log('AI Response content:', content);
    }
    
    // Check if content is wrapped in markdown code blocks
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '');
      content = content.replace(/\n?```\s*$/, '');
      content = content.trim();
    }
    
    try {
      const parsed = JSON.parse(content);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.problems && Array.isArray(parsed.problems)) {
        return parsed.problems;
      } else if (parsed["0"]) {
        // Handle object with numeric keys
        return Object.values(parsed);
      } else if (parsed.question) {
        // Single problem object
        return [parsed];
      } else {
        console.error('Unexpected response format:', parsed);
        return [];
      }
    } catch (parseError) {
      logger.error('Failed to parse JSON:', { error: parseError.message, preview: content.substring(0, 200) });
      throw new AIServiceError('Invalid JSON response from AI service', parseError);
    }
  }

  static generateProblemTypePrompt(problemTypes, count) {
    const typeDistribution = {
      'multiple-choice': Math.floor(count * 0.3),
      'fill-in-blank': Math.floor(count * 0.25),
      'true-false': Math.floor(count * 0.2),
      'short-answer': Math.floor(count * 0.15),
      'matching': Math.floor(count * 0.1)
    };
    
    // Adjust for specific problem types if requested
    if (problemTypes && problemTypes.length > 0) {
      const requestedTypes = {};
      const perType = Math.floor(count / problemTypes.length);
      const remainder = count % problemTypes.length;
      
      problemTypes.forEach((type, index) => {
        requestedTypes[type] = perType + (index < remainder ? 1 : 0);
      });
      
      return requestedTypes;
    }
    
    // Ensure we have exactly the right count
    const total = Object.values(typeDistribution).reduce((a, b) => a + b, 0);
    if (total < count) {
      typeDistribution['fill-in-blank'] += count - total;
    }
    
    return typeDistribution;
  }

  static async generateProblemsWithRetry(params, maxRetries = 3) {
    let lastError;
    const delays = [1000, 2000, 4000]; // Exponential backoff delays
    
    // Define fallback models
    const fallbackModels = [
      'openai/gpt-4o-mini',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'google/gemini-flash-1.5-8b',
      'meta-llama/llama-3.2-3b-instruct:free'
    ];
    
    const originalModel = this.currentSettings?.selectedModel || fallbackModels[0];
    let modelIndex = fallbackModels.indexOf(originalModel);
    if (modelIndex === -1) modelIndex = 0;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try with fallback model if previous attempts failed
        if (attempt > 0 && modelIndex < fallbackModels.length - 1) {
          modelIndex++;
          const fallbackModel = fallbackModels[modelIndex];
          console.log(`Attempting with fallback model: ${fallbackModel}`);
          
          // Temporarily override the model
          const originalSettings = this.currentSettings;
          this.currentSettings = {
            ...originalSettings,
            selectedModel: fallbackModel
          };
          
          const result = await this.generateProblems(params);
          
          // Restore original settings
          this.currentSettings = originalSettings;
          
          return result;
        } else {
          console.log(`Attempt ${attempt + 1} of ${maxRetries} for problem generation`);
          return await this.generateProblems(params);
        }
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.message?.includes('subscription') || 
            error.message?.includes('API key') ||
            error.response?.status === 401 ||
            error.response?.status === 403) {
          throw error;
        }
        
        if (attempt < maxRetries - 1) {
          const delay = delays[attempt] || 5000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  static async generateProblems({ subject, grade, count = 10, topics, difficulty, customRequest, problemTypes = null }) {
    try {
      const client = await this.getClient();
      const model = this.currentSettings.selectedModel || 'openai/gpt-4o-mini';
      const config = this.currentSettings.modelConfig || {};

      const gradeDescriptions = {
        'K': 'Kindergarten (ages 5-6)',
        '1': '1st grade (ages 6-7)',
        '2': '2nd grade (ages 7-8)',
        '3': '3rd grade (ages 8-9)',
        '4': '4th grade (ages 9-10)',
        '5': '5th grade (ages 10-11)',
        '6': '6th grade (ages 11-12)',
        '7': '7th grade (ages 12-13)',
        '8': '8th grade (ages 13-14)',
        '9': '9th grade (ages 14-15)',
        '10': '10th grade (ages 15-16)',
        '11': '11th grade (ages 16-17)',
        '12': '12th grade (ages 17-18)',
        'College': 'College/University level',
        'Adult': 'Adult education level'
      };

      const subjectGuidelines = {
        'Math': 'Focus on numerical problems, equations, word problems, and mathematical concepts',
        'Science': 'Include experiments, scientific concepts, hypotheses, and analytical questions',
        'English': 'Grammar, vocabulary, reading comprehension, and writing exercises',
        'History': 'Historical events, dates, cause-and-effect, and critical analysis',
        'Geography': 'Maps, locations, physical features, cultures, and spatial relationships',
        'Language': 'Foreign language vocabulary, grammar, translation, and conversation',
        'Computer Science': 'Programming concepts, algorithms, logic, and problem-solving',
        'Art': 'Art history, techniques, color theory, and creative exercises',
        'Music': 'Music theory, instruments, composers, and musical notation',
        'Physical Education': 'Sports rules, health concepts, fitness, and anatomy',
        'Social Studies': 'Society, culture, government, and civic concepts',
        'Biology': 'Living organisms, cells, ecosystems, and life processes',
        'Chemistry': 'Chemical reactions, elements, compounds, and molecular structures',
        'Physics': 'Forces, motion, energy, waves, and physical phenomena',
        'Literature': 'Literary analysis, authors, themes, and critical reading',
        'Writing': 'Creative writing, essay structure, and composition skills',
        'General': 'Mixed topics across various subjects'
      };

      // Get problem type distribution
      const typeDistribution = this.generateProblemTypePrompt(problemTypes, count);
      
      let prompt;
      
      if (customRequest) {
        // Natural language request
        prompt = `You are an expert educational content creator. Based on this request, generate ${count} educational problems:

Request: "${customRequest}"
Subject: ${subject}
Grade Level: ${grade} (${gradeDescriptions[grade] || grade})
${topics ? `Topics: ${topics}` : ''}
${difficulty ? `Difficulty: ${difficulty}` : ''}

${subjectGuidelines[subject] || ''}

IMPORTANT: 
- Generate EXACTLY ${count} problems with these types:
${Object.entries(typeDistribution).map(([type, num]) => `  - ${num} ${type} problems`).join('\n')}
- Each problem should be appropriate for the grade level
- For Math problems, ensure calculations are grade-appropriate
- Make problems engaging and educational

Return ONLY a valid JSON array with problems in this format:

For multiple-choice:
{
  "question": "What is 2 + 2?",
  "type": "multiple-choice",
  "choices": ["2", "3", "4", "5"],
  "answer": "4",
  "explanation": "2 + 2 equals 4",
  "topic": "Addition",
  "difficulty": "${difficulty || 'medium'}"
}

For fill-in-blank:
{
  "question": "The capital of France is _____.",
  "type": "fill-in-blank",
  "answer": "Paris",
  "explanation": "Paris is the capital city of France",
  "topic": "Geography",
  "difficulty": "${difficulty || 'medium'}"
}

For true-false:
{
  "question": "The Earth is flat.",
  "type": "true-false",
  "answer": "False",
  "explanation": "The Earth is spherical, not flat",
  "topic": "Science",
  "difficulty": "${difficulty || 'medium'}"
}

For short-answer:
{
  "question": "Explain why water is important for life.",
  "type": "short-answer",
  "answer": "Water is essential for life because it helps transport nutrients, regulates body temperature, and is needed for cellular processes.",
  "explanation": "This answer should mention key functions of water in living organisms",
  "topic": "Biology",
  "difficulty": "${difficulty || 'medium'}"
}

For matching:
{
  "question": "Match the countries with their capitals",
  "type": "matching",
  "matchingPairs": [
    {"left": "France", "right": "Paris"},
    {"left": "Japan", "right": "Tokyo"},
    {"left": "Brazil", "right": "Brasília"}
  ],
  "explanation": "These are the correct capital cities for each country",
  "topic": "Geography",
  "difficulty": "${difficulty || 'medium'}"
}`;
      } else {
        // Standard generation
        const topicList = topics 
          ? (Array.isArray(topics) ? topics.join(', ') : topics.split(',').map(t => t.trim()).join(', '))
          : `various ${subject.toLowerCase()} topics`;
        
        prompt = `You are an expert ${subject} educator. Generate exactly ${count} ${difficulty || 'medium'} difficulty ${subject} problems for ${gradeDescriptions[grade] || grade} students.

Topics to cover: ${topicList}

${subjectGuidelines[subject] || ''}

Requirements:
1. Generate EXACTLY ${count} problems with these types:
${Object.entries(typeDistribution).map(([type, num]) => `   - ${num} ${type} problems`).join('\n')}
2. Each problem must be appropriate for ${grade} grade level
3. Mix problem types for variety and engagement
4. Ensure problems are educational and engaging
5. For Math: Include word problems and pure calculations
6. Vary the problem types and scenarios

Return ONLY a valid JSON array. Use these formats for different problem types:

Multiple-choice: {"question": "What is 5 × 3?", "type": "multiple-choice", "choices": ["10", "15", "20", "25"], "answer": "15", "explanation": "5 × 3 = 15", "topic": "Multiplication", "difficulty": "${difficulty || 'medium'}"}

Fill-in-blank: {"question": "5 + ___ = 12", "type": "fill-in-blank", "answer": "7", "explanation": "12 - 5 = 7", "topic": "Addition", "difficulty": "${difficulty || 'medium'}"}

True-false: {"question": "A triangle has 4 sides.", "type": "true-false", "answer": "False", "explanation": "A triangle has 3 sides", "topic": "Geometry", "difficulty": "${difficulty || 'medium'}"}

Short-answer: {"question": "What is the water cycle?", "type": "short-answer", "answer": "The water cycle is the continuous movement of water through evaporation, condensation, and precipitation.", "explanation": "Key processes should be mentioned", "topic": "Science", "difficulty": "${difficulty || 'medium'}"}

Matching: {"question": "Match the operations with their results", "type": "matching", "matchingPairs": [{"left": "2 + 3", "right": "5"}, {"left": "4 × 2", "right": "8"}, {"left": "10 - 4", "right": "6"}], "explanation": "These are the correct calculations", "topic": "Basic Operations", "difficulty": "${difficulty || 'medium'}"}

IMPORTANT: For multiple-choice, use "choices" array and ensure "answer" matches exactly one of the choices.`;
      }

      console.log(`Generating ${count} ${subject} problems for grade ${grade} using model: ${model}`);

      // Get model capabilities
      const capabilities = this.getModelCapabilities(model);
      
      const requestParams = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Always return valid JSON arrays of problems.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
        top_p: config.topP || 1
      };
      
      // Only add response_format if the model supports it
      if (capabilities.supportsJsonMode) {
        requestParams.response_format = { type: "json_object" };
      }
      
      // Queue the request
      const response = await aiQueueService.addToQueue({
        execute: async () => client.chat.completions.create(requestParams)
      });

      const content = response.choices[0].message.content;
      console.log('AI Response length:', content.length);
      
      let problems = this.parseModelResponse(content, model);
      
      if (response.usage) {
        console.log(`Token usage - Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens}, Total: ${response.usage.total_tokens}`);
      }

      // Validate problems
      if (!Array.isArray(problems) || problems.length === 0) {
        throw new Error('No problems generated');
      }

      // Validate each problem based on type
      problems = problems.filter(problem => {
        if (!problem.question) {
          console.warn('Problem missing question:', problem);
          return false;
        }
        
        // Type-specific validation
        const type = problem.type || 'multiple-choice';
        
        switch (type) {
          case 'multiple-choice':
            if (!problem.options && !problem.choices) {
              console.warn('Multiple-choice problem missing options/choices:', problem);
              return false;
            }
            if (!problem.answer && !problem.correctAnswer) {
              console.warn('Multiple-choice problem missing answer:', problem);
              return false;
            }
            break;
            
          case 'fill-in-blank':
          case 'short-answer':
            if (!problem.answer) {
              console.warn(`${type} problem missing answer:`, problem);
              return false;
            }
            break;
            
          case 'true-false':
            if (!problem.answer || !['True', 'False', 'true', 'false'].includes(problem.answer)) {
              console.warn('True-false problem missing or invalid answer:', problem);
              return false;
            }
            break;
            
          case 'matching':
            if (!problem.matchingPairs || !Array.isArray(problem.matchingPairs)) {
              console.warn('Matching problem missing matchingPairs:', problem);
              return false;
            }
            if (problem.matchingPairs.length < 2) {
              console.warn('Matching problem needs at least 2 pairs:', problem);
              return false;
            }
            break;
            
          default:
            console.warn('Unknown problem type:', type);
            return false;
        }
        
        return true;
      });

      if (problems.length === 0) {
        throw new Error('All generated problems failed validation');
      }

      // Ensure all problems have required fields and score quality
      problems = problems.map((problem, index) => {
        const type = problem.type || 'multiple-choice';
        let finalProblem = {
          question: problem.question,
          type: type,
          topic: problem.topic || topics?.[0] || subject,
          difficulty: problem.difficulty || difficulty || 'medium',
          explanation: problem.explanation || ''
        };
        
        // Handle type-specific fields
        switch (type) {
          case 'multiple-choice':
            const options = problem.options || problem.choices || ['Option A', 'Option B', 'Option C', 'Option D'];
            let correctAnswer = problem.correctAnswer || problem.answer || options[0];
            
            // Ensure correctAnswer is in options
            if (!options.includes(correctAnswer)) {
              console.warn(`Correct answer "${correctAnswer}" not in options for problem ${index + 1}, using first option`);
              correctAnswer = options[0];
            }
            
            finalProblem.choices = options;
            finalProblem.answer = correctAnswer;
            break;
            
          case 'fill-in-blank':
          case 'short-answer':
            finalProblem.answer = problem.answer || problem.correctAnswer || '';
            break;
            
          case 'true-false':
            // Normalize answer to Title Case
            const tfAnswer = (problem.answer || problem.correctAnswer || 'True').toString();
            finalProblem.answer = tfAnswer.charAt(0).toUpperCase() + tfAnswer.slice(1).toLowerCase();
            break;
            
          case 'matching':
            finalProblem.matchingPairs = problem.matchingPairs || [];
            // For matching, the answer is the pairs themselves
            finalProblem.answer = finalProblem.matchingPairs;
            break;
        }
        
        // Calculate quality score
        const qualityScore = this.calculateProblemQuality({
          question: problem.question,
          options: finalProblem.options,
          answer: finalProblem.answer,
          type: type,
          explanation: problem.explanation,
          grade: grade,
          subject: subject
        });
        
        finalProblem.qualityScore = qualityScore;
        return finalProblem;
      });
      
      // Remove duplicates
      problems = this.removeDuplicateProblems(problems);
      
      // Sort by quality score and log any low-quality problems
      problems.sort((a, b) => b.qualityScore - a.qualityScore);
      const lowQualityProblems = problems.filter(p => p.qualityScore < 0.5);
      if (lowQualityProblems.length > 0) {
        console.warn(`${lowQualityProblems.length} problems have low quality scores`);
      }
      
      // Ensure we have enough problems after filtering
      if (problems.length < count * 0.7) {
        console.warn(`Only ${problems.length} problems remaining after quality filtering (requested ${count})`);
      }

      const title = `${subject} Worksheet - Grade ${grade}`;
      return { 
        problems, 
        title, 
        metadata: { 
          model: model,
          tokensUsed: response.usage?.total_tokens || 0
        } 
      };

    } catch (error) {
      console.error('Error generating problems:', error);
      
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        throw new Error(`AI Service Error: ${error.response.data.error?.message || 'Failed to generate problems'}`);
      }
      
      throw error;
    }
  }

  /**
   * Analyze student performance and provide insights
   */
  static async analyzePerformance(worksheetData) {
    try {
      const client = await this.getClient();
      const model = this.currentSettings.selectedModel || 'openai/gpt-4o-mini';
      const config = this.currentSettings.modelConfig || {};

      const prompt = `Analyze this student's worksheet performance and provide educational insights:

Worksheet: ${worksheetData.title}
Subject: ${worksheetData.subject}
Grade: ${worksheetData.grade}
Score: ${worksheetData.score}/${worksheetData.totalQuestions} (${worksheetData.percentage}%)
Time Spent: ${worksheetData.timeSpent} seconds

Problems Analysis:
${worksheetData.problems.map((p, i) => `
${i + 1}. Topic: ${p.topic}
   Correct: ${p.isCorrect ? 'Yes' : 'No'}
   Student Answer: ${p.studentAnswer}
   Correct Answer: ${p.correctAnswer}
`).join('')}

Provide:
1. Overall performance summary
2. Strengths identified
3. Areas needing improvement
4. Specific recommendations for practice
5. Encouraging feedback for the student

Format as a friendly, constructive analysis.`;

      // Queue the request
      const response = await aiQueueService.addToQueue({
        execute: async () => client.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a supportive educational analyst providing constructive feedback to help students improve.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature || 0.7,
          max_tokens: 500
        })
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  /**
   * Get list of available models from OpenRouter
   */
  static async getAvailableModels() {
    try {
      // Get the API key from settings or use default
      const settings = await LLMSettings.getActiveSettings();
      const apiKey = settings ? settings.getDecryptedApiKey() : (process.env.OPENROUTER_API_KEY || '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');
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      
      // Include more models and better categorization
      const educationalModels = data.data
        .filter(model => {
          // Include a wider range of models
          return model.id.includes('gpt') || 
                 model.id.includes('claude') || 
                 model.id.includes('llama') ||
                 model.id.includes('mistral') ||
                 model.id.includes('deepseek') ||
                 model.id.includes('gemini') ||
                 model.id.includes('mixtral') ||
                 model.id.includes('qwen') ||
                 model.id.includes('command') ||
                 model.id.includes('dolphin');
        })
        .map(model => ({
          id: model.id,
          name: model.name || model.id,
          pricing: model.pricing,
          contextLength: model.context_length,
          description: model.description || `${model.id} - Context: ${model.context_length?.toLocaleString() || 'N/A'} tokens`
        }))
        .sort((a, b) => {
          // Sort by provider and capability
          const providerOrder = ['openai', 'anthropic', 'google', 'meta-llama', 'mistral', 'deepseek'];
          
          const getProvider = (id) => {
            for (const provider of providerOrder) {
              if (id.includes(provider)) return provider;
            }
            return 'other';
          };
          
          const aProvider = getProvider(a.id);
          const bProvider = getProvider(b.id);
          
          if (aProvider !== bProvider) {
            return providerOrder.indexOf(aProvider) - providerOrder.indexOf(bProvider);
          }
          
          // Within same provider, sort by capability (4 > 3.5 > 3, etc)
          return b.name.localeCompare(a.name);
        });

      return educationalModels;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

module.exports = AIService;