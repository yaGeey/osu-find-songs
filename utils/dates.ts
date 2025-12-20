export function getWindowsFriendlyLocalTime(date: Date = new Date()) {
   const locale = navigator.language || 'en-US'
   const dateTime = date.toLocaleString(locale)
   return dateTime.replace(/[\/\\:,]/g, '-').replace(/\s+/g, '_')
}
