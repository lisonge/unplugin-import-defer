import type {
  ArrowFunctionExpression,
  BindingPattern,
  BindingProperty,
  BindingRestElement,
  BlockStatement,
  ComputedMemberExpression,
  Function,
  FunctionBody,
  ImportDeclaration,
  Node,
  ObjectProperty,
  ParamPattern,
  Program,
  Statement,
  StaticMemberExpression,
  VariableDeclaration,
  VariableDeclarator,
} from 'oxc-parser'
import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { walk } from 'zimmerframe'

interface DeferImportInfo {
  localName: string
  source: string
  start: number
  end: number
}

interface WalkState {
  async: boolean
  scopeBindings: Set<string>
}

export function transform(code: string, id: string): { code: string, map: ReturnType<MagicString['generateMap']> } | null {
  if (!code.includes('import') || !code.includes('defer')) {
    return null
  }

  const result = parseSync(id, code)
  const ast = result.program

  const deferImports = collectDeferImports(ast)
  if (deferImports.length === 0) {
    return null
  }

  const s = new MagicString(code)
  const deferMap = new Map<string, string>()

  for (const info of deferImports) {
    deferMap.set(info.localName, info.source)
    let removeEnd = info.end
    if (code[removeEnd] === '\n') removeEnd++
    else if (code[removeEnd] === '\r' && code[removeEnd + 1] === '\n') removeEnd += 2
    s.remove(info.start, removeEnd)
  }

  const initialState: WalkState = { async: true, scopeBindings: new Set() }

  function handleFunction(node: Function | ArrowFunctionExpression, { state, next }: { state: WalkState, next: (state: WalkState) => void }) {
    const bindings = new Set(state.scopeBindings)
    if (node.type !== 'ArrowFunctionExpression' && node.id) {
      bindings.add(node.id.name)
    }
    collectParamBindings(node.params, bindings)
    if (node.body && node.body.type === 'BlockStatement') {
      collectBlockLevelBindings((node.body as FunctionBody).body, bindings)
    }
    next({ async: node.async, scopeBindings: bindings })
  }

  walk(ast as Node, initialState, {
    ImportDeclaration() {
      // Don't traverse into import declarations
    },
    FunctionDeclaration(node, ctx) { handleFunction(node, ctx) },
    FunctionExpression(node, ctx) { handleFunction(node, ctx) },
    ArrowFunctionExpression(node, ctx) { handleFunction(node, ctx) },
    BlockStatement(node: Node, { state, next }) {
      const block = node as BlockStatement
      const bindings = new Set(state.scopeBindings)
      collectBlockLevelBindings(block.body, bindings)
      next({ ...state, scopeBindings: bindings })
    },
    _(node, { state, next, path }) {
      if (node.type !== 'Identifier') {
        next()
        return
      }

      const identifier = node as { name: string, start: number, end: number }
      if (!deferMap.has(identifier.name)) {
        return
      }

      if (state.scopeBindings.has(identifier.name)) {
        return
      }

      const parent = path.at(-1)

      if (parent && parent.type === 'MemberExpression') {
        const member = parent as StaticMemberExpression | ComputedMemberExpression
        if (!member.computed && member.property === node) {
          return
        }
      }

      if (parent && parent.type === 'Property') {
        const prop = parent as ObjectProperty
        if (!prop.computed && prop.key === node && prop.value !== (node as unknown)) {
          return
        }
      }

      if (parent && parent.type === 'VariableDeclarator') {
        const declarator = parent as VariableDeclarator
        if (declarator.id === node) {
          return
        }
      }

      if (!state.async) {
        throw new Error(
          `[unplugin-import-defer] Cannot use deferred import "${identifier.name}" in a non-async function scope in ${id}. ` +
          `The enclosing function must be async to support "await import()".`
        )
      }

      const source = deferMap.get(identifier.name)!
      s.overwrite(node.start, node.end, `(await import(${JSON.stringify(source)}))`)
    },
  })

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}

function collectDeferImports(ast: Program): DeferImportInfo[] {
  const imports: DeferImportInfo[] = []
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue
    const decl = node as ImportDeclaration
    if (decl.phase !== 'defer') continue
    for (const spec of decl.specifiers) {
      if (spec.type === 'ImportNamespaceSpecifier') {
        imports.push({
          localName: spec.local.name,
          source: decl.source.value,
          start: decl.start,
          end: decl.end,
        })
      }
    }
  }
  return imports
}

function collectBlockLevelBindings(body: Array<Statement | { type: string }>, bindings: Set<string>) {
  for (const stmt of body) {
    if (stmt.type === 'VariableDeclaration') {
      const decl = stmt as VariableDeclaration
      for (const declarator of decl.declarations) {
        collectBindingPattern(declarator.id, bindings)
      }
    }
    if (stmt.type === 'FunctionDeclaration') {
      const fn = stmt as Function
      if (fn.id) bindings.add(fn.id.name)
    }
  }
}

function collectParamBindings(params: ParamPattern[], bindings: Set<string>) {
  for (const param of params) {
    if (param.type === 'TSParameterProperty') {
      collectBindingPattern(param.parameter, bindings)
    } else if (param.type === 'RestElement') {
      collectBindingPattern(param.argument, bindings)
    } else {
      collectBindingPattern(param, bindings)
    }
  }
}

function collectBindingPattern(pattern: BindingPattern, bindings: Set<string>) {
  switch (pattern.type) {
    case 'Identifier':
      bindings.add(pattern.name)
      break
    case 'ObjectPattern':
      for (const prop of pattern.properties) {
        collectObjectPatternProperty(prop, bindings)
      }
      break
    case 'ArrayPattern':
      for (const el of pattern.elements) {
        if (el === null) continue
        if (el.type === 'RestElement') {
          collectBindingPattern(el.argument, bindings)
        } else {
          collectBindingPattern(el, bindings)
        }
      }
      break
    case 'AssignmentPattern':
      collectBindingPattern(pattern.left, bindings)
      break
  }
}

function collectObjectPatternProperty(prop: BindingProperty | BindingRestElement, bindings: Set<string>) {
  if (prop.type === 'RestElement') {
    collectBindingPattern(prop.argument, bindings)
  } else {
    collectBindingPattern(prop.value, bindings)
  }
}
