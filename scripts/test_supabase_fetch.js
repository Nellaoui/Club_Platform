const url = 'https://kfuuodwhihhnhxwkjxwe.supabase.co'
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10000)

;(async () => {
  try {
    console.log('Testing fetch to:', url)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    console.log('Fetch successful. status:', res.status)
    console.log('Server IPs resolved (headers may include via):')
    console.log(Object.fromEntries(res.headers))
  } catch (err) {
    console.error('Fetch failed:')
    console.error(err)
  } finally {
    clearTimeout(timeout)
  }
})()
