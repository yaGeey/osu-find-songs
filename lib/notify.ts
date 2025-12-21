'use server'

export async function sendTelegramError(text: string) {
   const token = process.env.TG_CHAT_TOKEN
   const chatId = process.env.TG_CHAT_ID
   if (!token || !chatId) return

   try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
         }),
      })
   } catch (e) {
      console.error('Failed to send TG notification', e)
   }
}
