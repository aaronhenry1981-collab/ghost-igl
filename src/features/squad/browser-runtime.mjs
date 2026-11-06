// Match the existing website's browser compatibility bootstrap before the
// standalone app can dynamically import its shared Cognito SDK. These aliases
// contain no identity, token, authorization or Node capability.
if (typeof globalThis.global === 'undefined') globalThis.global = globalThis
if (typeof globalThis.process === 'undefined') globalThis.process = { env: {} }
