# Managed Component To Cloudflare Worker

Managed Component To Cloudflare Worker provides an easy way for using custom [Managed Components](https://managedcomponents.dev/) with Cloudflare Zaraz, by deploying them as a Cloudflare Worker. Deployed Managed Components can be configured as Tools within [Cloudflare Zaraz](https://dash.cloudflare.com/) from the "Add new Tool" page.

## Usage

> 💡 **Prerequisite:** To deploy a new Cloudflare Worker you need to first login with using `npx wrangler login`

### Recommended: Using `npx`

Your Managed Component should be bundled before trying to deploy it.

`npx managed-component-to-cloudflare-worker /path/to/managed/component.js component-name`

### Advanced: Manual Worker setup

This method gives you more flexibility but requires you to be familiar with `wrangler` and Cloudflare Workers in general.

1. Clone this repository
2. Copy your Managed Component files to `./src` (it's recommended to create a new directory within `./src` if you're not using an already bundled Managed Component)
3. Import your Managed Component in index.ts by replacing the line `import component from './component.js'` with your `import` command
4. Edit [wrangler.toml](wrangler.toml) if you need to change the Worker name or if you're using a more complex Worker configuration for your Managed Component. Your Worker name must start with `custom-mc-` for it to appear in the Cloudflare Dashboard.
5. If you're using any of the storage or cache methods (`get`, `set`, `useCache`, `invalidateCache`) in your component,
  you have to add a KV binding. There are two ways to do this:

     Option 1. Run `npx wrangler kv:namespace create <KV_NAMESPACE>`, copy the `id` string, and add binding in [wrangler.toml](wrangler.toml) as follows:

     ```
     kv_namespaces = [
         { binding = "KV", id = "<YOUR_KV_ID>" }
        ]
     ```
     Option 2. After publishing this Managed Component as worker, follow [these steps](https://developers.cloudflare.com/workers/configuration/environment-variables/#add-environment-variables-via-the-dashboard) to add a KV binding as environment variable with variable name `KV`.

1. Run `npx wrangler publish`

#### Environment Variables / Bindings

To use worker environment variables/secrets in your managed component, add variables [via wrangler](https://developers.cloudflare.com/workers/configuration/environment-variables/#add-environment-variables-via-wrangler) or [via dashboard](https://developers.cloudflare.com/workers/configuration/environment-variables/#add-environment-variables-via-the-dashboard) and use them in your component through the `Manager.ext` parameter: `manager.ext.env.YOUR_ENV_VARIABLE`