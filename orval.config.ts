import { defineConfig } from "orval"

export default defineConfig({
  "ubumonitor-analytics": {
    output: {
      formatter: "prettier",
      mode: "tags",
      target: "./src/shared/api/services",
      schemas: "./src/shared/api/model",
      client: "svelte-query",
      baseUrl: "",
      clean: true,
      override: {
        mutator: {
          path: "./src/shared/lib/orvalFetch.ts",
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
