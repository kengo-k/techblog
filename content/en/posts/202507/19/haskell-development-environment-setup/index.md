---
title: "Haskell Development Environment Setup Guide"
date: 2025-07-19
tags: ["Haskell"]
description: "A complete guide to setting up a Haskell development environment from scratch, including development tools, auto-formatting, and pseudo hot-reload functionality."
draft: true
---

I've always been fascinated by Haskell and functional programming (it's pretty cool, right?), and I actually studied it about 10 years ago but ended up abandoning it halfway through. Now with AI available, I think it's the perfect time to give it another shot. So I'm starting with setting up a development environment and documenting the process.

This time, I don't want to just study and quit—I want to put it into practice by building web applications. My goal is to get a Web API using Servant up and running, while also setting up an efficient development environment in the editor.

## Understanding Haskell Development Tools

Since I don't know anything about the standard tools commonly used in the Haskell ecosystem, let me start there. First, the compiler: we use something called `GHC`. This is essentially the only choice for Haskell compilers. For build tools, there are mainly `Cabal` and `Stack`. When I ask AI to set up environments, it sometimes generates configurations using `Stack`, but `Cabal` is the newer approach, so it's better to use `Cabal` for new environment setups.

There's also `GHCup` which is recommended for integrated tool management. This is like the Haskell version of `pyenv` or `nvm` that allows you to manage and switch between different versions. So to summarize, the current recommended setup is:

| Tool      | Role                 | Description                                  |
| --------- | -------------------- | -------------------------------------------- |
| **GHCup** | Toolchain Management | Unified management of GHC, Cabal, HLS, etc.  |
| **GHC**   | Compiler             | Converts Haskell code to machine code        |
| **Cabal** | Build System         | Project building and dependency management   |
| **HLS**   | Language Server      | Editor completion, type checking, formatting |

## Haskell Build Environment Setup

I'm using Mac, so these instructions are Mac-specific.

Haskell uses a C compiler under the hood during compilation. On Mac, it typically uses `clang`, which should already be installed if you have Command Line Tools. If not installed, run:

```text
xcode-select --install
```

Now that the prerequisites are ready, let's set up the build environment. First, install GHCup.

```text
# Install GHCup (with recommended tools)
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | \
  BOOTSTRAP_HASKELL_NONINTERACTIVE=1 \
  BOOTSTRAP_HASKELL_GHC_VERSION=9.10.1 \
  BOOTSTRAP_HASKELL_CABAL_VERSION=3.14.1.0 \
  BOOTSTRAP_HASKELL_INSTALL_HLS=1 sh
```

After installation, make sure the ghc command is available by setting up the PATH.

```text
# Add to PATH
echo 'export PATH="$HOME/.ghcup/bin:$PATH"' >> ~/.zshrc
# Update shell configuration
source ~/.zshrc
# Verify installation
ghc --version     # Should show 9.10.1
cabal --version   # Should show 3.14.1.0
```

Next, create a project. Create a directory and run `cabal init` (the haskell-api part can be any name you prefer).

```text
# Create project directory
mkdir haskell-api
cd haskell-api

# Initialize Cabal project
cabal init --non-interactive \
           --package-name=haskell-api \
           --version=1.0.0 \
           --language=GHC2024 \
           --application-dir=app \
           --source-dir=src
```

After execution, you'll have a directory structure like this:

```text
$ tree .
.
├── app
│   └── Main.hs
├── CHANGELOG.md
└── haskell-api.cabal
```

`haskell-api.cabal` is the project's build configuration file where dependencies and compilation options are defined. Think of it like Node.js's `package.json`. Edit this file to add the libraries you'll use. Note that there's no automatic mechanism like `npm install` to add dependencies for you.

```text
cabal-version: 3.0
name: haskell-api
version: 1.0.0
synopsis: haskell api example
build-type: Simple

library
    exposed-modules: Api
    build-depends:
        base >=4.20.0.0 && <4.21,
        text >=2.1 && <2.2,
        aeson >=2.2.3.0 && <2.3,
        servant >=0.20.2 && <0.21,
        servant-server >=0.20.2 && <0.21,
        warp >=3.4.1 && <3.5
    hs-source-dirs: src
    default-language: GHC2024
    ghc-options: -Wall

executable haskell-api
    main-is: Main.hs
    build-depends:
        base >=4.20.0.0 && <4.21,
        haskell-api,
        servant >=0.20.2 && <0.21,
        servant-server >=0.20.2 && <0.21,
        warp >=3.4.1 && <3.5
    hs-source-dirs: app
    default-language: GHC2024
    ghc-options: -Wall -threaded -rtsopts -with-rtsopts=-N

test-suite haskell-api-test
    type: exitcode-stdio-1.0
    hs-source-dirs: test
    main-is: Spec.hs
    build-depends:
        base >=4.20.0.0 && <4.21,
        haskell-api,
        hspec >=2.11.9 && <2.12
    default-language: GHC2024
    ghc-options: -Wall -threaded -rtsopts -with-rtsopts=-N
```

