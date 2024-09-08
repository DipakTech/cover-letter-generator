import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { Ai } from '@cloudflare/ai';
import wiki from 'wikipedia';

type Bindings = {
	SECRET_KEY: string;
	AI: Ai;
};

export interface Env {
	AI: string;
}
const app = new Hono<{ Bindings: Bindings }>();

const quotes = [
	{ text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
	{ text: "Life is what happens to you while you're busy making other plans.", author: 'John Lennon' },
	{ text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
	{ text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
	{ text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
	{ text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
	{ text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
	{ text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
	{ text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
	{ text: "Everything you've ever wanted is on the other side of fear.", author: 'George Addair' },
	{ text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
	{ text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
	{ text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'Franklin D. Roosevelt' },
	{ text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
	{ text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
	{ text: 'The only way to achieve the impossible is to believe it is possible.', author: 'Charles Kingsleigh' },
	{ text: 'Change your thoughts and you change your world.', author: 'Norman Vincent Peale' },
	{ text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
	{ text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
	{ text: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein' },
	{ text: "I have not failed. I've just found 10,000 ways that won't work.", author: 'Thomas A. Edison' },
	{ text: 'The mind is everything. What you think you become.', author: 'Buddha' },
	{ text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
	{ text: "Your time is limited, don't waste it living someone else's life.", author: 'Steve Jobs' },
	{
		text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.",
		author: 'Mark Twain',
	},
	{
		text: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.',
		author: 'Albert Schweitzer',
	},
	{ text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
	{
		text: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
		author: 'Christian D. Larson',
	},
	{ text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
	{ text: "You miss 100% of the shots you don't take.", author: 'Wayne Gretzky' },
	{ text: 'The harder I work, the luckier I get.', author: 'Samuel Goldwyn' },
	{ text: "Don't be afraid to give up the good to go for the great.", author: 'John D. Rockefeller' },
	{ text: 'I find that the harder I work, the more luck I seem to have.', author: 'Thomas Jefferson' },
	{ text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill' },
	{ text: 'The only place where success comes before work is in the dictionary.', author: 'Vidal Sassoon' },
	{ text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
	{ text: 'The power of imagination makes us infinite.', author: 'John Muir' },
	{ text: 'Do or do not. There is no try.', author: 'Yoda' },
	{ text: 'Be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
	{ text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
	{ text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
	{ text: 'Make each day your masterpiece.', author: 'John Wooden' },
	{ text: 'The purpose of life is a life of purpose.', author: 'Robert Byrne' },
	{ text: 'To be the best, you must be able to handle the worst.', author: 'Wilson Kanadi' },
	{ text: 'Life is 10% what happens to you and 90% how you react to it.', author: 'Charles R. Swindoll' },
];

function getDailyQuote() {
	const today = new Date();
	const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
	const index = seed % quotes.length;
	return quotes[index];
}

app.get('/', (c) => {
	return c.json({
		message: 'Welcome to the Daily Quote API',
		endpoints: {
			'/quote': 'Get the quote of the day',
			'/random': 'Get a random quote',
		},
	});
});

app.get('/quote', (c) => {
	const quote = getDailyQuote();
	return c.json(quote);
});

app.get('/get-suggestion/:search', async (c) => {
	try {
		const query = c.req.param('search');
		if (query) {
			const page = await wiki.page(query);
			// console.log(page);
			//Response of type @Page object
			const summary = await page.summary();
			console.log(summary.originalimage.source);
			return c.json({ intro: summary.extract, image: summary.originalimage.source });
		}
		//Response of type @wikiSummary - contains the intro and the main image
	} catch (error) {
		console.log(error);
		if (error instanceof Error) {
			return c.json({ error: error.message });
		}
		//=> Typeof wikiError
	}
});

app.get('/random', (c) => {
	const randomIndex = Math.floor(Math.random() * quotes.length);
	return c.json(quotes[randomIndex]);
});

app.post('/ai', async (c) => {
	try {
		const { company, position, description, cv } = await c.req.json();

		//  validate request body
		if (!company || !position || !description || !cv) {
			return c.json({ error: 'Missing required fields in request body' }, 400);
		}

		// Cover letter generation prompt
		const coverLetterPrompt = `
		Generate a professional and compelling cover letter for the position of ${position} at ${company}. 
		The cover letter should be tailored to the role description: ${description}
		
		Use the following information from the CV to highlight relevant skills and experiences:
		${cv}
  
		Please follow these guidelines when crafting the cover letter:
		1. Start with a strong opening paragraph that expresses enthusiasm for the position and briefly introduces the applicant.
		2. In the body paragraphs, highlight 2-3 key qualifications or experiences from the CV that directly relate to the role requirements. Provide specific examples or achievements where possible.
		3. Demonstrate knowledge of ${company} and explain why the applicant is interested in joining their team.
		4. Include a paragraph that connects the applicant's skills and experiences to the specific needs of the role, showing how they can contribute to the company's success.
		5. Conclude with a strong closing paragraph that reiterates interest in the position and company, and expresses eagerness for further discussion.
		6. Ensure the cover letter is concise (no more than one page), professionally formatted, and tailored to the company culture and industry.
		7. Use a polite and confident tone throughout the letter, balancing professionalism with personality.
		8. Incorporate relevant keywords from the role description to optimize for applicant tracking systems (ATS).
		9. Close the letter with a professional sign-off and the applicant's full name.
		
  
		Ensure the cover letter is concise, professionally formatted, and demonstrates enthusiasm for the role and company.
	  `;

		const coverLetterResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
			prompt: coverLetterPrompt,
		});

		return c.json({
			type: 'Cover Letter Generation',
			coverLetter: coverLetterResponse,
		});
	} catch (error) {
		console.error('Error processing request:', error);
		return c.json({ error: 'An error occurred while processing your request' }, 500);
	}
});

export default app;
