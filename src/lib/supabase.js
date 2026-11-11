import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://roqfxmdnjgwoezkwaqmu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_v7QcdhlmY2T8yrxXgg8gWA_MIdOv1J4'

export const supabase = createClient(supabaseUrl, supabaseKey)
export const IMAGE_BUCKET = 'service-images'

// Canale Realtime condiviso per trasmissione istantanea avvisi
export const alertsChannel = supabase.channel('vds-news-alerts', {
  config: {
    broadcast: {
      self: true,
      ack: true
    }
  }
})

alertsChannel.subscribe((status) => {
  console.log('[Realtime] vds-news-alerts status:', status)
})
