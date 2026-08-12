import { Buffer } from "buffer";

// aws-amplify / amazon-cognito-identity-js expect Node globals in the browser.
window.global = window;
window.Buffer = Buffer;
