#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const readline = require('readline')
const { spawn } = require('child_process')
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
 * Catch and report unexpected error.
 * @param {any} error The thrown error object.
 * @returns {void}
 */
function onFatalError(error) {
  process.exitCode = 2

  const { version } = require('../package.json')

  console.error(`
  Oops! Something went wrong! :(
  version: ${version}
  ${error}`)
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
          '\nDeploying',
          argv.workerName ? argv.workerName : 'custom-mc-cf-zaraz',
          'as Cloudflare Zaraz Custom MC...'
        )

        const shell = spawn(
          'npx',
          ['wrangler', 'publish', '--config', TMP_DIR + '/wrangler.toml'],
          { stdio: 'inherit' }
        )
        shell.on('close', code => {
          if (code === 0) {
            console.log(
              `\n🎉 Hooray!\nYour Managed Component was published as a Worker named "${argv.workerName}" successfully!`
            )
            console.log(
              'You can configure it as tool using the Cloudflare Zaraz Dashboard at https://dash.cloudflare.com/?to=/:account/:zone/zaraz/tools-config/tools/catalog'
            )
          } else {
            exit(1)
          }

          exit(0)
        })
      }
    )
    .help().argv
})().catch(onFatalError)
