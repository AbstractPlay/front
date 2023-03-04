# Abstract Play Front-End Client

[![Build Status](https://travis-ci.com/AbstractPlay/front.svg?branch=master)](https://travis-ci.com/AbstractPlay/front)

This is the official browser client of Abstract Play

## Contributing

## Contact

The [main website](https://www.abstractplay.com) houses the development blog and wiki.

## Develop

- Clone the repo.
- Clone and build https://github.com/AbstractPlay/renderer.git and https://github.com/AbstractPlay/gameslib.git.
- For local development make sure the constants in src/config/local.js has the correct setting for Cognito and the API gateway for the development back end.
- From the newly created folder, run the following commands:
  - `npm install` (installs dependencies)
- If you make changes to renderer or gameslib, you need to reinstall the dependency. E.g. for version 0.8.0 of renderer:
  - `npm uninstall @abstractplay/renderer`
  - `npm install ..\renderer\abstractplay-renderer-0.8.0.tgz`
- After you have node-backend (https://github.com/AbstractPlay/node-backend) deployed you can debug locally with `npm start`.

## Deploy to AWS
  - Install AWS-CLI. See https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
  - If you are using VSCode it is probably a good idea to install the AWS Toolkit for VSCode. See: https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/setup-toolkit.html
  - Make sure you have your AWS credentials "installed". See: https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/setup-credentials.html
  - Use the profile names AbstractPlayDev and AbstractPlayProd.
  - Make sure serverless is installed: `npm install -g serverless`
  - For the very first deployment (in order to set up the S3 bucket and the CloudFront distribution), run `serverless deploy` and 
    `serverless --stage prod deploy`
  - Now find the distribution ids (e.g. through the AWS console > CloudFront) and copy to the invalidate and invalidate-prod npm scripts in package.json.
  - Now you should deploy with `npm run full-dev` (or `full-prod`).