Additionally, create a `cabal.project` file to specify compiler version and optimization settings.

```text
packages: .

-- Compiler version specification
with-compiler: ghc-9.10.1

-- Build settings
tests: True
optimization: True
jobs: $ncpus

-- Development warning settings
package *
  ghc-options: -Wall -Wcompat -Wredundant-constraints
```

Now let's create the source code files.

**src/Api.hs** - API Definition

```haskell
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Api where

import Data.Aeson (ToJSON)
import Data.Text (Text)
import GHC.Generics (Generic)
import Servant

-- Data type definition
data Message = Message
  { content :: Text
  , author :: Text
  } deriving (Eq, Show, Generic)

instance ToJSON Message

-- API type definition
type MessageAPI = "messages" :> Get '[JSON] [Message]

-- Sample data
sampleMessages :: [Message]
sampleMessages =
  [ Message "Hello, Haskell!" "Alice"
  , Message "Servant is great!" "Bob"
  ]

-- Handler implementation and API definition
messageAPI :: Proxy MessageAPI
messageAPI = Proxy

server :: Server MessageAPI
server = return sampleMessages
```

**app/Main.hs** - Application Entry Point

```haskell
module Main where

import Network.Wai.Handler.Warp (run)
import Servant

import Api

main :: IO ()
main = do
  putStrLn "🚀 Starting Haskell API server..."
  putStrLn "📍 http://localhost:8080"
  run 8080 (serve messageAPI server)
```

**test/Spec.hs** - Test Suite

```haskell
module Main where

import Test.Hspec

main :: IO ()
main = hspec $ do
  describe "Basic tests" $ do
    it "addition works correctly" $
      2 + 2 `shouldBe` 4

    it "list length is correct" $
      length [1, 2, 3] `shouldBe` 3
```

Now that the application is implemented, let's build and run it.

```text
# Update dependencies and build
cabal update
cabal build

# Run tests
cabal test

# Fix dependency versions (recommended)
cabal freeze

# Start application
cabal run haskell-api
```

Running `cabal freeze` generates a `cabal.project.freeze` file. This file records the specific versions of dependencies, serving the same role as Node.js's `package-lock.json`. This ensures that all team members use the same dependency versions and guarantees reproducible builds.

Access `http://localhost:8080/messages` in your browser to verify that messages are displayed.

## VS Code Integration

First, install the Haskell extension. Search for "Haskell" in the extensions list and you should find the one named "haskell.haskell" at the top. Then configure `.vscode/settings.json` with the following content:

```json
{
  "haskell.formattingProvider": "fourmolu",
  "haskell.manageHLS": "GHCup",
  "haskell.serverExecutablePath": "/Users/$USER/.ghcup/bin/haskell-language-server-wrapper",
  "haskell.checkProject": true,

  "haskell.plugin.fourmolu.config.external": false,
  "haskell.plugin.hlint.diagnosticsOn": true,
  "haskell.plugin.eval.globalOn": true,

  "[haskell]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "haskell.haskell",
    "editor.tabSize": 2
  }
}
```

We're specifying `fourmolu` as the formatter. While other formatters exist, this seems to be the current de facto standard. We don't need to install it explicitly as it's built into HLS (Haskell Language Server), which was installed along with GHC via `ghcup`.

If HLS is running, automatic formatting will occur on file save. You can check if HLS is running by looking at the Output panel in VS Code and selecting Haskell. If it's not running, try restarting VS Code or opening the command palette with **Cmd + Shift + P** and executing `Haskell: Restart Haskell LSP Server`.

## Pseudo Hot-Reload Setup

In web application development, it's tedious to manually check compilation errors every time you change code. In Haskell, you can use a tool called `ghcid` to monitor file changes and automatically compile and restart. Since true hot-reload means reloading without stopping the application, I'm calling this "pseudo" hot-reload.

First, install `ghcid`. This is a development tool, so install it globally.

```text
cabal install ghcid
```

After installation, a binary is created at `~/.cabal/bin/ghcid`, so make sure it's in your PATH.

Then run the following command in your project's root directory:

```text
ghcid \
  --command="cabal repl exe:haskell-api" \
  --test=":main" \
  --restart="src" \
  --restart="app"
```

This achieves the following behavior:

- **File monitoring**: Watches Haskell files in `src/` and `app/` directories
- **Automatic building**: Automatically compiles when files change
- **Server restart**: Re-executes main to restart the server
