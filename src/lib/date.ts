import { format, type Locale } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

const toJST = (dt: Date | string) =>
  toZonedTime(dt instanceof Date ? dt : new Date(dt), 'Asia/Tokyo')

const fmt = (dt: Date | string, formatStr: string, locale?: Locale) =>
  format(toJST(dt), formatStr, { locale })

export const formatToYMD = (dt: Date | string) => fmt(dt, 'yyyy-MM-dd')

export const formatToJa = (dt: Date | string) => fmt(dt, 'yyyy年M月d日', ja)

export const formatToEn = (dt: Date | string) => fmt(dt, 'MMMM d, yyyy', enUS)

export const formatDate = (dt: Date | string, lang: 'ja' | 'en' = 'ja') =>
  lang === 'en' ? formatToEn(dt) : formatToJa(dt)

export const formatISO8601 = (dt: Date | string) =>
  fmt(dt, "yyyy-MM-dd'T'HH:mm:ssXX")
