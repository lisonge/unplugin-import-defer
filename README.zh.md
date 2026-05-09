# unplugin-import-defer

[English](./README.md)

从 AST 层面将 [import defer](https://github.com/tc39/proposal-defer-import-eval) 语法降级为动态 `import()`。

## 功能

本插件将 [import defer](https://github.com/tc39/proposal-defer-import-eval) 提案语法转换为动态 `import()` 调用，让你可以在所有打包工具中使用这一语法的简化降级方案。

> **注意**：真正的 `import defer` 是在属性访问时触发同步求值。本插件降级为 `await import()`。在打包环境下行为等价，但使用处必须在 async 上下文中（async 函数或顶层 await）。

### 转换前

```js
import defer * as utils from "heavy-module";

setTimeout(async () => {
  utils.doWork();
});

utils.getValue();
```

### 转换后

```js
setTimeout(async () => {
  (await import("heavy-module")).doWork();
});

(await import("heavy-module")).getValue();
```

## 限制

如果延迟导入在**非 async 函数作用域**中被使用，插件会抛出错误，因为 `await import()` 无法在同步上下文中使用。

```js
import defer * as c from "c";

// 错误：不能在非 async 函数作用域中使用延迟导入
function sync() {
  c.value;
}
```

## 安装

```bash
pnpm add -D unplugin-import-defer
```

## 使用方式

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

## 许可证

MIT
