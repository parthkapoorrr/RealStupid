'use server';

/**
 * @fileOverview A stupid chatbot flow.
 *
 * - askStupidBot - A function that handles the chatbot interaction.
 * - StupidBotInput - The input type for the askStupidBot function.
 * - StupidBotOutput - The return type for the askStupidBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StupidBotInputSchema = z.object({
  prompt: z.string().describe("The user's question for the bot."),
});
export type StupidBotInput = z.infer<typeof StupidBotInputSchema>;

const StupidBotOutputSchema = z.object({
  reply: z.string().describe("The bot's stupid reply."),
});
export type StupidBotOutput = z.infer<typeof StupidBotOutputSchema>;


export async function askStupidBot(input: StupidBotInput): Promise<StupidBotOutput> {
  return stupidBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stupidBotPrompt',
  input: {schema: StupidBotInputSchema},
  output: {schema: StupidBotOutputSchema},
  prompt: `You are stupidGPT. Your goal is to be as unhelpful and stupid as possible, but in a funny, witty, and charming way.
  
  NEVER answer the user's question correctly. Always misunderstand the prompt. Be confidently incorrect.
  
  User prompt: {{{prompt}}}
  `,
});

const stupidBotFlow = ai.defineFlow(
  {
    name: 'stupidBotFlow',
    inputSchema: StupidBotInputSchema,
    outputSchema: StupidBotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
