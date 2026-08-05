'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { CONTENT_LOCALES } from 'shared/i18n/contentLocales';

const LOCALE_FLAGS = {
  tr: '/assets/images/lang/turkey.png',
  ru: '/assets/images/lang/russia.png',
  en: '/assets/images/lang/united-kingdom.png'
};

/**
 * İçerik dili sekmeleri (TR / EN / RU).
 * @param {string} value — aktif locale
 * @param {(locale: string) => void} onChange
 * @param {(locale: string) => React.ReactNode} children — aktif locale paneli
 */
export default function TranslationLocaleTabs({ value, onChange, children }) {
  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        {CONTENT_LOCALES.map((locale) => (
          <Tab
            key={locale.code}
            value={locale.code}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src={LOCALE_FLAGS[locale.code]}
                  alt={locale.label}
                  sx={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>{locale.required ? `${locale.label} *` : locale.label}</span>
              </Box>
            }
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
        ))}
      </Tabs>
      <Box sx={{ pt: 2 }}>{typeof children === 'function' ? children(value) : children}</Box>
    </Box>
  );
}
