#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const fs = require('fs')
const util = require('node:util')
const path = require('path')
const crypto = require('crypto')
const readline = require('readline')
const exec = util.promisify(require('node:child_process').exec)
// const { exec } = require('node:child_process')

const SRC_DIR = path.join(__dirname, '..')
const TMP_DIR = '/tmp/custom-mc-' + crypto.randomUUID()
const WRANGLER_TOML_PATH = TMP_DIR + '/wrangler.toml'

/**
 * @fileoverview Main CLI that is run via `publish-mc-to-zaraz` command
 */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const prompt = query => new Promise(resolve => rl.question(query, resolve))

function exit(code) {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmdirSync(TMP_DIR, { recursive: true })
  }
  process.exit(code)
}
/**
 * Get the error message of a given value.
 * @param {any} error The value to get.
 * @returns {string} The error message.
 */
function getErrorMessage(error) {
  // Lazy loading because this is used only if an error happened.
  const util = require('util')

  // Foolproof -- third-party module might throw non-object.
  if (typeof error !== 'object' || error === null) {
    return String(error)
  }

  // Use templates if `error.messageTemplate` is present.
  if (typeof error.messageTemplate === 'string') {
    try {
      const template = require(`../messages/${error.messageTemplate}.js`)

      return template(error.messageData || {})
    } catch {
      // Ignore template error then fallback to use `error.stack`.
    }
  }

  // Use the stacktrace if it's an error object.
  if (typeof error.stack === 'string') {
    return error.stack
  }

  // Otherwise, dump the object.
  return util.format('%o', error)
}

/**
 * Catch and report unexpected error.
 * @param {any} error The thrown error object.
 * @returns {void}
 */
function onFatalError(error) {
  process.exitCode = 2

  const { version } = require('../package.json')
  const message = getErrorMessage(error)

  console.error(`
  Oops! Something went wrong! :(
  version: ${version}
  ${message}`)
}

/**
 * Replace worker name in wrangler toml in case this is provided
 */
function replaceWorkerName(workerName) {
  var fs = require('fs')
  fs.readFile(WRANGLER_TOML_PATH, 'utf8', function (err, data) {
    if (err) {
      throw new Error(err)
    }
    var result = data.replace(/custom-mc-cf-zaraz/g, workerName)

    fs.writeFile(WRANGLER_TOML_PATH, result, 'utf8', function (err) {
      if (err) {
        throw new Error(err)
      }
    })
  })
}

//------------------------------------------------------------------------------
// Execution
//------------------------------------------------------------------------------

;(async function main() {
  process.on('uncaughtException', onFatalError)
  process.on('unhandledRejection', onFatalError)

  process.exitCode = await require('yargs')
    .scriptName('managed-component-to-cloudflare-workers')
    .usage('$0 [args]')
    .command(
      ['start', '$0'],
      '(default) publish a custom MC for Cloudflare Zaraz with a given component name',
      yargs => {
        yargs
          .option('workerName', {
            alias: 'n',
            type: 'string',
            demandOption: true,
            describe: 'Name of the Cloudflare Worker to be created',
          })
          .option('componentPath', {
            alias: 'c',
            type: 'string',
            demandOption: true,
            describe: 'Path to your compiled Managed Component JavaScript file',
          })
      },
      async function (argv) {
        require('ts-node').register({
          files: true,
          transpileOnly: true,
          dir: __dirname,
        })

        if (
          !fs.existsSync(argv.componentPath) ||
          !fs.lstatSync(argv.componentPath).isFile() ||
          !argv.componentPath.endsWith('.js')
        ) {
          console.error(
            `Error: The provided component path (${argv.componentPath}) is not a JavaScript file`
          )
          exit(1)
        }

        try {
          process.stdout.write(
            'Packing your Managed Component as a Cloudflare Worker...'
          )
          fs.cpSync(SRC_DIR, TMP_DIR, { recursive: true, force: true })
          console.log(' ✅')
        } catch (err) {
          fs.rmSync(TMP_DIR, { recursive: true, force: true })
          console.error(err)
          return
        }

        // copy component code to the temporary folder
        try {
          fs.copyFileSync(argv.componentPath, TMP_DIR + '/src/component.js')
        } catch (err) {
          fs.rmSync(TMP_DIR, { recursive: true, force: true })
          console.error(err)
          return
        }

        // replace wrangler toml worker name
        if (!argv.workerName.trim()) {
          console.error(
            `\nError: The provided Worker name (${argv.workerName}) is invalid`
          )
          exit(1)
        }
        if (!argv.workerName.startsWith('custom-mc-')) {
          argv.workerName = 'custom-mc-' + argv.workerName
        }
        replaceWorkerName(argv.workerName)

        const userInput = await prompt(
          `\nYour Cloudflare Worker will be named "${argv.workerName}".\nEnter "yes" to deploy with Wrangler: `
        )

        if (userInput !== 'yes') exit(0)

        console.log(
          'Deploying',
          argv.workerName ? argv.workerName : 'custom-mc-cf-zaraz',
          'as Cloudflare Zaraz Custom MC...'
        )

        const resultData = await exec(
          `npx wrangler publish --config ${TMP_DIR + '/wrangler.toml'}`
        )

        if (!resultData.stderr) {
          console.log(
            'Worker',
            argv.workerName ? argv.workerName : 'custom-mc-cf-zaraz',
            'published succesfully'
          )
          console.log(resultData.stdout)
          console.log(
            '\n🚀 Head to your Cloudflare Zaraz Dashboard to configure this Managed Component as a new tool. https://dash.cloudflare.com/?to=/:account/:zone/zaraz/tools-config/tools/catalog'
          )
        } else {
          throw new Error(resultData.stderr)
        }

        try {
          fs.rmSync(TMP_DIR, { recursive: true, force: true })
        } catch (err) {
          console.error(err)
        }
      }
    )
    .help().argv
})().catch(onFatalError)
