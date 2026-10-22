import { audioKey, type AudioVoice, type CourseBundle, type Item } from '@linguasea/contract';
import { spoken } from '@linguasea/core';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { apiEnabled, audioUrl } from '@/lib/api';
import { say, stopSpeech } from '@/lib/speech';

/**
 * What the learner hears. Generated clips (content bundle `audio`, served by the server at /audio/)
 * play when there is one for the text and a server is configured; anything else, or a clip that
 * fails to load, is read by the device's TTS voice in the course's locale.
 */

/** "Listen slowly" on a clip: playback rate with pitch kept. */
const SLOW_RATE = 0.7;
/** Players kept ready (one per clip); the least recently used is released beyond this. */
const MAX_PLAYERS = 24;
/** A clip that has not loaded by then (bad connection) gives way to TTS for this play. */
const LOAD_TIMEOUT_MS = 5000;
/** A clip that failed to load is not tried again for this long (TTS meanwhile), e.g. while offline. */
const RETRY_BROKEN_MS = 60_000;

type Request = { url: string; text: string; locale: string; slow: boolean };

const players = new Map<string, AudioPlayer>();
/** Clips that failed to load → when; they go straight to TTS for a while. */
const broken = new Map<string, number>();
let pending: Request | undefined;
let playing: AudioPlayer | undefined;
let loadTimer: ReturnType<typeof setTimeout> | undefined;
let modeReady = false;

/** URL of the generated clip of `text` spoken by `voice` ("item" or a dialogue speaker), if any. */
export function clipFor(course: CourseBundle, voice: AudioVoice, text: string): string | undefined {
  if (!apiEnabled || !course.audio) return undefined;
  const path = course.audio[audioKey(voice, text)];
  return path ? audioUrl(path) : undefined;
}

/** Items are keyed by what is spoken (`say ?? text`), as tools/src/audio generates them. */
function itemClip(course: CourseBundle, item: Pick<Item, 'text' | 'say'>): string | undefined {
  return clipFor(course, 'item', spoken(item));
}

/** A word / phrase / letter: its clip, else TTS of `say ?? text`. */
export function playItem(course: CourseBundle, item: Pick<Item, 'text' | 'say'>, slow = false) {
  play(itemClip(course, item), spoken(item), course.course.voice, slow);
}

/** A dialogue line in its speaker's voice. */
export function playLine(course: CourseBundle, line: { speaker: string; text: string }, slow = false) {
  play(clipFor(course, line.speaker, line.text), line.text, course.course.voice, slow);
}

/** A reader sentence: generated in the item voice (tools/src/audio), else TTS. */
export function playSentence(course: CourseBundle, text: string, slow = false) {
  play(clipFor(course, 'item', text), text, course.course.voice, slow);
}

/** Starts loading a lesson's clips so they play without delay. */
export function preloadClips(course: CourseBundle, items: Pick<Item, 'text' | 'say'>[], lines: { speaker: string; text: string }[] = []) {
  const urls = [...items.map((i) => itemClip(course, i)), ...lines.map((l) => clipFor(course, l.speaker, l.text))];
  for (const url of urls) if (url && !isBroken(url)) playerFor(url);
}

export function stopAudio() {
  pending = undefined;
  clearTimeout(loadTimer);
  try {
    playing?.pause();
  } catch {}
  playing = undefined;
  stopSpeech();
}

/** iOS needs the record-capable session only while recording; playback goes back to the speaker after. */
export async function setRecordingMode(recording: boolean) {
  if (Platform.OS === 'web') return;
  modeReady = true;
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: recording }).catch(() => {});
}

function play(url: string | undefined, text: string, locale: string, slow: boolean) {
  stopAudio();
  const player = url && !isBroken(url) ? playerFor(url) : undefined;
  if (!url || !player || !setRate(player, slow)) {
    say(text, locale, slow);
    return;
  }
  if (!modeReady) void setRecordingMode(false);
  const request: Request = { url, text, locale, slow };
  pending = request;
  playing = player;
  const start = () => {
    if (pending === request) player.play();
  };
  if (player.currentTime > 0) player.seekTo(0).then(start, start);
  else start();
  loadTimer = setTimeout(() => {
    if (pending === request && !player.isLoaded) fallBack(request);
  }, LOAD_TIMEOUT_MS);
}

/** Lower rate for "slow"; false when the platform cannot change it (then slow TTS is used instead). */
function setRate(player: AudioPlayer, slow: boolean): boolean {
  try {
    player.setPlaybackRate(slow ? SLOW_RATE : 1, 'high');
    return true;
  } catch {
    return !slow;
  }
}

function fallBack(request: Request) {
  stopAudio();
  say(request.text, request.locale, request.slow);
}

function playerFor(url: string): AudioPlayer | undefined {
  const cached = players.get(url);
  if (cached) {
    // Most recently used goes last.
    players.delete(url);
    players.set(url, cached);
    return cached;
  }
  let player: AudioPlayer;
  try {
    player = createAudioPlayer(url, { updateInterval: 250 });
  } catch {
    return undefined;
  }
  player.addListener('playbackStatusUpdate', (status) => {
    if (!status.error) return;
    // Not loaded = the clip itself is unusable (missing, offline); otherwise only this play was refused.
    if (!status.isLoaded) {
      broken.set(url, Date.now());
      release(url, player);
    }
    if (pending?.url === url) fallBack(pending);
  });
  players.set(url, player);
  for (const [oldUrl, old] of players) {
    if (players.size <= MAX_PLAYERS) break;
    if (old !== playing) release(oldUrl, old);
  }
  return player;
}

function isBroken(url: string): boolean {
  const at = broken.get(url);
  return at !== undefined && Date.now() - at < RETRY_BROKEN_MS;
}

function release(url: string, player: AudioPlayer) {
  if (players.get(url) === player) players.delete(url);
  if (player === playing) playing = undefined;
  // Released outside the player's own event callback.
  setTimeout(() => {
    try {
      player.remove();
    } catch {}
  }, 0);
}
