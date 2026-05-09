import { describe, expect, it } from 'vitest'
import { transform } from '../src/core/transform'

describe('transform', () => {
  it('should transform import defer in async arrow function', () => {
    const code = `import defer * as c from "c";
setTimeout(async() => {
  c.value
});`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).toContain('(await import("c")).value')
    expect(result!.code).not.toContain('import defer')
    expect(result!.code).toContain('setTimeout(async() =>')
  })

  it('should transform top-level usage (top-level await)', () => {
    const code = `import defer * as c from "c";
c.value;`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code.trim()).toBe('(await import("c")).value;')
  })

  it('should transform multiple usages', () => {
    const code = `import defer * as c from "c";
setTimeout(async() => {
  c.value
});
c.value`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    const output = result!.code
    const matches = output.match(/\(await import\("c"\)\)/g)
    expect(matches).toHaveLength(2)
  })

  it('should handle multiple defer imports', () => {
    const code = `import defer * as a from "mod-a";
import defer * as b from "mod-b";
async function run() {
  a.foo();
  b.bar();
}`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).toContain('(await import("mod-a")).foo()')
    expect(result!.code).toContain('(await import("mod-b")).bar()')
  })

  it('should error in non-async function scope', () => {
    const code = `import defer * as c from "c";
function sync() {
  c.value;
}`
    expect(() => transform(code, 'test.ts')).toThrow(
      /Cannot use deferred import "c" in a non-async function scope/
    )
  })

  it('should error in non-async arrow function', () => {
    const code = `import defer * as c from "c";
const fn = () => {
  c.value;
};`
    expect(() => transform(code, 'test.ts')).toThrow(
      /Cannot use deferred import "c" in a non-async function scope/
    )
  })

  it('should not error in async function', () => {
    const code = `import defer * as c from "c";
async function run() {
  c.value;
}`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).toContain('(await import("c")).value')
  })

  it('should return null if no defer imports', () => {
    const code = `import { foo } from "bar";
foo();`
    const result = transform(code, 'test.ts')
    expect(result).toBeNull()
  })

  it('should not transform shadowed variables', () => {
    const code = `import defer * as c from "c";
async function run() {
  const c = "local";
  console.log(c);
}`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).not.toContain('await import("c")')
  })

  it('should handle namespace used as argument', () => {
    const code = `import defer * as c from "c";
async function run() {
  doSomething(c);
}`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).toContain('doSomething((await import("c")))')
  })

  it('should handle nested async in sync', () => {
    const code = `import defer * as c from "c";
function outer() {
  setTimeout(async () => {
    c.value;
  });
}`
    const result = transform(code, 'test.ts')
    expect(result).not.toBeNull()
    expect(result!.code).toContain('(await import("c")).value')
  })
})
