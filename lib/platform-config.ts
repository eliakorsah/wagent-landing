import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Read a single config value — falls back to env var or default */
export async function getConfig(key: string, fallback = ''): Promise<string> {
  const { data } = await adminClient
    .from('platform_config')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? fallback
}

/** Read all config rows as a key/value object */
export async function getAllConfig(): Promise<Record<string, string>> {
  const { data } = await adminClient.from('platform_config').select('key, value')
  const out: Record<string, string> = {}
  data?.forEach(row => { out[row.key] = row.value ?? '' })
  return out
}

/** Upsert a config value */
export async function setConfig(key: string, value: string): Promise<void> {
  await adminClient.from('platform_config').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}
