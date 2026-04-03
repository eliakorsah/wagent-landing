import axios from 'axios'

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

// Default voice IDs (ElevenLabs)
export const VOICE_OPTIONS = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Professional Male)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Professional Female)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Deep Male)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Energetic Female)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Friendly Female)' },
]

export async function textToSpeech(
  text: string,
  voiceId: string = 'pNInz6obpgDQGcFmaJgB',
  apiKey?: string
): Promise<Buffer> {
  const key = apiKey || process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ElevenLabs API key not configured')

  const response = await axios.post(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`,
    {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    },
    {
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': key,
      },
      responseType: 'arraybuffer',
    }
  )

  return Buffer.from(response.data)
}
