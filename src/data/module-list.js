/**
 * The course running order, as filenames.
 *
 * This is the one place a new module gets registered. The build script reads
 * it to generate the manifest, and courses.js maps it onto the lazy loaders
 * that Vite creates from the modules directory, so adding a module here is
 * all it takes, and no module is bundled into the initial download.
 */

export const MODULE_FILES = [
  'm00-setup.js',
  'm01-fundamentals.js',
  'm02-issuing.js',
  'm03-compliance.js',
  'm04-markets.js',
  'm05-servicing.js',
  'm06-unique-assets.js',
  'm07-oracles.js',
  'm08-governance.js',
  'm09-hooks.js',
  'm10-capstone.js',
  'm11-production.js',
]
