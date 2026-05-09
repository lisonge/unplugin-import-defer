import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { transform } from './core/transform'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => ({
  name: 'unplugin-import-defer',
  transform: {
    filter: {
      id: {
        exclude: options.exclude ?? /[\\\/]node_modules[\\\/]/,
      },
    },
    handler(code, id) {
      return transform(code, id)
    },
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
