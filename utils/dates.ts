export function getWindowsFriendlyLocalTime(date: Date = new Date()) {
   const locale = navigator.language || 'en-US'
   let dateTime = date.toLocaleString(locale)
   return dateTime.replace(/[\/\\:,]/g, '-').replace(/\s+/g, '_')
}
