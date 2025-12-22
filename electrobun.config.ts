export default {
  "app": {
    "name": "Suno Prompting App",
    "identifier": "com.factory.suno-prompting-app",
    "version": "0.1.0"
  },
  "build": {
    "bun": {
      "entrypoint": "src/bun/index.ts"
    },
    "views": {
      "main-ui": {
        "entrypoint": "src/main-ui/index.tsx"
      }
    },
    "mac": {
      "icons": "icon.iconset"
    },
    "copy": {
      "src/main-ui/index.html": "views/main-ui/index.html",
      "src/main-ui/dist.css": "views/main-ui/index.css"
    }
  }
}
