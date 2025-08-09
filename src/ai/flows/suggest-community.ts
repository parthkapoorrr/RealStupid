// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests relevant communities for a given post.
 *
 * The flow takes a post's content as input and returns a list of suggested community names.
 *
 * @Exported Members:
 *   - `suggestCommunity`: An async function that takes `SuggestCommunityInput` and returns a `SuggestCommunityOutput`.
 *   - `SuggestCommunityInput`: The input type for the `suggestCommunity` function.
 *   - `SuggestCommunityOutput`: The output type for the `suggestCommunity` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SuggestCommunityInputSchema = z.object({
  postContent: z.string().describe('The text content of the post.'),
});

export type SuggestCommunityInput = z.infer<typeof SuggestCommunityInputSchema>;

// Define the output schema
const SuggestCommunityOutputSchema = z.object({
  suggestedCommunities: z
    .array(z.string())
    .describe('An array of suggested community names.'),
});

export type SuggestCommunityOutput = z.infer<typeof SuggestCommunityOutputSchema>;

// Exported function to call the flow
export async function suggestCommunity(
  input: SuggestCommunityInput
): Promise<SuggestCommunityOutput> {
  return suggestCommunityFlow(input);
}

// Define the prompt
const suggestCommunityPrompt = ai.definePrompt({
  name: 'suggestCommunityPrompt',
  input: {schema: SuggestCommunityInputSchema},
  output: {schema: SuggestCommunityOutputSchema},
  prompt: `You are an expert community suggestion assistant.
  Given the content of a post, you will suggest relevant communities where the user should post it.
  Return an array of community names.

  Post Content: {{{postContent}}}
  `,
});

// Define the flow
const suggestCommunityFlow = ai.defineFlow(
  {
    name: 'suggestCommunityFlow',
    inputSchema: SuggestCommunityInputSchema,
    outputSchema: SuggestCommunityOutputSchema,
  },
  async input => {
    const {output} = await suggestCommunityPrompt(input);
    return output!;
  }
);
