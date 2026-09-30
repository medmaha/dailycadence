import { readEnv, readEnvAndParseNumber } from "./helpers";
import { capitalizeText, randomUUID } from "./utils";
import { useRingtoneStore } from "@/stores/ringtoneStore";

export interface Ringtone {
    id: string;
    name: string;
    dataUrl: string;
    isDefault: boolean;
    createdAt: number;
}

const DEFAULT_RINGTONE: Ringtone = {
    id: "default",
    createdAt: 0,
    name: "Default",
    isDefault: true,
    dataUrl: readEnv("VITE_RINGTONE_FILE", "/reminder.mp3"),
};

const MegaBytes = 1024;
const MAX_RINGTONES = readEnvAndParseNumber("VITE_RINGTONE_MAX_ITEMS", 3);
const MAX_FILE_SIZE = readEnvAndParseNumber("VITE_RINGTONE_MAX_FILE_SIZE_KB", 500) * MegaBytes;
const MAX_COMPRESSED_SIZE =
    readEnvAndParseNumber("VITE_RINGTONE_MAX_COMPRESS_SIZE_KB", 100) * MegaBytes;

export async function requestAutoSpeakerPermission(): Promise<boolean> {
    return new Promise<boolean>((r) => {
        // TODO
        r(true);
    });
}

/**
 * Get all saved ringtones from localStorage
 */
export function getRingtones(): Ringtone[] {
    const ringtones = useRingtoneStore.getState().ringtones;
    if (ringtones.length === 0) {
        return [DEFAULT_RINGTONE];
    }
    return ringtones;
}

/**
 * Delete a custom ringtone
 */
export function deleteRingtone(id: string): void {
    const ringtones = getRingtones();
    const filtered = ringtones.filter((r) => r.id !== id);
    saveRingtones(filtered);
}

/**
 * Save custom ringtones to localStorage
 */
function saveRingtones(ringtones: Ringtone[]): void {
    try {
        useRingtoneStore.getState().setRingtones(ringtones);
    } catch (error) {
        console.error("Failed to save ringtones:", error);
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
                const audioContext = new (
                    window.AudioContext || (window as any).webkitAudioContext
                )();

                // Decode audio data
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Create offline context for resampling
                const offlineContext = new OfflineAudioContext(
                    1, // mono
                    audioBuffer.length,
                    16000, // lower sample rate for compression
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
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;

    for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]!));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
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
    try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size must be less than ${MAX_FILE_SIZE / MegaBytes}KB`);
        }

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            throw new Error("File must be an audio file");
        }
    } catch (error: any) {
        alert(error.message);
        throw error;
    }

    // Get current ringtones
    const ringtones = getRingtones();
    const customCount = ringtones.filter((r) => !r.isDefault).length;

    if (customCount >= MAX_RINGTONES) {
        const msg = `Maximum ${MAX_RINGTONES} custom ringtones allowed`;
        alert(msg);
        throw new Error(msg);
    }

    try {
        // Compress audio
        const compressedBlob = await compressAudio(file);

        // Convert to data URL
        const dataUrl = await fileToDataUrl(
            new File([compressedBlob], file.name, { type: "audio/wav" }),
        );

        // Create ringtone object
        const filename = file.name.replace(/\.[^/.]+$/, "");
        const newRingtone: Ringtone = {
            id: randomUUID(),
            name: capitalizeText(filename), // Remove extension
            dataUrl,
            isDefault: false,
            createdAt: Date.now(),
        };

        saveRingtones([...ringtones, newRingtone]);

        return newRingtone;
    } catch (error) {
        throw new Error("Failed to process audio file");
    }
}

/**
 * Play a ringtone for testing
 */
export async function playRingtone(ringtone?: Ringtone) {
    try {
        if (!ringtone || !useRingtoneStore.getState().isSoundEnabled()) return;
        const audio = new Audio(ringtone.dataUrl);
        await audio.play();
    } catch (error) {
        console.error(error);
        if (ringtone && !ringtone.isDefault) {
            alert("Failed to play your custom ringtone");
        }
    }
}
