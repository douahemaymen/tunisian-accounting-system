export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Skip API route pre-rendering during build
    process.env.SKIP_API_PRERENDER = 'true';
  }
}
