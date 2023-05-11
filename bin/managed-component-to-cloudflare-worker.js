#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const readline = require('readline')
const { spawn } = require('child_process')

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
  const { version } = require('../package.json')

  console.error(`
  \nOops! Something went wrong! :(
version: ${version}
${error}`)

  exit(1)
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

  if (process.argv.length < 4) {
    console.log(`☁️ managed-component-to-cloudflare-worker

Publish a custom Managed Component as a Cloudflare Worker, for using with Cloudflare Zaraz.

Usage: npx managed-component-to-cloudflare-worker COMPONENT_SCRIPT WORKER_NAME

COMPONENT_SCRIPT: Path to your compiled Managed Component JavaScript file
WORKER_NAME: Name of the Cloudflare Worker to be created `)
    exit(1)
  }
  const componentPath = process.argv[2]
  let workerName = process.argv[3]

  require('ts-node').register({
    files: true,
    transpileOnly: true,
    dir: __dirname,
  })

  if (
    !fs.existsSync(componentPath) ||
    !fs.lstatSync(componentPath).isFile() ||
    !componentPath.endsWith('.js')
  ) {
    console.error(
      `Error: The provided component path (${componentPath}) is not a JavaScript file`
    )
    exit(1)
  }

  if (!workerName.trim()) {
    console.error(
      `\nError: The provided Worker name (${workerName}) is invalid`
    )
    exit(1)
  }

  process.stdout.write(
    'Packing your Managed Component as a Cloudflare Worker...'
  )
  fs.cpSync(SRC_DIR + 'sdfs/32dsf/sfd', TMP_DIR + '/sdf/sdf/31', {
    recursive: true,
    force: true,
  })
  console.log(' ✅')

  // copy component code to the temporary folder
  fs.copyFileSync(componentPath, TMP_DIR + '/src/component.js')

  if (!workerName.startsWith('custom-mc-')) {
    workerName = 'custom-mc-' + workerName
  }
  replaceWorkerName(workerName)

  const userInput = await prompt(
    `\nYour Cloudflare Worker will be named "${workerName}".\nEnter "yes" to deploy with Wrangler: `
  )

  if (userInput !== 'yes') exit(0)

  console.log('\nDeploying', workerName, 'as Cloudflare Zaraz Custom MC...')

  const shell = spawn(
    'npx',
    ['wrangler', 'publish', '--config', TMP_DIR + '/wrangler.toml'],
    { stdio: 'inherit' }
  )
  shell.on('close', code => {
    if (code === 0) {
      console.log(
        `\n🎉 Hooray!\nYour Managed Component was published as a Worker named "${workerName}" successfully!`
      )
      console.log(
        'You can configure it as tool using the Cloudflare Zaraz Dashboard at https://dash.cloudflare.com/?to=/:account/:zone/zaraz/tools-config/tools/catalog'
      )
    } else {
      exit(1)
    }

    exit(0)
  })
})()
