import type { Target } from '@linguasea/contract';

import { toWav16k } from './transcode';

export type WordScore = { word: string; accuracy: number; error?: string };

export type Score = {
  /** "no-speech" when nothing usable was heard; scores are then 0. */
  status: 'ok' | 'no-speech';
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  recognized: string;
  words: WordScore[];
};

export type AssessInput = { audio: Buffer; text: string; target: Target };

export interface Assessor {
  assess(input: AssessInput): Promise<Score>;
}

/** Speech to text, for answering the AI tutor by voice. '' when nothing was understood. */
export interface Transcriber {
  transcribe(input: { audio: Buffer; target: Target }): Promise<string>;
}

export const SPEECH_LOCALES: Record<Target, string> = { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };

export class AssessError extends Error {}

type AzureOptions = {
  key: string;
  region: string;
  fetch?: typeof fetch;
  transcode?: (audio: Buffer) => Promise<Buffer>;
};

/** Azure AI Speech (REST, short audio ≤ 30 s): pronunciation assessment and plain recognition. The key never leaves the server. */
export class AzureAssessor implements Assessor, Transcriber {
  constructor(private opts: AzureOptions) {}

  private async recognize(audio: Buffer, target: Target, format: 'simple' | 'detailed', extraHeaders: Record<string, string> = {}) {
    const wav = await (this.opts.transcode ?? toWav16k)(audio);
    const url =
      `https://${this.opts.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1` +
      `?language=${SPEECH_LOCALES[target]}&format=${format}`;
    const res = await (this.opts.fetch ?? fetch)(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.opts.key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: new Uint8Array(wav),
    });
    if (!res.ok) throw new AssessError(`speech service answered ${res.status}`);
    return res.json();
  }

  async transcribe({ audio, target }: { audio: Buffer; target: Target }): Promise<string> {
    const json = (await this.recognize(audio, target, 'simple')) as { RecognitionStatus?: string; DisplayText?: string };
    return json.RecognitionStatus === 'Success' ? (json.DisplayText ?? '') : '';
  }

  async assess({ audio, text, target }: AssessInput): Promise<Score> {
    const config = {
      ReferenceText: text,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true,
    };
    const json = await this.recognize(audio, target, 'detailed', {
      'Pronunciation-Assessment': Buffer.from(JSON.stringify(config)).toString('base64'),
    });
    return parseAzureResult(json as Parameters<typeof parseAzureResult>[0]);
  }
}

type AzureScores = {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ErrorType?: string;
};
type AzureWord = AzureScores & { Word: string; PronunciationAssessment?: AzureScores };
type AzureBest = AzureScores & { Lexical?: string; Display?: string; PronunciationAssessment?: AzureScores; Words?: AzureWord[] };

const round = (n: number | undefined) => Math.round(n ?? 0);

/** Scores sit directly on the result in older API versions and under PronunciationAssessment in newer ones. */
export function parseAzureResult(json: { RecognitionStatus?: string; NBest?: AzureBest[] }): Score {
  const best = json.NBest?.[0];
  if (json.RecognitionStatus !== 'Success' || !best) {
    return { status: 'no-speech', overall: 0, accuracy: 0, fluency: 0, completeness: 0, recognized: '', words: [] };
  }
  const s = { ...best, ...best.PronunciationAssessment };
  return {
    status: 'ok',
    overall: round(s.PronScore ?? s.AccuracyScore),
    accuracy: round(s.AccuracyScore),
    fluency: round(s.FluencyScore),
    completeness: round(s.CompletenessScore),
    recognized: best.Display ?? best.Lexical ?? '',
    words: (best.Words ?? []).map((w) => {
      const ws = { ...w, ...w.PronunciationAssessment };
      return {
        word: w.Word,
        accuracy: round(ws.AccuracyScore),
        ...(ws.ErrorType && ws.ErrorType !== 'None' ? { error: ws.ErrorType } : {}),
      };
    }),
  };
}
