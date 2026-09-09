import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const LOCALES = ['en', 'ur'] as const
export type Locale = (typeof LOCALES)[number]

export const messages = {
  en: {
    dir: 'ltr',
    appTitle: 'Celebrate — 3D Birthday Wishes',
    tagline: 'A magical 3D birthday experience, created just for one special person.',
    namePlaceholder: 'Enter the birthday name...',
    nameHint: 'Yes — your name is the password. Typing is magic.',
    startCelebration: 'Start the Celebration',
    tip: 'Share the link so friends can upload memories & wishes.',
    createWishLink: 'Create a wish link for someone else',
    blowHint: 'Tap the cake to blow out the candles!',
    letterPrompt: 'A special message is waiting... tap to open',
    letterContinue: 'Continue to your gifts →',
    giftTitle: 'Three gifts await you',
    guestbook: 'Sign the guestbook',
  },
  ur: {
    dir: 'rtl',
    appTitle: 'جشن — 3D سالگرہ کی مبارکباد',
    tagline: 'ایک جادوئی 3D سالگرہ کا تجربہ، صرف ایک خاص شخص کے لیے۔',
    namePlaceholder: 'سالگرہ کا نام درج کریں...',
    nameHint: 'ہاں — آپ کا نام ہی پاس ورڈ ہے۔ ٹائپ کرنا جادو ہے۔',
    startCelebration: 'جشن شروع کریں',
    tip: 'لنک شیئر کریں تاکہ دوست یادوں اور دعاؤں کے ساتھ شامل ہو سکیں۔',
    createWishLink: 'کسی اور کے لیے دعائیہ لنک بنائیں',
    blowHint: 'موم بتیاں بجھانے کے لیے کیک پر تھپتھپائیں!',
    letterPrompt: 'ایک خاص پیغام آپ کا انتظار کر رہا ہے... کھولنے کے لیے تھپتھپائیں',
    letterContinue: 'اپنے تحائف کی طرف →',
    giftTitle: 'آپ کے لیے تین تحفے',
    guestbook: 'مہمان کتاب پر دستخط کریں',
  },
} as const

export type MessageKey = keyof (typeof messages)['en']

interface I18nContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  t: (key: MessageKey) => string
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  dir: 'ltr',
  t: (key) => messages.en[key],
  setLocale: () => {},
})

export function detectLocale(): Locale {
  const nav = navigator.language?.toLowerCase() ?? 'en'
  if (nav.startsWith('ur')) return 'ur'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = messages[locale].dir
  }, [locale])

  return (
    <I18nContext.Provider
      value={{
        locale,
        dir: messages[locale].dir,
        t: (key) => messages[locale][key],
        setLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}