# Docs repository integration

Integration with the [AbstractPlay/docs](https://github.com/AbstractPlay/docs) repository:

- Submodule: `vendor/front` → `https://github.com/AbstractPlay/front.git` (`develop` / `main`)
- Prebuild: `syncDocs("front", "front", false)`
- Site nav: **Front** section at `/front/`
- Deploy workflows fetch `vendor/front` with other vendor submodules

Local prebuild falls back to a sibling `../front` checkout when the submodule does not yet contain `/docs` (e.g. before docs land on `develop`).

Published URL prefix: `/front/` (e.g. `/front/getting-started/`).
