import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = 'BLaN0mfZRQSWxkO9B4tQH12kSA_GY53iVLSHU7hoLB4wQY6AzqNU4JRWkkaibxIeAPZp7yBDNBoEEyH71ApFK1M'
const VAPID_PRIVATE_KEY = 'jX4aqXXOtUb6bNbKYpETHAyNUR_QfmIDiYn6OWMpyq8'
const VAPID_SUBJECT = 'mailto:info@vicinidistrada.it'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, content, type, priority, newsId } = await req.json()

    // Client Supabase con permessi service_role interni per leggere push_subscriptions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Recupera tutte le sottoscrizioni salvate nel database
    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')

    if (error) {
      console.error('Errore query push_subscriptions:', error)
      throw error
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('Nessun dispositivo registrato in push_subscriptions.')
      return new Response(
        JSON.stringify({ success: true, total: 0, sent: 0, message: 'Nessun dispositivo registrato trovato.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Invio notifica push a ${subscriptions.length} dispositivi registrati...`)

    let sentCount = 0
    let failedCount = 0

    // 2. Invia notifica Web Push crittografata a ciascun dispositivo (Google FCM / Apple APNs)
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      const lang = sub.lang || 'it'
      let titleText = 'Vicini di Strada Como'
      let bodyText = 'Nuovo avviso pubblicato dai servizi'

      if (title) {
        titleText = typeof title === 'object' ? (title[lang] || title.it || title.en || 'Avviso') : title
      }
      if (content) {
        bodyText = typeof content === 'object' ? (content[lang] || content.it || content.en || '') : content
      }

      const pushPayload = JSON.stringify({
        title: titleText,
        body: bodyText,
        url: '/portaleaccoglienzacomo/?tab=news',
        newsId: newsId || null
      })

      try {
        await webpush.sendNotification(pushSubscription, pushPayload)
        sentCount++
      } catch (err: any) {
        failedCount++
        console.warn(`Invio fallito per endpoint ${sub.endpoint}:`, err.statusCode || err.message)
        // Se 410 o 404, il token è scaduto o l'app è stata rimossa dal telefono: elimina dal DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    })

    await Promise.allSettled(sendPromises)

    return new Response(
      JSON.stringify({
        success: true,
        total: subscriptions.length,
        sent: sentCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('Errore Edge Function:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
