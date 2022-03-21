# Abstract Play Front-End Client

[![Build Status](https://travis-ci.com/AbstractPlay/front.svg?branch=master)](https://travis-ci.com/AbstractPlay/front)

This is the official browser client of Abstract Play

## Contributing

## Contact

The [main website](https://www.abstractplay.com) houses the development blog and wiki.

## Develop

- Clone the repo.
- Clone and build https://github.com/AbstractPlay/renderer.git and https://github.com/AbstractPlay/gameslib.git.
- Make sure that COGNITO_ENDPOINT in src/config/global.js is pointing to "your" development AWS Cognito endpoint.
- Make sure the constants in src/config/dev.js has the correct setting for Cognito and the API gateway for the development back end.
- From the newly created folder, run the following commands:
  - `npm install` (installs dependencies)

## Deploy (mostly TBD)
  - `npm run dist-dev` (or `dist-prod` if you want it minified; bundles everything for the browser into the `./dist` folder)
