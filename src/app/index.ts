import ky from "ky"

export function healthCheck() {
  return ky.get("http://localhost:9090/actuator/health", {
    retry: {
      limit: 100,
      delay: () => 250,
    },
  })
}
