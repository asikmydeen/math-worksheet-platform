const { openai, aiConfig } = require('../config/openai');

class AIService {
  /**
   * Generate problems based on subject, grade and parameters
   */
  static async generateProblems({ subject, grade, count = 10, topics, difficulty, customRequest }) {
    try {
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
        prompt = `You are an expert ${subject} teacher creating educational problems for grade ${grade} students.
        
User Request: "${customRequest}"

Subject: ${subject}
Grade Level: ${gradeDescriptions[grade]}
Subject Guidelines: ${subjectGuidelines[subject] || 'Create appropriate educational content'}

Generate exactly ${count} ${subject} problems based on the user's request. Ensure problems are age-appropriate, educationally valuable, and subject-specific.

Return the response in this exact JSON format:
{
  "title": "Brief worksheet title based on the request",
  "description": "One sentence describing what students will practice",
  "problems": [
    {
      "question": "The problem statement",
      "answer": "correct answer (can be text, number, or array for multiple answers)",
      "type": "fill-in-blank|multiple-choice|true-false|short-answer|essay|matching",
      "topic": "specific topic within the subject",
      "difficulty": "easy|medium|hard",
      "hints": ["First hint", "Second hint"],
      "explanation": "Step-by-step solution or explanation",
      "choices": ["option1", "option2", "option3", "option4"] // only for multiple-choice
    }
  ]
}

AGE-APPROPRIATE FORMATTING RULES:
- For Kindergarten-Grade 2 Math: Use simple format like "3 + 2 = ___" instead of "What is 3 + 2?"
- KINDERGARTEN MUST BE 100% MULTIPLE-CHOICE - NO TYPING REQUIRED
- For young grades (K-3): Prefer multiple-choice and true-false questions (easier for kids to click)
- For K-2: Use simple, direct language with visual-friendly problems
- For all grades: Mix question types, but favor clickable options over typing when possible
- Multiple-choice should have 3 options for kindergarten, 4 options for grades 1+
- True/false questions should be clear and unambiguous
- For math problems requiring work, still use fill-in-blank type

CRITICAL KINDERGARTEN RULES:
- ALL questions MUST be multiple-choice (no fill-in-blank, no typing)
- Use very simple numbers (1-10)
- Include visual/counting problems like "How many apples? 🍎🍎🍎" with choices
- Simple comparisons like "Which is bigger?" with 3 choices
- Basic shapes and colors with multiple-choice

Important:
- Make problems engaging and subject-appropriate
- 60% of questions should be multiple-choice or true-false for easier interaction
- For subjects like English/History, use more text-based questions
- For Science, include experimental or analytical questions
- Ensure difficulty matches the grade level
- Provide 2-3 helpful hints per problem
- Give clear explanations for learning`;

      } else {
        // Standard generation based on parameters
        const topicsList = topics && topics.length > 0 
          ? `Focus on these topics: ${topics.join(', ')}`
          : `Use a variety of age-appropriate topics within ${subject}`;

        prompt = `You are an expert ${subject} teacher creating problems for grade ${grade} students.

Subject: ${subject}
Grade Level: ${gradeDescriptions[grade]}
Subject Guidelines: ${subjectGuidelines[subject] || 'Create appropriate educational content'}
Difficulty: ${difficulty || 'medium'}
${topicsList}

Generate exactly ${count} ${subject} problems appropriate for this grade level.

Return the response in this exact JSON format:
{
  "title": "Grade ${grade} ${subject} Practice",
  "description": "Practice worksheet covering ${topics ? topics.join(', ') : 'various topics'}",
  "problems": [
    {
      "question": "The problem statement",
      "answer": "correct answer (can be text, number, or array)",
      "type": "fill-in-blank|multiple-choice|true-false|short-answer|essay|matching",
      "topic": "specific topic",
      "difficulty": "easy|medium|hard",
      "hints": ["First hint", "Second hint"],
      "explanation": "Clear explanation",
      "choices": ["option1", "option2", "option3", "option4"] // only for multiple-choice
    }
  ]
}

AGE-APPROPRIATE FORMATTING RULES:
- For Kindergarten-Grade 2 Math: Use simple format like "3 + 2 = ___" instead of "What is 3 + 2?"
- KINDERGARTEN MUST BE 100% MULTIPLE-CHOICE - NO TYPING REQUIRED
- For Kindergarten: Use very simple problems with 3 choices like "2 + 1 = ?" choices: [1, 2, 3]
- For young grades (K-3): Make 70% of questions multiple-choice or true-false (easier for kids)
- For middle grades (4-8): Use 50% multiple-choice/true-false, 50% fill-in-blank
- For high school (9-12): Mix all types based on subject needs
- Multiple-choice: 3 options for kindergarten, 4 options for grades 1+
- True/false: Use simple, clear statements

QUESTION TYPE DISTRIBUTION BY GRADE:
- Kindergarten: 100% multiple-choice (NO fill-in-blank, NO typing required)
- Grades 1-2: 70% multiple-choice/true-false, 30% simple fill-in-blank
- Grades 3-5: 60% multiple-choice/true-false, 40% fill-in-blank/short-answer
- Grades 6+: Balanced mix of all types

CRITICAL KINDERGARTEN RULES:
- ALL questions MUST be multiple-choice
- Use numbers 1-10 only
- Include counting questions with visual representations
- Simple comparisons (bigger/smaller, more/less)
- Basic shapes and patterns

Guidelines:
- Mix problem types appropriate for ${subject}
- Ensure appropriate difficulty progression
- Make problems engaging and relevant to students
- Content should be grade-appropriate
- Include 2-3 hints that guide without giving away the answer
- Explanations should teach the concept clearly
- For multiple-choice, provide clear, distinct options
- For true-false, make statements clear and unambiguous`;
      }

      // Build the completion parameters
      const completionParams = {
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert educator who creates engaging, educational problems for students across all subjects. Always return valid JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: aiConfig.temperature
      };

      // Only add response_format for models that support it
      const supportsJsonMode = 
        aiConfig.model.includes('gpt-4') ||
        aiConfig.model.includes('gpt-3.5-turbo');
      
      if (supportsJsonMode) {
        completionParams.response_format = { type: "json_object" };
      }

      // Determine which token parameter to use
      const modelName = aiConfig.model.toLowerCase();
      const useNewParam = 
        modelName.includes('gpt-4') || 
        modelName.includes('gpt-5') || 
        modelName.includes('turbo-2024') ||
        modelName.includes('2024') ||
        modelName.includes('2025') ||
        modelName.includes('o1') ||
        modelName.includes('o2') ||
        modelName.includes('gpt-4o');

      if (useNewParam) {
        completionParams.max_completion_tokens = aiConfig.max_tokens;
      } else {
        completionParams.max_tokens = aiConfig.max_tokens;
      }

      console.log(`Generating ${subject} worksheet for grade ${grade} using model: ${aiConfig.model}`);
      console.log('Completion params:', JSON.stringify({
        model: completionParams.model,
        temperature: completionParams.temperature,
        hasResponseFormat: !!completionParams.response_format,
        tokenParam: completionParams.max_completion_tokens ? 'max_completion_tokens' : 'max_tokens',
        tokenValue: completionParams.max_completion_tokens || completionParams.max_tokens
      }, null, 2));

      const completion = await openai.chat.completions.create(completionParams);

      // Log the raw response for debugging
      const rawContent = completion.choices[0].message.content;
      console.log('AI Raw Response:', rawContent);
      console.log('AI Response Length:', rawContent ? rawContent.length : 0);

      if (!rawContent) {
        throw new Error('Empty response from AI model');
      }

      const response = JSON.parse(rawContent);
      
      // Validate response structure
      if (!response.problems || !Array.isArray(response.problems)) {
        throw new Error('Invalid response structure from AI');
      }

      // Add metadata
      response.metadata = {
        model: aiConfig.model,
        generatedAt: new Date().toISOString(),
        requestType: customRequest ? 'natural-language' : 'standard',
        subject
      };

      return response;

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback to basic problem generation if AI fails
      if (error.message && (error.message.includes('API key') || error.message.includes('rate limit') || error.message.includes('max_tokens'))) {
        console.log('Falling back to basic problem generation...');
        return this.generateFallbackProblems(subject, grade, count, topics, difficulty);
      }
      
      throw error;
    }
  }

  /**
   * Fallback problem generation when AI is unavailable
   */
  static generateFallbackProblems(subject, grade, count, topics, difficulty) {
    const problems = [];
    const gradeNum = grade === 'K' ? 0 : parseInt(grade);
    
    for (let i = 0; i < count; i++) {
      let problem = {};
      
      // Generate subject-appropriate problems
      switch(subject) {
        case 'Math':
          if (gradeNum <= 2) {
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            problem = {
              question: `What is ${a} + ${b}?`,
              answer: a + b,
              topic: 'Addition',
              difficulty: 'easy'
            };
          } else {
            const a = Math.floor(Math.random() * 12) + 1;
            const b = Math.floor(Math.random() * 12) + 1;
            problem = {
              question: `What is ${a} × ${b}?`,
              answer: a * b,
              topic: 'Multiplication',
              difficulty: 'medium'
            };
          }
          break;
          
        case 'Science':
          problem = {
            question: `What state of matter is water at room temperature?`,
            answer: 'liquid',
            type: 'multiple-choice',
            choices: ['solid', 'liquid', 'gas', 'plasma'],
            topic: 'States of Matter',
            difficulty: 'easy'
          };
          break;
          
        case 'English':
          problem = {
            question: `Which word is a noun? (cat, run, blue, quickly)`,
            answer: 'cat',
            type: 'multiple-choice',
            choices: ['cat', 'run', 'blue', 'quickly'],
            topic: 'Parts of Speech',
            difficulty: 'easy'
          };
          break;
          
        case 'History':
          problem = {
            question: `Who was the first president of the United States?`,
            answer: 'George Washington',
            topic: 'American History',
            difficulty: 'easy'
          };
          break;
          
        default:
          problem = {
            question: `Sample question for ${subject}`,
            answer: 'Sample answer',
            topic: 'General',
            difficulty: 'medium'
          };
      }
      
      // Add common fields
      problem.type = problem.type || 'fill-in-blank';
      problem.hints = [
        'Think about what you know',
        'Review your notes',
        'Take your time'
      ];
      problem.explanation = 'Review this concept in your textbook.';
      
      problems.push(problem);
    }
    
    return {
      title: `Grade ${grade} ${subject} Practice`,
      description: `Practice worksheet for ${subject}`,
      problems,
      metadata: {
        model: 'fallback',
        generatedAt: new Date().toISOString(),
        requestType: 'fallback',
        subject
      }
    };
  }
}

module.exports = AIService;
