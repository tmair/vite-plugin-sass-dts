import { writeFile } from 'node:fs'
import { dirname, basename } from 'node:path'
import prettier from 'prettier'
const { format } = prettier

import { type Options } from 'prettier'
import { PluginOptions } from 'type'
import { getRelativePath } from './util'
import path from 'path'
const DEFAULT_TYPE_NAME = 'ClassNames'

export const writeToFile = async (
  prettierOptions: Options,
  fileName: string,
  classNameKeys: Map<string, boolean>,
  options?: PluginOptions
) => {
  const typeName = getTypeName(path.basename(fileName), options)
  let exportTypes = '',
    exportClassNames = `export type ${typeName} = `
  const exportStyle = 'export = classNames;'
  for (const classNameKey of classNameKeys.keys()) {
    exportTypes = `${exportTypes}\n${formatExportType(classNameKey)}`
    exportClassNames =
      exportClassNames !== `export type ${typeName} = `
        ? `${exportClassNames} | '${classNameKey}'`
        : `${exportClassNames} '${classNameKey}'`
  }

  let outputFileString = ''
  if (options?.global?.outFile) {
    const relativePath = getRelativePath(
      dirname(fileName),
      dirname(options.global.outFile)
    )
    const exportTypeFileName = formatExportTypeFileName(options.global.outFile)
    const globalClassNamesPrefix = classNameKeys.size === 0 ? '' : '| '
    outputFileString = `import globalClassNames, { ClassNames as GlobalClassNames } from '${relativePath}${exportTypeFileName}'\n`
    outputFileString = `${outputFileString}declare const classNames: typeof globalClassNames & {${exportTypes}\n};\n${exportStyle}\n${exportClassNames} ${globalClassNamesPrefix}GlobalClassNames`
  } else {
    outputFileString = `declare const classNames: {${exportTypes}\n};\n${exportStyle}\n${exportClassNames}`
  }

  const prettierdOutputFileString = format(outputFileString, prettierOptions)

  writeFile(
    formatWriteFileName(fileName),
    `${prettierdOutputFileString}`,
    (err) => {
      if (err) {
        console.log(err)
        throw err
      }
    }
  )
}

export const getTypeName = (fileName: string, options?: PluginOptions) => {
  if (options && options.typeName && options.typeName.replacement) {
    if (typeof options.typeName.replacement === 'function') {
      return options.typeName.replacement(fileName)
    } else {
      return options.typeName.replacement
    }
  }

  return DEFAULT_TYPE_NAME
}

export const formatExportType = (key: string) =>
  `  readonly '${key}': '${key}';`

export const formatWriteFileName = (file: string) =>
  `${file}${file.endsWith('d.ts') ? '' : '.d.ts'}`

export const formatExportTypeFileName = (file: string) =>
  basename(file.replace('.ts', ''))
