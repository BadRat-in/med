import { useMantineColorScheme } from '@mantine/core'
import { useEffect, useState } from 'react'
import { loadConfig, saveConfig } from '../lib/medStorage'

export function useConfig() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const [live, setLive] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const cfg = await loadConfig()
      if (cfg.colorScheme === 'dark' || cfg.colorScheme === 'light') {
        setColorScheme(cfg.colorScheme)
      }
      if (typeof cfg.live === 'boolean') setLive(cfg.live)
      setReady(true)
    })()
  }, [setColorScheme])

  useEffect(() => {
    if (!ready) return
    saveConfig({ colorScheme, live })
  }, [colorScheme, live, ready])

  const toggleTheme = () => setColorScheme(isDark ? 'light' : 'dark')
  const toggleLive = () => setLive((v) => !v)

  return {
    colorScheme,
    setColorScheme,
    isDark,
    live,
    setLive,
    toggleTheme,
    toggleLive,
    ready,
  }
}
