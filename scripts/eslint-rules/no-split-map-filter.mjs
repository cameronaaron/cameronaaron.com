/**
 * Closes a real evasion of the `no-restricted-syntax` map().filter() /
 * flatMap().filter() bans in eslint.config.mjs: those are single-selector AST
 * matches on one expression (`a.map(f).filter(g)`), so splitting the exact
 * same allocation across two statements —
 *
 *   const mapped = items.map(f);
 *   const filtered = mapped.filter(g);
 *
 * — passes them cleanly while allocating the identical two arrays. A regex or
 * single-selector AST rule can only ever match a fixed shape; this rule uses
 * real scope analysis (ESLint's scope manager, not a name-string guess) to
 * follow the variable to its declaration and catch the split form too.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const noSplitMapFilter = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling .filter() on a variable whose sole definition is a .map()/.flatMap() call result — the same two-array allocation as map().filter() chained directly, just split across statements.',
    },
    schema: [],
    messages: {
      splitMapFilter:
        'Calling .filter() on a variable assigned from .{{sourceMethod}}() allocates two arrays, the same as {{sourceMethod}}().filter() chained directly — use a single-pass loop with conditional push instead (CLAUDE.md algorithm standards).',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'filter' ||
          node.callee.object.type !== 'Identifier'
        ) {
          return;
        }

        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const scope = sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
        const variable = findVariable(scope, node.callee.object.name);
        if (!variable) return;

        // Only flag when the variable has exactly one definition, is never
        // reassigned afterward, and that definition's initializer is itself a
        // .map()/.flatMap() call — a variable that could hold something else
        // (reassigned, a function param, a destructure) is outside what a
        // lint rule can safely infer. `defs` only tracks declarations, not
        // later assignments, so reassignment needs its own check via write
        // references (the declaration's own initializer counts as one).
        if (variable.defs.length !== 1) return;
        const writeCount = variable.references.filter((ref) => ref.isWrite()).length;
        if (writeCount !== 1) return;
        const def = variable.defs[0];
        if (def.type !== 'Variable' || !def.node.init) return;

        const init = def.node.init;
        if (
          init.type !== 'CallExpression' ||
          init.callee.type !== 'MemberExpression' ||
          init.callee.property.type !== 'Identifier' ||
          (init.callee.property.name !== 'map' && init.callee.property.name !== 'flatMap')
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'splitMapFilter',
          data: { sourceMethod: init.callee.property.name },
        });
      },
    };
  },
};

export default noSplitMapFilter;

function findVariable(scope, name) {
  let currentScope = scope;
  while (currentScope) {
    const variable = currentScope.variables.find((v) => v.name === name);
    if (variable) return variable;
    currentScope = currentScope.upper;
  }
  return null;
}
