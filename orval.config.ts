import { defineConfig } from "orval"

export default defineConfig({
  "ubumonitor-analytics": {
    output: {
      mode: "tags-split",
      target: "./src/services",
      schemas: "./src/model",
      client: "fetch",
      baseUrl: "http:///localhost:9090",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/orvalFetch.ts",
          name: "orvalFetch",
        },
      },
    },
    input: {
      target: "./open-api/api-docs.yaml",
    },
  },
})
