const { openai, aiConfig } = require('./src/config/openai');

async function testOpenAI() {
  try {
    console.log('Testing OpenAI with model:', aiConfig.model);
    console.log('Using temperature:', aiConfig.temperature);
    
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI is working!"' }
      ],
      max_completion_tokens: 100,
      temperature: aiConfig.temperature
    });
    
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOpenAI();