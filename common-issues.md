# Common Issues and Solutions

## ERR_REQUIRE_ESM Error with Firebase Emulators

### Error Message

```
node:internal/modules/cjs/loader:986
throw new ERR_REQUIRE_ESM(filename, true);
^

Error [ERR_REQUIRE_ESM]: require() of ES Module /Users/XXXXX/.cache/firebase/emulators/ui-v1.11.8/server/server.mjs not supported.
Instead change the require of /Users/XXXXX/.cache/firebase/emulators/ui-v1.11.8/server/server.mjs to a dynamic import() which is available in all CommonJS modules.
at Function.runMain (pkg/prelude/bootstrap.js:1979:12) {
code: 'ERR_REQUIRE_ESM'
}

Node.js v18.5.0
```

### Solution

This error occurs specifically when Firebase Tools is installed via the curl script (firebase.tools). To resolve this:

1. Remove existing Firebase Tools installation:

```bash
sudo rm -rf /usr/local/bin/firebase
```

2. Choose one of these installation methods:

```bash
# Using npm (recommended)
npm install -g firebase-tools

# Using Homebrew (for macOS users)
brew install firebase-cli
```

3. Verify the installation:

```bash
firebase --version
```

### Why This Works

When installed via firebase.tools (curl script), the CLI comes bundled with Node.js to allow running without Node.js being pre-installed. A recent release of the emulator UI added a require() of an ES module, which is incompatible with the bundled Node.js configuration. Installing through npm or Homebrew uses your system's Node.js installation instead of the bundled version, avoiding the ESM compatibility issue.

Source: [Firebase Tools Issue #6931](https://github.com/firebase/firebase-tools/issues/6931)
