---
title: "Using the codefile shortcode"
tags: ["Hugo", "Shortcode", "Go"]
description: "Embed real source code into your post at build time"
---

This post demonstrates how to embed actual repository code into a Hugo article using the `codefile` shortcode.

## Example: Go program

The shortcode below reads `examples/hello-go/main.go` and renders it with syntax highlighting.

{{< codefile src="examples/hello-go/main.go" >}}

---

### Range example: lines 3-5

{{< codefile src="examples/hello-go/main.go" lines="3-5" >}}
