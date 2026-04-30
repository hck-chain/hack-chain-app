module.exports = {
  ci: {
    collect: {
      // Build the app first and serve it
      startServerCommand: 'npm run build && npm run preview -- --port 4173',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/login',
        'http://localhost:4173/register',
      ],
      numberOfRuns: 3, // Run 3 times to reduce variance
      chromeFlags: '--no-sandbox --disable-gpu --headless',
    },
    assert: {
      preset: 'lighthouse:recommended',
    },
    upload: {
      target: 'temporary-public-storage', // Upload reports to a temporary public URL for easy viewing
    },
  },
};
