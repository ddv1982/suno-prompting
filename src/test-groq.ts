import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY environment variable is not set.');
  process.exit(1);
}

async function testGroq() {
  try {
    console.log('Testing Groq connection with model: gpt-oss-120b...');
    
    const { text } = await generateText({
      model: groq('openai/gpt-oss-120b'),
      prompt: 'Hello, are you functional?',
    });

    console.log('Response from Groq:');
    console.log(text);
    console.log('\nConnection confirmed!');
  } catch (error) {
    console.error('Error connecting to Groq API:');
    console.error(error);
    process.exit(1);
  }
}

testGroq();
