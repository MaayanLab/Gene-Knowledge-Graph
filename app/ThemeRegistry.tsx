'use client';
import React from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { cfde_theme } from '@/themes/cfde';
import { enrichr_kg_theme } from '@/themes/enrichr-kg';
import { lncRNAlyzr } from '@/themes/lncRNAlyzr';
import { biomarker_kg_theme } from '@/themes/biomarker-kg';
const themes = {
    cfde_theme: cfde_theme,
    enrichr_kg_theme: enrichr_kg_theme,
    lncRNAlyzr: lncRNAlyzr,
    biomarker_kg_theme: biomarker_kg_theme,
}

// This implementation is from emotion-js
// https://github.com/emotion-js/emotion/issues/2928#issuecomment-1319747902
export default function ThemeRegistry(props:{options:any, children:any, theme: 'cfde_theme' | string}) {
    const { options, children, theme: t } = props;
    const theme = themes[t]
    const [{ cache, flush }] = React.useState(() => {
      const cache = createCache(options);
      cache.compat = true;
      const prevInsert = cache.insert;
      let inserted: string[] = [];
      cache.insert = (...args) => {
        const serialized = args[1];
        if (cache.inserted[serialized.name] === undefined) {
          inserted.push(serialized.name);
        }
        return prevInsert(...args);
      };
      const flush = () => {
        const prevInserted = inserted;
        inserted = [];
        return prevInserted;
      };
      return { cache, flush };
    });
  
    useServerInsertedHTML(() => {
      const names = flush();
      if (names.length === 0) {
        return null;
      }
      let styles = '';
      for (const name of names) {
        styles += cache.inserted[name];
      }
      return (
        <style
          key={cache.key}
          data-emotion={`${cache.key} ${names.join(' ')}`}
          dangerouslySetInnerHTML={{
            __html: styles,
          }}
        />
      );
    });
  
    return (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    );
  }