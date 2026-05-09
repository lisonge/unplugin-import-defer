import unplugin from '.'

export default (): any => ({
  name: 'unplugin-import-defer',
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unplugin.vite())
    },
  },
})
