# Shop AI Agent - Claude-powered Chat for Shopify Stores

A Shopify app that adds a Claude-powered AI chat interface to your store. This enables customers to ask questions and get intelligent responses about your products and services.

This app consists of:
1. A Shopify theme extension that adds a chat bubble to your store
2. A Vercel serverless function that connects to Claude AI

## Features

- Clean, modern chat interface that matches your store's design
- Powered by Claude AI for intelligent responses
- Maintains conversation context for natural interactions
- Easy to deploy and manage

## Getting started

### Requirements

1. You must [download and install Node.js](https://nodejs.org/en/download/) if you don't already have it.
1. You must [create a Shopify partner account](https://partners.shopify.com/signup) if you don’t have one.
1. You must create a store for testing if you don't have one, either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store).

### Deployment Steps

#### 1. Deploy the Vercel API

1. Fork or clone this repository
2. Create a `.env` file from `.env.example` and add your Claude API key
3. Install the Vercel CLI: `npm install -g vercel`
4. Deploy to Vercel:
   ```shell
   vercel login
   vercel
   ```
5. Follow the prompts to deploy
6. Note the deployment URL (e.g., `https://your-app-name.vercel.app`)

#### 2. Update the Chat API URL

1. Open `extensions/chatbot/assets/chat.js`
2. Replace the `apiUrl` with your Vercel deployment URL:
   ```javascript
   const apiUrl = 'https://your-app-name.vercel.app/api/chat';
   ```

#### 3. Deploy the Shopify Extension

1. Install dependencies: `npm install`
2. Connect to your Shopify Partner account: `npm run shopify auth`
3. Deploy the app to your development store:
   ```shell
   npm run dev
   ```
4. Open the URL generated in your console
5. Test the chat functionality on your development store

Open the URL generated in your console. Once you grant permission to the app, you can start using the Claude-powered chat on your store.

## Developer resources

- [Introduction to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [App extensions](https://shopify.dev/docs/apps/build/app-extensions)
- [Extension only apps](https://shopify.dev/docs/apps/build/app-extensions/build-extension-only-app)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
