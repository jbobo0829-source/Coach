// Variable pitch & duration tone; ?hz=…&ms=… (hz 110–2000, ms 50–4000). Runs on Vercel Edge.
export const config = { runtime: 'edge' };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function renderToneWav(hz: number, ms: number, volume = 0.9, sampleRate = 44100): Uint8Array {
  const samples = Math.max(1, Math.round((ms / 1000) * sampleRate));
  const data = new Int16Array(samples);
  const twoPiF = 2 * Math.PI * hz;

  // Slightly longer envelope so it feels "chime-y"
  const attack = sampleRate * 0.02;  // ~20 ms
  const release = sampleRate * 0.03; // ~30 ms

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, i / attack) * Math.min(1, (samples - 1 - i) / release);
    const s = Math.sin(twoPiF * t) * volume * env;
    data[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 32767)));
  }

  // Build PCM 16-bit mono WAV
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1;
  const byteRate = sampleRate * blockAlign;
  const dataSize = data.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(off: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  }

  let off = 0;
  writeStr(off, 'RIFF'); off += 4;
  view.setUint32(off, 36 + dataSize, true); off += 4;
  writeStr(off, 'WAVE'); off += 4;
  writeStr(off, 'fmt '); off += 4;
  view.setUint32(off, 16, true); off += 4;        // Subchunk1Size (PCM)
  view.setUint16(off, 1, true); off += 2;         // AudioFormat (1 = PCM)
  view.setUint16(off, 1, true); off += 2;         // NumChannels (mono)
  view.setUint32(off, sampleRate, true); off += 4;// SampleRate
  view.setUint32(off, byteRate, true); off += 4;  // ByteRate
  view.setUint16(off, blockAlign, true); off += 2;// BlockAlign
  view.setUint16(off, 16, true); off += 2;        // BitsPerSample
  writeStr(off, 'data'); off += 4;
  view.setUint32(off, dataSize, true); off += 4;

  // PCM payload
  let di = 44;
  for (let i = 0; i < data.length; i++, di += 2) {
    view.setInt16(di, data[i], true);
  }

  return new Uint8Array(buffer);
}

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const hz = clamp(parseInt(url.searchParams.get('hz') || '784', 10), 110, 2000);
    const ms = clamp(parseInt(url.searchParams.get('ms') || '600', 10), 50, 4000);
    const wav = renderToneWav(hz, ms);
    return new Response(wav, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store'
      },
    });
  } catch (err) {
    return new Response('Error generating chime', { status: 500 });
  }
}
