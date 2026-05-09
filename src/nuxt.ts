import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from '@nuxt/kit'
import vite from './vite'
import webpack from './webpack'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-unplugin-import-defer',
    configKey: 'unpluginImportDefer',
  },
  setup(_options, _nuxt) {
    addVitePlugin(() => vite())
    addWebpackPlugin(() => webpack())
  },
})
