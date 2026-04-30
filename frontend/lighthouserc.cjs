module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 15000,
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/login',
        'http://localhost:4173/register',
      ],
      numberOfRuns: 1,
      chromeFlags: '--no-sandbox --disable-gpu --headless',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['error', { minScore: 0.7 }],
        'categories:best-practices': ['warn', { minScore: 0.7 }],
        'categories:seo': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
