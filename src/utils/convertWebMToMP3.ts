// @ts-ignore - lamejs doesn't have proper types
import lamejs from 'lamejs';

/**
 * Converts a WebM audio blob to MP3 format
 * @param webmBlob - The WebM audio blob from MediaRecorder
 * @returns Promise<File> - MP3 file ready for upload
 */
export async function convertWebMToMP3(webmBlob: Blob): Promise<File> {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Convert blob to array buffer
    const arrayBuffer = await webmBlob.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio samples (convert to mono if stereo)
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0); // Get first channel
    
    // Convert float samples to 16-bit PCM
    const pcmSamples = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcmSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Initialize MP3 encoder (using fixed GitHub version)
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // mono, sample rate, bitrate
    
    // Encode in chunks
    const mp3Data: Uint8Array[] = [];
    const sampleBlockSize = 1152; // Standard MP3 frame size
    
    for (let i = 0; i < pcmSamples.length; i += sampleBlockSize) {
      const sampleChunk = pcmSamples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }
    
    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
    
    // Create blob from MP3 data
    const mp3Blob = new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
    
    // Create file
    const mp3File = new File([mp3Blob], 'recording.mp3', { type: 'audio/mp3' });
    
    console.log('WebM to MP3 conversion complete:', {
      originalSize: webmBlob.size,
      mp3Size: mp3File.size,
      sampleRate,
      channels
    });
    
    return mp3File;
  } catch (error) {
    console.error('Error converting WebM to MP3:', error);
    throw new Error('Failed to convert audio to MP3 format');
  }
}

