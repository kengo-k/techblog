---
title: "Automatically Deploy Local Applications with watchtower"
date: 2025-07-25
tags: [DevOps]
description: "Notes for automatically deploying container applications on QNAP Container Station at home"
toc: false
---

I recently discovered a tool called `watchtower`. Apparently, it monitors container registries and automatically redeploys when new images are detected. I use a QNAP NAS at home, which has an app called Container Station that allows you to easily run Docker containers on the NAS. I operate several applications on Container Station that are only for my personal use, not intended to be shown to others.

Honestly, nowadays you can use services like Vercel to automatically deploy just by pushing to GitHub, so there might not be much demand for this. However, not everyone wants to make everything public, and I felt it would be convenient to be able to deploy easily at home with just a git push using this tool. I thought it might be useful for someone, so I'll leave it as a memo.

Note that `watchtower` is officially recommended for use in local environments like home labs, and it's generally better to avoid using it in production environments.

## Overall Flow

The automatic deployment mechanism will follow this flow:

1. Develop applications on GitHub
2. Define workflows in GitHub Actions to build images and push to GitHub Container Registry (GHCR) when merging to main
3. Create applications in Container Station using docker-compose.yml
4. The watchtower container on Container Station detects new images and automatically deploys

## 1. Application Creation

First, about the application. Since this is not the main topic of this article, you can create whatever you want, but I'll include a simple example.

```js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello, World!",
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

A simple API server using express. The package.json is as follows:

```json
{
  "name": "simple-api-server",
  "version": "1.0.0",
  "description": "Simple API server",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

Next, create a Dockerfile with the following content to create an image for deployment:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 2. GitHub Actions Configuration

Create a GitHub Actions workflow to automatically build and push images to GHCR when code is pushed.

**.github/workflows/build.yaml**: The filename part (build.yaml) is arbitrary. The directory is fixed.

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

The work on the GitHub repository ends here. When the above content is pushed to the main branch, the workflow will be executed. This will build the image described in the Dockerfile and push it to GHCR.

If the built image is registered in the `Packages` tab on GitHub, it's successful.

## 3. Deployment in Container Station

Now that the deployment preparation is complete, let's deploy the application to your home Container Station.

First, you need to set up authentication information for GHCR on Container Station. Add a "Custom Registry" from the "Registry" menu (only Docker Hub is displayed by default).

Set the following:

- URL: https://ghcr.io
- Authentication: ON
- Username: GitHub account name
- Password: Access token

Create a token from GitHub Settings → Developer settings → Personal access tokens → Tokens(classic) and grant `read:packages` permission.

Once the custom registry setup is complete, enter the following docker-compose.yaml content in Container Station:

```yaml
version: "3.8"

services:
  app:
    image: ghcr.io/kengo-k/simple-api-server:latest
    container_name: simple-api-server
    restart: always
    ports:
      - "8888:3000" # ← Change according to your app's LISTEN port

  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: always
    volumes:
      # Allow container to communicate with host Docker daemon
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - REPO_USER="your github account"
      - REPO_PASS="your github access token" # Use the same token as configured above
    command: >
      --cleanup           # Automatically delete old images
      --interval 180      # Poll every 180 seconds
      simple-api-server   # Target container name to monitor
```

The key point is mounting the Docker socket with volumes to use the QNAP host's Docker daemon. Also, specify the target container name in the command. Note that while it may seem redundant to specify authentication information in docker-compose.yaml (in the watchtower container settings) when you've already set up authentication information for GHCR on Container Station, this is because authentication is required in two places:

- Container Station uses authentication information when retrieving the app container's image
- The watchtower container uses authentication information when retrieving the latest image of the app container

Create the application in Container Station with the above content, and if the containers (app container and watchtower container) start successfully, it's a success.

※ **Never commit this docker-compose.yaml to GitHub** as it contains access tokens.

## Verification and Summary

Once the setup is complete, let's verify that the automatic deployment actually works. Edit the application source code and push it to GitHub. When the workflow starts and a new image is pushed to GHCR, the watchtower container will automatically deploy the app container with the latest image (try changing some string in the application to verify that the display content is updated).

This completes the mechanism where your home Container Station application automatically updates with just a git push. You can now achieve easy automatic deployment at home without external services like Vercel.
