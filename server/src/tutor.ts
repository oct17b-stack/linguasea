import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { L1, Target } from '@linguasea/contract';
import { z } from 'zod';

import type { Scenario } from './scenarios';

/** One tutor turn, as the app shows it. Empty strings mean "nothing to show". */
export const TutorTurn = z.object({
  reply: z.string().describe("The tutor's next line, in the target language only."),
  reading: z.string().describe('The reply in the romanization named in the scenario.'),
  translation: z.string().describe("The reply translated into the learner's language."),
  feedback: z
    .string()
    .describe("In the learner's language: one short, kind remark on the learner's last line, or '' when there is nothing useful to say."),
  correction: z
    .string()
    .describe("The learner's last line corrected, in the target language, or '' when it was fine or there was no line."),
  hint: z
    .string()
    .describe("In the learner's language: what the learner could say next, including one example sentence in the target language."),
  done: z.boolean().describe('True once the scenario goal is reached or the conversation has run its course.'),
});
export type TutorTurn = z.infer<typeof TutorTurn>;

export type TutorLine = { role: 'tutor' | 'learner'; text: string };

export interface Tutor {
  turn(scenario: Scenario, history: TutorLine[]): Promise<TutorTurn>;
}

export class TutorError extends Error {}

/** Default model; override with TUTOR_MODEL. */
export const DEFAULT_TUTOR_MODEL = 'claude-opus-5-5';

const TARGET_NAMES: Record<Target, { name: string; reading: string }> = {
  zh: { name: 'Mandarin Chinese (simplified characters)', reading: 'Hanyu Pinyin with tone marks' },
  en: { name: 'American English', reading: 'American IPA without slashes' },
  ja: { name: 'Japanese (polite です/ます style unless the role-play calls for casual or honorific speech)', reading: 'Hepburn romaji with macrons' },
  ko: { name: 'Korean (polite 해요체 unless the role-play calls for casual or formal speech)', reading: 'Revised Romanization' },
};

const L1_NAMES: Record<L1, string> = {
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  fil: 'Filipino',
  km: 'Khmer',
  lo: 'Lao',
  my: 'Burmese',
};

// Frozen across every request so it can be cached; everything scenario-specific comes after it.
const RULES = `You are the conversation partner inside LinguaSEA, an app where people from Southeast Asia practise a new language. Each request gives you a role-play scenario taken from the unit the learner just studied, the conversation so far, and asks for your next turn.

How to play:
- Stay in the scenario. You play role B; the learner plays role A (a Thai university student called Nam, unless the scenario says otherwise).
- Speak at the scenario's level: one or two short sentences per turn, built mostly from the scenario's vocabulary and simple grammar. Ask a question that invites the learner to use the unit's words.
- If the learner writes in their own language, says they don't know, or goes silent, answer simply in the target language and make the hint especially concrete.
- Feedback is for real mistakes that would confuse a listener or matter for the unit's goal; skip trivia. When the learner does well, say so briefly. Put the corrected sentence in "correction" only when something needed fixing.
- Keep everything friendly and suitable for teenagers: everyday talk about friends, crushes and couples is fine when the scenario is about it (e.g. advice to a friend, an ideal type), but no flirting with the learner, sexual content, violence, drugs, gambling, politics or religion debates. If the learner steers there, steer back to the scenario.
- Never ask for personal details (full name, phone, address, school, accounts, photos). If the learner volunteers them, do not repeat them and remind them kindly in "feedback" not to share personal information.
- If the learner asks whether you are an AI or asks about the app, answer honestly in one short sentence in their language inside "feedback", then continue the scenario.
- Set "done" to true when the goal has been reached or after about eight learner turns; then make "reply" a friendly closing line and use "feedback" to praise one specific thing they did well.
- "reading" must romanize exactly the text of "reply". "translation", "feedback" and "hint" are in the learner's language.`;

function scenarioText(s: Scenario): string {
  const t = TARGET_NAMES[s.target];
  const vocab = s.vocabulary.map((v) => `- ${v.text} (${v.reading}): ${v.meaning}`).join('\n');
  const examples = s.examples.map((e) => `${e.speaker === 'a' ? 'A' : 'B'}: ${e.text} — ${e.meaning}`).join('\n');
  return `Scenario
Target language: ${t.name}. Romanization for "reading": ${t.reading}.
Learner's language: ${L1_NAMES[s.l1]}.
Level: CEFR ${s.cefr}.
Unit: ${s.title}
Goal: ${s.goal}
${s.situation ? `Role-play: ${s.situation}\n` : ''}
Vocabulary the learner knows (use these; avoid other words where you can):
${vocab || '(none yet)'}

Example exchange from the lesson (for tone and level; do not copy it line by line):
${examples || '(none)'}`;
}

function transcript(history: TutorLine[]): string {
  if (!history.length) return 'The conversation has not started. Write your opening line as B.';
  const lines = history.map((l) => `${l.role === 'tutor' ? 'B' : 'A'}: ${l.text}`).join('\n');
  return `Conversation so far:\n${lines}\n\nWrite your next turn as B.`;
}

/** What the learner sees when the model declines: back to the lesson, no error screen. */
function declinedTurn(): TutorTurn {
  return { reply: '', reading: '', translation: '', feedback: '', correction: '', hint: '', done: true };
}

type ParseClient = { beta: { messages: { parse: Anthropic['beta']['messages']['parse'] } } };

export class ClaudeTutor implements Tutor {
  constructor(
    private client: ParseClient = new Anthropic(),
    private model: string = DEFAULT_TUTOR_MODEL,
  ) {}

  async turn(scenario: Scenario, history: TutorLine[]): Promise<TutorTurn> {
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      // On a safety decline the API retries on Anthropic's recommended fallback model.
      fallbacks: 'default',
      // Short conversational turns: low effort keeps latency and cost down.
      output_config: { effort: 'low', format: betaZodOutputFormat(TutorTurn) },
      system: [
        { type: 'text', text: RULES },
        { type: 'text', text: scenarioText(scenario), cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: transcript(history) }],
    });
    if (response.stop_reason === 'refusal') return declinedTurn();
    if (!response.parsed_output) throw new TutorError(`no tutor turn (stop_reason ${response.stop_reason})`);
    return response.parsed_output;
  }
}

/** Masks phone numbers and e-mail addresses before learner text leaves the server. */
export function redactPersonalInfo(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[…]')
    .replace(/\+?\d[\d\s-]{7,}\d/g, '[…]');
}
