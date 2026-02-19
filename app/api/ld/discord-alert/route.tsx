import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: Request) {
   try {
      const data = await req.json()
      await axios.post(
         process.env.DISCORD_WEBHOOK_URL!,
         {
            content: null,
            embeds: [
               {
                  title: `${data.AlertName} - ${data.ErrorCount} occurrences`,
                  description: `\`\`\`${data.ErrorTitle}\`\`\`\n[${data.UserIdentifier}](https://app.launchdarkly.com/projects/default/${data.SessionURL})`,
                  url: `https://app.launchdarkly.com/projects/default/${data.ErrorURL}`,
                  color: 9838099,
               },
            ],
            attachments: [],
         },
         {
            headers: { 'Content-Type': 'application/json' },
         },
      )
   } catch (error) {}
   return NextResponse.json('OK')
}
