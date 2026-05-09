export interface Options {
  /**
   * Patterns to exclude from transformation.
   * @default [/[\\\/]node_modules[\\\/]/]
   */
  exclude?: string | RegExp | (string | RegExp)[]
}
