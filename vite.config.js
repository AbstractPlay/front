import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { CONTENT_SECURITY_POLICY } from "./csp-policy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** CRA uses JSX in .js files; Vite expects .jsx unless we pre-transform. */
function jsxInJsFiles() {
  return {
    name: "jsx-in-js-files",
    async transform(code, id) {
      if (!/\/src\/.*\.js$/.test(id)) {
        return null;
      }
      return transformWithEsbuild(code, id, {
        loader: "jsx",
        jsx: "automatic",
      });
    },
  };
}

/** Inject production CSP on `vite build` (dev server omits CSP for HMR). */
function productionCsp() {
  return {
    name: "production-csp",
    apply: "build",
    transformIndexHtml(html) {
      if (html.includes("Content-Security-Policy")) {
        return html;
      }
      return html.replace(
        "<title>Abstract Play</title>",
        `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">\n    <title>Abstract Play</title>`
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const realMode = env.VITE_REAL_MODE ?? "local";

  return {
    plugins: [
      jsxInJsFiles(),
      react({
        include: /\.(jsx|js|tsx|ts)$/,
      }),
      productionCsp(),
    ],
    resolve: {
      alias: {
        buffer: "buffer",
        "@abstractplay/gameslib": path.resolve(
          __dirname,
          "node_modules/@abstractplay/gameslib/build/index.js"
        ),
      },
    },
    define: {
      global: "globalThis",
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.VITE_REAL_MODE": JSON.stringify(realMode),
    },
    server: {
      port: 3000,
      open: false,
      strictPort: true,
    },
    build: {
      outDir: "build",
      sourcemap: mode !== "production",
      assetsDir: "static",
      rollupOptions: {
        output: {
          entryFileNames: "static/js/[name]-[hash].js",
          chunkFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
    publicDir: "public",
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
      include: [
        "lodash",
        "lodash/merge",
        "buffer",
        "aws-amplify",
        "amazon-cognito-identity-js",
      ],
    },
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/**/*.{test,spec}.{js,jsx}"],
      setupFiles: ["src/setupTests.js"],
      clearMocks: false,
    },
  };
});
