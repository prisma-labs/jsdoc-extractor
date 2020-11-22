import * as tsm from 'ts-morph'
import { casesHandled, Index, indexBy } from '../../utils'

/**
 * Express a filter for diagnostic errors.
 *
 * An array of filters means to ignore only certain errors. It can be one of three things:
 *
 * 1. regular expression to match against the error code
 * 2. the name of an error category
 * 3. regular expression to match against the file path from which the error arises
 *
 * You can also combine a file path with either error code or error category.
 *
 * Regular expressions are applied case-insensitive.
 *
 * Array items share an OR semantic.
 *
 * @example { path: '/foo/bar/.*' }
 * @example { code: '2\d{2}5' }
 * @example { category: 'error' }
 * @example { path: '/foo/bar/.*', code '24.*' }
 */
export type DiagnosticFilter =
  | { path?: string; code?: string }
  | { path?: string; category?: DiagnosticCategoryString }

export type DiagnosticCategoryString = 'error' | 'message' | 'warning' | 'suggestion'

/**
 *
 */
export function applyDiagnosticFilters(diagnosticFilters: DiagnosticFilter[], diagnostics: tsm.Diagnostic[]) {
  let diagnosticsNotIgnored: tsm.Diagnostic[] = []

  for (const diagnostic of diagnostics) {
    for (const f of diagnosticFilters) {
      if (
        'category' in f &&
        f.category &&
        diagnostic.getCategory() === stringLiteralToDiagnosticCategory(f.category)
      ) {
        break
      }
      if ('code' in f && f.code && diagnostic.getCode().toString().match(new RegExp(f.code, 'i'))) {
        break
      }
      if (f.path && diagnostic.getSourceFile()?.getFilePath().toString().match(new RegExp(f.path, 'i'))) {
        break
      }
      diagnosticsNotIgnored.push(diagnostic)
    }
  }

  return diagnosticsNotIgnored
}

function stringLiteralToDiagnosticCategory(dc: DiagnosticCategoryString): tsm.DiagnosticCategory {
  if (dc === 'error') return tsm.DiagnosticCategory.Error
  if (dc === 'message') return tsm.DiagnosticCategory.Message
  if (dc === 'suggestion') return tsm.DiagnosticCategory.Suggestion
  if (dc === 'warning') return tsm.DiagnosticCategory.Warning
  casesHandled(dc)
}

/**
 * Get the discriminant union properties if any of the given types.
 *
 * Requires to be a discriminant union property are:
 *
 * 1. Property name common to all types given
 * 2. Is a literal type
 * 3. Type is not same as any other same-named property among items
 *
 * @remarks
 *
 * This is a re-implementation of:
 *
 * isDiscriminantProperty
 * findDiscriminantProperties
 *
 * found in:
 *
 * https://raw.githubusercontent.com/microsoft/TypeScript/master/src/compiler/checker.ts
 *
 * which might be surfaced in ts-morph one day:
 *
 * https://github.com/dsherret/ts-morph/issues/880
 *
 */
export function getDiscriminantPropertiesOfUnionMembers(
  members: tsm.Type[]
): (tsm.PropertySignature | tsm.MethodSignature)[] {
  const membersLiteralProperties = members.map((m) => getProperties(m).filter((p) => p.getType().isLiteral()))
  const membersLiteralPropertiesByName = membersLiteralProperties.map((m) => indexBy(m, (p) => p.getName()))

  const commonLiteralDistinctPropertiesByName: Index<tsm.PropertySignature | tsm.MethodSignature> = {}

  for (const memberLiteralProperties of membersLiteralPropertiesByName) {
    membersLiteralPropertiesByName.shift()
    for (const literalProperty of Object.values(memberLiteralProperties)) {
      if (commonLiteralDistinctPropertiesByName[literalProperty.getName()]) {
        continue
      }

      for (const otherMemberLiteralProperties of membersLiteralPropertiesByName) {
        const otherLiteralProperty = otherMemberLiteralProperties[literalProperty.getName()]
        if (otherLiteralProperty) {
          if (!isSameLiteralTypes(literalProperty.getType(), otherLiteralProperty.getType())) {
            commonLiteralDistinctPropertiesByName[literalProperty.getName()] = literalProperty
          }
        }
      }
    }
  }
  return Object.values(commonLiteralDistinctPropertiesByName)
}

function isSameLiteralTypes(t1: tsm.Type, t2: tsm.Type): boolean {
  if (!t1.isLiteral()) return false
  if (!t2.isLiteral()) return false
  return t1.getText() === t2.getText()
}

/**
 * Get the properties of a type, if any. This may return methods or non-methods.
 *
 * @remarks
 *
 * Overloadeds are discarding, taking only the first declaration found.
 */
export function getProperties(t: tsm.Type): (tsm.PropertySignature | tsm.MethodSignature)[] {
  return t.getProperties().map((p) => {
    const node = p.getDeclarations()[0] as tsm.PropertySignature | tsm.MethodSignature
    return node
  })
}
