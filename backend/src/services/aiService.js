const OpenAI = require('openai');
const LLMSettings = require('../models/LLMSettings');

class AIService {
  static openRouterClient = null;
  static currentSettings = null;

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

  /**
   * Generate problems based on subject, grade and parameters
   */
  static parseAIResponse(content) {
    // Remove any leading/trailing whitespace
    content = content.trim();
    
    // Check if content is wrapped in markdown code blocks
    if (content.startsWith('```')) {
      // Remove markdown code blocks
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
      console.error('Failed to parse JSON:', parseError.message);
      console.error('Content preview:', content.substring(0, 200));
      throw new Error('Invalid JSON response from AI');
    }
  }

  static async generateProblems({ subject, grade, count = 10, topics, difficulty, customRequest }) {
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
- Generate EXACTLY ${count} problems
- Each problem should be appropriate for the grade level
- Include variety in problem types
- For Math problems, ensure calculations are grade-appropriate
- Make problems engaging and educational

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "The problem statement",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option exactly as it appears in options",
    "explanation": "Brief explanation of why this is correct",
    "type": "multiple-choice",
    "topic": "Specific topic",
    "difficulty": "${difficulty || 'medium'}"
  }
]`;
      } else {
        // Standard generation
        const topicList = topics 
          ? (Array.isArray(topics) ? topics.join(', ') : topics.split(',').map(t => t.trim()).join(', '))
          : `various ${subject.toLowerCase()} topics`;
        
        prompt = `You are an expert ${subject} educator. Generate exactly ${count} ${difficulty || 'medium'} difficulty ${subject} problems for ${gradeDescriptions[grade] || grade} students.

Topics to cover: ${topicList}

${subjectGuidelines[subject] || ''}

Requirements:
1. Generate EXACTLY ${count} multiple-choice problems
2. Each problem must be appropriate for ${grade} grade level
3. Include 4 options (A, B, C, D) for each problem
4. Ensure problems are educational and engaging
5. For Math: Include word problems and pure calculations
6. Vary the problem types and scenarios

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "The problem statement",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option exactly as it appears in options",
    "explanation": "Brief explanation of why this is correct",
    "type": "multiple-choice",
    "topic": "Specific topic covered",
    "difficulty": "${difficulty || 'medium'}"
  }
]`;
      }

      console.log(`Generating ${count} ${subject} problems for grade ${grade} using model: ${model}`);

      const response = await client.chat.completions.create({
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
        top_p: config.topP || 1,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      console.log('AI Response length:', content.length);
      
      let problems = this.parseAIResponse(content);
      
      if (response.usage) {
        console.log(`Token usage - Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens}, Total: ${response.usage.total_tokens}`);
      }

      // Validate problems
      if (!Array.isArray(problems) || problems.length === 0) {
        throw new Error('No problems generated');
      }

      // Ensure all problems have required fields
      problems = problems.map((problem, index) => ({
        question: problem.question || `Problem ${index + 1}`,
        options: problem.options || problem.choices || ['Option A', 'Option B', 'Option C', 'Option D'],
        choices: problem.choices || problem.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: problem.correctAnswer || problem.answer || 'Option A',
        answer: problem.answer || problem.correctAnswer || 'Option A',
        explanation: problem.explanation || 'No explanation provided',
        type: problem.type || 'multiple-choice',
        topic: problem.topic || subject,
        difficulty: problem.difficulty || difficulty || 'medium'
      }));

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

      const response = await client.chat.completions.create({
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