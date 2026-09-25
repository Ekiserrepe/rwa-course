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
