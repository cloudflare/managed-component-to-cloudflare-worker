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

/**
 * Check if prompt input is a valid yes response
 */
async function isYesResponse(promptText) {
  const response = await getValidPromptResponse(promptText)
  if (response === 'y' || response === 'yes') return true
  return false
}

/**
 * Repeat prompt until a valid response is provided
 */
async function getValidPromptResponse(
  promptText, 
  isValid = function(resp) {
    return ['y', 'yes', 'n', 'no'].includes(resp)
  }
) {
  let response = await prompt(promptText)
  response = response.trim()
  if (isValid(response)) return response

  console.error(`\nError: Invalid input!`)
  return await getValidPromptResponse(promptText, isValid)
}

/**
 * Check if component file uses any methods that require KV binding
 */
function fileContainsKVMethods(path) {
  const KVMethods = ['manager.get', 'manager.set', 'manager.useCache', 'manager.invalidateCache']
  const data = fs.readFileSync(path);
  return KVMethods.some(str => data.includes(str))
}

/**
 * Get KV id from KV binding string ({ binding = "name", id = "id" })
 */
function getKvId(str) {
  return str?.match(/id = ".*"/)?.[0].split('"')[1]
}

/**
 * Creates new KV namespace and returns its ID
 */
async function createNewKvNamespace() {
  const kvName = await getValidPromptResponse(
    `\nPlease enter your new KV namespace name: `,
    function(input) { return !!input }
  )
  console.log(`Creating namespace "${kvName}"...`)
  let kvId = ''
  const shell = spawn(
    'npx',
    ['wrangler', 'kv:namespace', 'create', kvName],
    { stdio: 'pipe', shell: true }
  )
  shell.stdout.setEncoding('utf8')
  for await (const data of shell.stdout) {
    const kvBindingStr = data.match(/{.*binding.*id.*}/g)?.[0]
    if (kvBindingStr) kvId = getKvId(kvBindingStr)
  }
  for await (const err of shell.stderr) {
    console.error(err.toString())
    exit(1)
  }
  await new Promise(function(resolve, _) {
    shell.on('close', async function(code) {
      if (code === 0) console.log(`✅ Successfully created namespace with title "${kvName}", id: "${kvId}"`)
      else kvId = await createNewKvNamespace()
      resolve()
    });
  });
  return kvId
}

/**
 * Lists existing KVs and prompts to choose one
 */
async function getExistingKvId() {
  console.log(`Looking for existing KVs...`)
  let kvList = ''
  const shell = spawn(
    'npx',
    ['wrangler', 'kv:namespace', 'list'],
    { stdio: 'pipe', shell: true }
  )
  shell.stdout.setEncoding('utf8')
  for await (const data of shell.stdout) {
    kvList += data.toString()
  }
  for await (const err of shell.stderr) {
    console.error(err.toString())
  }
  console.info(`The following KVs exist in your account:\n${kvList}`)

  return await getValidPromptResponse(
    `\nPlease provide the ID of the existing KV namespace that you want to use (see above): `,
    function(input) { return kvList.includes(`"id": "${input}"`) }
  )
}

/**
 * Create new or use existing KV namespace to add a binding in wrangler.toml
 */
async function setupKVBinding() {
  console.log(`\nSince your component is using storage methods, you need to set up a KV namespace binding for those methods to work.`)
  const needsNewKV = await isYesResponse(`Would you like to create a new KV namespace? (y/n): `)
  let kvId = ''
  if (needsNewKV) {
    kvId = await createNewKvNamespace()
  } else {
    kvId = await getExistingKvId()
  }
  let toml = fs.readFileSync(WRANGLER_TOML_PATH)
  toml += `\nkv_namespaces = [{ binding = "KV", id = "${kvId}" }]`
  fs.writeFileSync(WRANGLER_TOML_PATH, toml)
  console.log(`✅ KV binding has been successfully added.`)
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
  fs.cpSync(SRC_DIR, TMP_DIR, {
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

  const userInput = await isYesResponse(
    `\nYour Cloudflare Worker will be named "${workerName}".\nEnter "y" to deploy with Wrangler: `
  )
  if (!userInput) exit(0)

  if (!fileContainsKVMethods(componentPath)) {
    const componentNeedsKV = await isYesResponse(
      `\nDoes your component use any of these methods: manager.get, manager.set, manager.useCache, manager.invalidateCache? (y/n): `
    )
    if (componentNeedsKV) {
      await setupKVBinding()
    }
  } else {
    await setupKVBinding()
  }

  console.log('\nDeploying', workerName, 'as Cloudflare Zaraz Custom MC...')

  const shell = spawn(
    'npx',
    ['wrangler', 'publish', '--config', TMP_DIR + '/wrangler.toml'],
    { stdio: 'inherit', shell: true }
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
