Zaraz MC worker template provides a template for deploying Custom MC workers. Custom MC workers can be configured as Custom Tools within [Cloudflare Zaraz](https://dash.cloudflare.com/) from `Add new Tool` page.

## Usage

> 💡 **Prerequisite:** To deploy a new worker you need to [install Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and to run `wrangler login` before anything else

### Using npx

> Your managed component should be bundled before passing the file to the npx command

`npx zaraz-mc-worker-template -c /path/to/your/managed/component.js -n custom-mc-your-mc-worker-name`

### Cloning this repository

> This should give you much more flexibility if you are comfortable with wrangler and workers in general

- Clone this MC Worker Template
- Copy your MC files to `./src`(it's recommended to create a new folder withing `./src` if you're not using an already bundled MC)
- Import your component in index.ts by replacing this line `import component from './component.js'` with your import
- Edit `wrangler.toml` if you need to change the worker name or if you're using a more complex worker configuration for your MC
