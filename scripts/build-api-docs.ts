import * as fs from 'fs-jetpack'
import * as path from 'path'
import { extractDocsFromModuleAtPath, renderMarkdown } from '../src'

updateMarkdownBlock(
  path.join(__dirname, '../README.md'),
  'api docs',
  renderMarkdown(
    extractDocsFromModuleAtPath(path.join(__dirname, '../src/index.ts'))
  )
)

/**
 * Replace a block of content inside a markdown file.
 */
function updateMarkdownBlock(
  filePath: string,
  blockName: string,
  blockContent: string
): void {
  let contents = fs.read(filePath)!

  contents = contents.replace(
    new RegExp(
      `(<!-- START ${blockName} --->).*(<!-- END ${blockName} --->)`,
      'is'
    ),
    `$1\n${blockContent}$2`
  )

  fs.write(filePath, contents)
}