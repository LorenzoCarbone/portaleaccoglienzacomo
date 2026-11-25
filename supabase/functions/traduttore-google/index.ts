import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const caricoDati = await req.json()
    const tabella = caricoDati.table
    const rigaNuova = caricoDati.record
    const rigaVecchia = caricoDati.old_record
    const tipoEvento = caricoDati.type

    if (!rigaNuova || !rigaNuova.id) {
      return new Response("Nessun record valido", { status: 200 })
    }

    // Ferma il programma se non ci sono vere modifiche ai testi in italiano
    if (tipoEvento === 'UPDATE' && rigaVecchia) {
      if (
        tabella === 'services' &&
        rigaNuova.name?.it === rigaVecchia.name?.it &&
        rigaNuova.description?.it === rigaVecchia.description?.it
      ) {
        return new Response("Nessuna modifica ai testi del servizio", { status: 200 })
      }
      if (
        tabella === 'news' &&
        rigaNuova.title?.it === rigaVecchia.title?.it &&
        rigaNuova.content?.it === rigaVecchia.content?.it
      ) {
        return new Response("Nessuna modifica ai testi della notizia", { status: 200 })
      }
    }

    const chiaveGoogle = Deno.env.get('CHIAVE_GOOGLE')
    const collegamentoBancaDati = Deno.env.get('SUPABASE_URL')!
    const chiavePrivataBancaDati = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const clienteBancaDati = createClient(collegamentoBancaDati, chiavePrivataBancaDati)

    const lingueTarget = ["en", "fr", "es", "ar", "ur", "hi", "sw", "tr"]

    // Completa SOLO le lingue mancanti preservando sempre tutte quelle già presenti
    async function completaTraduzioni(campoEsistente: Record<string, string> | null | undefined) {
      const base = (campoEsistente && typeof campoEsistente === 'object' && !Array.isArray(campoEsistente))
        ? { ...campoEsistente }
        : {}
      const testoIt = (base.it || "").trim()
      if (!testoIt) return { obj: base, changed: false }

      let changed = false
      if (!chiaveGoogle) {
        return { obj: base, changed: false }
      }

      for (const lingua of lingueTarget) {
        // Se la traduzione per questa lingua è già stata fornita, NON sovrascriverla e NON cancellarla mai
        if (base[lingua] && String(base[lingua]).trim() !== "") {
          continue
        }
        try {
          const risposta = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${chiaveGoogle}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: testoIt, source: "it", target: lingua, format: "text" })
          })
          const dati = await risposta.json()
          if (dati?.data?.translations?.[0]?.translatedText) {
            base[lingua] = dati.data.translations[0].translatedText
            changed = true
          }
        } catch (_e) {
          // Ignora errori di rete preservando i dati esistenti
        }
      }
      return { obj: base, changed }
    }

    if (tabella === 'services') {
      const nameRes = await completaTraduzioni(rigaNuova.name)
      const descRes = await completaTraduzioni(rigaNuova.description)

      const updatePayload: Record<string, unknown> = {}
      if (nameRes.changed) updatePayload.name = nameRes.obj
      if (descRes.changed) updatePayload.description = descRes.obj

      // NOTA CRITICA: NON sovrascrivere MAI `hours` con `{}`!
      // Se `hours.access.note` ha lingue mancanti, completa solo `hours.access.note` mantenendo intatti `mode` e `schedule`.
      if (rigaNuova.hours && typeof rigaNuova.hours === 'object' && !Array.isArray(rigaNuova.hours) && rigaNuova.hours.access?.note) {
        const noteRes = await completaTraduzioni(rigaNuova.hours.access.note)
        if (noteRes.changed) {
          updatePayload.hours = {
            ...rigaNuova.hours,
            access: {
              ...rigaNuova.hours.access,
              note: noteRes.obj
            }
          }
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        await clienteBancaDati.from('services').update(updatePayload).eq('id', rigaNuova.id)
      }
    } else if (tabella === 'news') {
      const titleRes = await completaTraduzioni(rigaNuova.title)
      const contentRes = await completaTraduzioni(rigaNuova.content)

      const updatePayload: Record<string, unknown> = {}
      if (titleRes.changed) updatePayload.title = titleRes.obj
      if (contentRes.changed) updatePayload.content = contentRes.obj

      if (Object.keys(updatePayload).length > 0) {
        await clienteBancaDati.from('news').update(updatePayload).eq('id', rigaNuova.id)
      }
    }

    return new Response("Traduzioni verificate e preservate", { status: 200 })
  } catch (_errore) {
    return new Response("Errore di traduzione", { status: 200 })
  }
})
