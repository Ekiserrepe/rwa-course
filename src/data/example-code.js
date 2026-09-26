/**
 * example(path): the verbatim source of a script in /examples.
 *
 * Lessons never paste their own copy of a runnable script: they reference the
 * file, and scripts/build-course-data.mjs snapshots /examples into
 * generated/examples.js before anything imports the modules. Rename a file
 * without updating the lesson and the build fails here, loudly, instead of
 * shipping a lesson whose code no longer matches what readers run.
 */
import { EXAMPLES } from './generated/examples.js'

export function example(path) {
  const code = EXAMPLES[path]
  if (code === undefined) throw new Error(`examples/${path} does not exist`)
  return code.trimEnd()
}

/**
 * examplePhases(path, names): only some phases of a script whose steps are
 * `async name() { … }` methods (the capstone's run.js), each with the comment
 * above it. A lesson on one phase shows that phase, cut from the real file.
 */
export function examplePhases(path, names) {
  const lines = example(path).split('\n')
  return names
    .map((name) => {
      const start = lines.findIndex((l) => l.startsWith(`  async ${name}(`))
      if (start < 0) throw new Error(`examples/${path} has no phase "${name}"`)
      let from = start
      while (from > 0 && lines[from - 1].startsWith('  //')) from--
      const end = lines.findIndex((l, i) => i > start && l === '  },')
      if (end < 0) throw new Error(`examples/${path}: phase "${name}" has no closing "  },"`)
      return lines.slice(from, end + 1).map((l) => l.slice(2)).join('\n')
    })
    .join('\n\n')
}
