# unplugin-import-defer

[中文文档](./README.zh.md)

Downgrade [import defer](https://github.com/tc39/proposal-defer-import-eval) syntax to dynamic `import()` at the AST level.

## What it does

This plugin transforms the [import defer](https://github.com/tc39/proposal-defer-import-eval) proposal syntax into dynamic `import()` calls, enabling you to use a simplified downgrade of this syntax today across all bundlers.

> **Note**: The real `import defer` triggers synchronous evaluation on property access. This plugin downgrades to `await import()`. In bundled environments the behavior is equivalent, but the usage site must be in an async context (async function or top-level await).

### Before

```js
import defer * as utils from "heavy-module";

setTimeout(async () => {
  utils.doWork();
});

utils.getValue();
```

### After

```js
setTimeout(async () => {
  (await import("heavy-module")).doWork();
});

(await import("heavy-module")).getValue();
```

## Limitations

If a deferred import is used inside a **non-async function scope**, the plugin will throw an error because `await import()` cannot be used in synchronous contexts.

```js
import defer * as c from "c";

// ERROR: Cannot use deferred import in a non-async function scope
function sync() {
  c.value;
}
```

## Install

```bash
pnpm add -D unplugin-import-defer
```

## Usage

<details open>
<summary>Vite</summary>

```ts
// vite.config.ts
import importDefer from 'unplugin-import-defer/vite'

export default defineConfig({
  plugins: [importDefer()],
})
```

</details>

<details>
<summary>Rollup</summary>

```ts
// rollup.config.js
import importDefer from 'unplugin-import-defer/rollup'

export default {
  plugins: [importDefer()],
}
```

</details>

<details>
<summary>Webpack</summary>

```ts
// webpack.config.js
import importDefer from 'unplugin-import-defer/webpack'

export default {
  plugins: [importDefer()],
}
```

</details>

<details>
<summary>esbuild</summary>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import importDefer from 'unplugin-import-defer/esbuild'

build({
  plugins: [importDefer()],
})
```

</details>

<details>
<summary>Rspack</summary>

```ts
// rspack.config.js
import importDefer from 'unplugin-import-defer/rspack'

export default {
  plugins: [importDefer()],
}
```

</details>

<details>
<summary>Farm</summary>

```ts
// farm.config.ts
import importDefer from 'unplugin-import-defer/farm'

export default defineConfig({
  plugins: [importDefer()],
})
```

</details>

<details>
<summary>Nuxt</summary>

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['unplugin-import-defer/nuxt'],
})
```

</details>

<details>
<summary>Astro</summary>

```ts
// astro.config.mjs
import importDefer from 'unplugin-import-defer/astro'

export default defineConfig({
  integrations: [importDefer()],
})
```

</details>

## License

MIT
