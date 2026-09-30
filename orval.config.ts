import { defineConfig } from "orval"

export default defineConfig({
  "ubumonitor-analytics": {
    output: {
      formatter: "prettier",
      mode: "tags",
      target: "./src/backend/services",
      schemas: "./src/backend/model",
      client: "fetch",
      baseUrl: "http:///localhost:9090",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/orvalFetch.ts",
          name: "orvalFetch",
        },
        fetch: { includeHttpResponseReturnType: false },
      },
    },
    input: {
      target: "./open-api/api-docs.yaml",
    },
  },
})
