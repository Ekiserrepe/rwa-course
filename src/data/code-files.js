/**
 * Which examples/ file a lesson's code block shows, read from its title:
 * "examples/capstone/run.js (maturity, audit)" -> "capstone/run.js".
 *
 * Shared by the build script (each lesson's file list in the manifest) and the
 * app (theory links that jump to a file in the Code tab), so both sides agree.
 */
export const codeFile = (block) => (block?.title?.en ?? '').replace(/^examples\//, '').split(' ')[0]

/** The DOM id of a file's code block, the target a theory link scrolls to. */
export const codeAnchor = (file) => `code-${file.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
