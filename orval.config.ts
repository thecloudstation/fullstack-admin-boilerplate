// To generate: start the backend (`npm run dev:server`), then run `npm run api:generate`.
// The backend must be running so Orval can fetch the live OpenAPI spec.

import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: 'http://localhost:3100/api/doc',
    output: {
      workspace: './src/lib/api',
      target: './generated.ts',
      client: 'react-query',
      mode: 'single',
      override: {
        mutator: {
          path: './custom-fetch.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
