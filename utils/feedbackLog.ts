'use server';
export default async function sendTgMessage(message: string) {
   const TOKEN = process.env.TG_BOT_TOKEN;
   const CHAT_ID = process.env.TG_CHAT_ID;
   await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id={CHAT_ID}&text=${message}`)
      .then((res) => res.json())
      .catch(console.error);
}
