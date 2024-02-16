async function c(n, i) {
  i.ecommerce &&
    n.addEventListener('ecommerce', e => {
      e.name === 'Order Completed' &&
        console.info('Ka-ching! \u{1F4B0}', JSON.stringify(e.payload))
    }),
    n.createEventListener('mousemove', async e => {
      let { payload: t } = e
      e.client.execute("console.log('\u{1F401} \u{1FAA4} Mousemove:')"),
        console.info(
          '\u{1F401} \u{1FAA4} Mousemove:',
          JSON.stringify(t, null, 2)
        )
    }),
    n.createEventListener('mousedown', async e => {
      let { client: t, payload: o } = e
      e.client.execute(
        "console.log('\u{1F401} \u2B07\uFE0F Mousedown payload:')"
      ),
        console.info('\u{1F401} \u2B07\uFE0F Mousedown payload:', o)
      let [s] = o.mousedown
      t.set('lastClickX', s.clientX), t.set('lastClickY', s.clientY)
    }),
    n.createEventListener('historyChange', async e => {
      e.client.execute(
        "console.log('\u{1F4E3} Ch Ch Ch Chaaanges to history detected!')"
      ),
        console.info(
          '\u{1F4E3} Ch Ch Ch Chaaanges to history detected!',
          e.payload
        )
    }),
    n.createEventListener('resize', async e => {
      e.client.execute("console.log('\u{1FA9F} New window size!')"),
        console.info(
          '\u{1FA9F} New window size!',
          JSON.stringify(e.payload, null, 2)
        )
    }),
    n.createEventListener('scroll', async e => {
      e.client.execute(
        "console.log('\u{1F6DE}\u{1F6DE}\u{1F6DE} They see me scrollin...they hatin...')"
      ),
        console.info(
          '\u{1F6DE}\u{1F6DE}\u{1F6DE} They see me scrollin...they hatin...',
          JSON.stringify(e.payload, null, 2)
        ),
        e.client.attachEvent('resize')
    }),
    n.addEventListener('response', ({ client: e }) => {
      console.log('zaraz-test-mc Response event was called!!! ')
    }),
    n.addEventListener('remarketing', ({ client: e }) => {
      console.log('zaraz-test-mc remarketing event!!! ')
    }),
    n.addEventListener('clientcreated', ({ client: e }) => {
      console.log('clientcreated!: \u{1F423}'),
        e.attachEvent('mousedown'),
        e.attachEvent('historyChange'),
        e.attachEvent('scroll')
    }),
    n.addEventListener('event', async e => {
      let { client: t, name: o } = e
      o === 'verifiedSignup' &&
        (console.info(
          '\u{1F9C0}\u{1F9C0}  verifiedSignup event! \u{1F9C0}\u{1F9C0}'
        ),
        t.execute(
          'console.log("\u{1F9C0}\u{1F9C0}  verifiedSignup event! \u{1F9C0}\u{1F9C0}")'
        ))
    }),
    n.addEventListener('pageview', async e => {
      let { client: t } = e
      console.info(
        '\u{1F4C4} Pageview received!',
        t.get('user_id'),
        t.get('last_page_title'),
        t.get('session_id')
      )
      let o = t.url.searchParams.get('user_id')
      t.set('user_id', o, { scope: 'infinite' }),
        t.title && t.set('last_page_title', t.title, { scope: 'page' }),
        t.set('session_id', 'session_date_' + new Date().toUTCString(), {
          scope: 'session',
        }),
        t.return('Some very important value'),
        t.execute(
          'console.info("Page view processed by Zaraz Test Component")'
        ),
        t.fetch('http://example.com', { mode: 'no-cors' })
    })
}
export { c as default }
