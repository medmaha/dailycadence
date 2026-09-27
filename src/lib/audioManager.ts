/**
 * Audio manager for ringtone handling
 * Handles audio upload, compression, and storage for custom ringtones
 */

export interface Ringtone {
  id: string;
  name: string;
  dataUrl: string;
  isDefault: boolean;
  createdAt: number;
}

const RINGTONES_KEY = 'cadence.ringtones.v1';
const SOUND_ENABLED_KEY = 'cadence.sound_enabled.v1';
const DEFAULT_RINGTONE: Ringtone = {
  id: 'default',
  name: 'Default',
  dataUrl: '/reminder.mp3',
  isDefault: true,
  createdAt: 0,
};

const MAX_CUSTOM_RINGTONES = 3;
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_COMPRESSED_SIZE = 100 * 1024; // 100KB after compression


export function initRingtoneSettings() {
  try {
    window._RINGTONES_KEY = RINGTONES_KEY
    window._SOUND_ENABLED_KEY = SOUND_ENABLED_KEY
    window._DEFAULT_RINGTONE = DEFAULT_RINGTONE
  } catch (error) {
    console.error(error)
  }
}

export async function requestAudioPermission(): Promise<boolean> {
  return new Promise<boolean>(r => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(function (stream) {
        r(true)
      })
      .catch(function (err) {
        console.error("Audio permission denied or error occurred: ", err);
        r(false)
      });
  })
}


/**
 * Get all saved ringtones from localStorage
 */
export function getRingtones(): Ringtone[] {
  if (typeof window === 'undefined') return [DEFAULT_RINGTONE];

  try {
    const stored = localStorage.getItem(RINGTONES_KEY);
    const customRingtones: Ringtone[] = stored ? JSON.parse(stored) : [];
    requestAudioPermission().catch(console.error)
    return [DEFAULT_RINGTONE, ...customRingtones];
  } catch {
    return [DEFAULT_RINGTONE];
  }
}

/**
 * Save custom ringtones to localStorage
 */
function saveCustomRingtones(ringtones: Ringtone[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Filter out default ringtone before saving
    const customOnly = ringtones.filter(r => !r.isDefault);
    localStorage.setItem(RINGTONES_KEY, JSON.stringify(customOnly));
  } catch (error) {
    console.error('Failed to save ringtones:', error);
  }
}

/**
 * Delete a custom ringtone
 */
export function deleteRingtone(id: string): void {
  const ringtones = getRingtones();
  const filtered = ringtones.filter(r => r.id !== id);
  saveCustomRingtones(filtered);
}

/**
 * Check if sound is enabled
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Set sound enabled state
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error('Failed to save sound setting:', error);
  }
}

/**
 * Compress audio file using Web Audio API
 * This reduces the audio quality and sample rate to reduce file size
 */
async function compressAudio(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Create offline context for resampling
        const offlineContext = new OfflineAudioContext(
          1, // mono
          audioBuffer.length,
          16000 // lower sample rate for compression
        );

        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();

        // Render compressed audio
        const renderedBuffer = await offlineContext.startRendering();

        // Convert to WAV format
        const wavBlob = audioBufferToWav(renderedBuffer);

        // Check if compressed size is still too large
        if (wavBlob.size > MAX_COMPRESSED_SIZE) {
          // If still too large, we further compression by reducing duration
          const duration = Math.min(renderedBuffer.duration, 5); // max 5 seconds
          const samples = Math.floor(duration * 16000);
          const truncatedBuffer = offlineContext.createBuffer(1, samples, 16000);
          const channelData = renderedBuffer.getChannelData(0);
          truncatedBuffer.copyToChannel(channelData.slice(0, samples), 0);

          const truncatedWav = audioBufferToWav(truncatedBuffer);
          resolve(truncatedWav);
        } else {
          resolve(wavBlob);
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;

  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]!));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert file to data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload and process custom ringtone
 */
export async function uploadRingtone(file: File): Promise<Ringtone> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024}KB`);
  }

  // Validate file type
  if (!file.type.startsWith('audio/')) {
    throw new Error('File must be an audio file');
  }

  // Get current ringtones
  const ringtones = getRingtones();
  const customCount = ringtones.filter(r => !r.isDefault).length;

  if (customCount >= MAX_CUSTOM_RINGTONES) {
    throw new Error(`Maximum ${MAX_CUSTOM_RINGTONES} custom ringtones allowed`);
  }

  try {
    // Compress audio
    const compressedBlob = await compressAudio(file);

    // Convert to data URL
    const dataUrl = await fileToDataUrl(
      new File([compressedBlob], file.name, { type: 'audio/wav' })
    );

    // Create ringtone object
    const newRingtone: Ringtone = {
      id: crypto.randomUUID().replace("-", "").substring(0, 10),
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      dataUrl,
      isDefault: false,
      createdAt: Date.now(),
    };

    // Save to localStorage
    saveCustomRingtones([...ringtones.filter(r => !r.isDefault), newRingtone]);

    return newRingtone;
  } catch (error) {
    console.error('Failed to process ringtone:', error);
    throw new Error('Failed to process audio file');
  }
}

export function getRingtoneById(id?: string) {
  if (!id) return null
  return getRingtones().find(r => r.id === id) || null
}

/**
 * Play a ringtone for testing
 */
export async function playRingtone(ringtone_id?: string) {
  try {
    if (!isSoundEnabled()) return;
    const ringtone = (getRingtoneById(ringtone_id)) || DEFAULT_RINGTONE
    const audio = new Audio(ringtone.dataUrl);
    await audio.play()
  } catch (error) {
    console.error(error)
  }
}