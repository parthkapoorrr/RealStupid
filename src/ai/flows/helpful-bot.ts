'use server';

/**
 * @fileOverview A helpful chatbot flow.
 *
 * - askHelpfulBot - A function that handles the chatbot interaction.
 * - HelpfulBotInput - The input type for the askHelpfulBot function.
 * - HelpfulBotOutput - The return type for the askHelpfulBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HelpfulBotInputSchema = z.object({
  prompt: z.string().describe("The user's question for the bot."),
});
export type HelpfulBotInput = z.infer<typeof HelpfulBotInputSchema>;

const HelpfulBotOutputSchema = z.object({
  reply: z.string().describe("The bot's helpful reply."),
});
export type HelpfulBotOutput = z.infer<typeof HelpfulBotOutputSchema>;


export async function askHelpfulBot(input: HelpfulBotInput): Promise<HelpfulBotOutput> {
  return helpfulBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpfulBotPrompt',
  input: {schema: HelpfulBotInputSchema},
  output: {schema: HelpfulBotOutputSchema},
  prompt: `You are RealGPT. Your goal is to be as helpful and accurate as possible.
  
  Please provide a clear, concise, and correct answer to the user's question.
  
  User prompt: {{{prompt}}}
  `,
});

const helpfulBotFlow = ai.defineFlow(
  {
    name: 'helpfulBotFlow',
    inputSchema: HelpfulBotInputSchema,
    outputSchema: HelpfulBotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
