import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const caricoDati = await req.json()
  const tabella = caricoDati.table
  const rigaNuova = caricoDati.record
  const rigaVecchia = caricoDati.old_record
  const tipoEvento = caricoDati.type

  // Ferma il programma se non ci sono vere modifiche ai testi in italiano
  if (tipoEvento === 'UPDATE' && rigaVecchia) {
    if (tabella === 'services' && rigaNuova.name?.it === rigaVecchia.name?.it && rigaNuova.description?.it === rigaVecchia.description?.it) {
        return new Response("Nessuna modifica ai testi del servizio", { status: 200 })
    }
    if (tabella === 'news' && rigaNuova.title?.it === rigaVecchia.title?.it && rigaNuova.content?.it === rigaVecchia.content?.it) {
        return new Response("Nessuna modifica ai testi della notizia", { status: 200 })
    }
  }

  const chiaveGoogle = Deno.env.get('CHIAVE_GOOGLE')
  const collegamentoBancaDati = Deno.env.get('SUPABASE_URL')!
  const chiavePrivataBancaDati = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clienteBancaDati = createClient(collegamentoBancaDati, chiavePrivataBancaDati)

  // Lista delle lingue in cui vuoi tradurre
  const lingueTarget = ["en", "fr", "es", "ar", "ur", "hi", "sw", "tr"];

  // Funzione che fa il lavoro sporco con Google
  async function traduciTesto(testo: string) {
      if (!testo) return {};
      let traduzioni = { it: testo };
      
      for (const lingua of lingueTarget) {
          const risposta = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${chiaveGoogle}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ q: testo, source: "it", target: lingua, format: "text" })
          });
          const dati = await risposta.json();
          if (dati.data && dati.data.translations) {
              traduzioni[lingua] = dati.data.translations[0].translatedText;
          }
      }
      return traduzioni;
  }

  // Seleziona cosa tradurre in base alla tabella
  try {
      if (tabella === 'services') {
          const nameTradotto = await traduciTesto(rigaNuova.name?.it || "");
          const descTradotta = await traduciTesto(rigaNuova.description?.it || "");
          const orariTradotti = await traduciTesto(rigaNuova.hours?.it || "");

          await clienteBancaDati.from('services').update({ 
              name: nameTradotto, 
              description: descTradotta,
              hours: orariTradotti
          }).eq('id', rigaNuova.id);

      } else if (tabella === 'news') {
          const titleTradotto = await traduciTesto(rigaNuova.title?.it || "");
          const contentTradotto = await traduciTesto(rigaNuova.content?.it || "");

          await clienteBancaDati.from('news').update({ 
              title: titleTradotto, 
              content: contentTradotto 
          }).eq('id', rigaNuova.id);
      }
      
      return new Response("Traduzioni salvate", { status: 200 });
  } catch (errore) {
      return new Response("Errore di traduzione", { status: 500 });
  }
})