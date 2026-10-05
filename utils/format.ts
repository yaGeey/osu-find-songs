export function formatBytes(bytes: number, decimals = 1, si = false) {
   if (bytes === 0) return '0 Bytes'
   const k = 1024
   const dm = decimals < 0 ? 0 : decimals
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
   const i = Math.floor(Math.log(bytes) / Math.log(k))
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + (si ? sizes[i] : '')
}

export function roundDownAndSaveDigits(num: number) {
   const intNum = Math.floor(num)
   if (intNum < 10) return 0
   if (intNum < 100) return intNum / 2 - ((intNum / 2) % 10)
   if (intNum < 1000) return intNum - (intNum % 100)
   return intNum - (intNum % 1000)
}

export function getWindowsFriendlyLocalTime(date: Date = new Date()) {
   const locale = navigator.language || 'en-US'
   const dateTime = date.toLocaleString(locale)
   return dateTime.replace(/[\/\\:,]/g, '-').replace(/\s+/g, '_')
}

export function formatLocalNumber(num: number, locale: string = navigator.language || 'en-US') {
   return num.toLocaleString(locale)
}
