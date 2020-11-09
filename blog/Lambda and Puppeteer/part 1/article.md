---
title: Puppeteer in an AWS Lambda Function Part 1
description:
published: false
tags: JavaScript, AWS, Lambda, Puppeteer
cover_image: images/header.png
---

[Puppeteer](https://pptr.dev/) is a really useful tool, it provides us with a way to access the Chrome (or Chromium) [DevTools protocol](https://chromedevtools.github.io/devtools-protocol/) inside our Node.js code. It can be used for many different things, such as testing, generating pre-rendered content, automating form submissions, etc. The one problem with puppeteer is that it requires some resources to run, which makes sense, since it starts up a browser instance and runs through all the actions you have told it to as if a person was doing it.

Until recently, I had only ever run puppeteer locally, which is pretty easy to set up and debug. However, when you want to automate some of these processes, it becomes a bit more challenging. I did some research, and found out that my best option, for AWS at least, was to run my process inside a Lambda function. In this way all of the resources would be isolated and when the function is stopped everything will be cleaned up and deleted.

There was only one problem left to solve, how do we make sure that we do not exceed the 50MB limit of a Lambda function. This was quite a big one, considering the puppeteer library itself is around 300MB due to the fact that it installs a browser with it. In this post, I'd like to take you through what libraries you will need in order to be able to use puppeteer inside a Lambda function.

## Using `puppeteer-core`

This [core package](https://www.npmjs.com/package/puppeteer-core) allows us to install the core tools of puppeteer without installing a browser. It's great for this because it is only around 2MB.

Although, when using `puppeteer-core` we still don't have a browser for our Lambda function. Not to worry, there's a solution for this problem too, the `chrome-aws-lambda` package, which can also be [installed using npm](https://www.npmjs.com/package/chrome-aws-lambda) was made for this.

Once you have both these packages installed, setting up puppeteer inside your Lambda becomes relatively easy. Your code will look something like this:

```js
const chromium = require('chrome-aws-lambda');

export const handler = async (event, context, callback) => {
  let result = 'result';
  let browser;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    // all your puppeteer things
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};
```

The next step is to zip the whole thing up and upload it to an AWS Lambda function. Even with these reduced size packages, the zipped file is still around 40MB. This means that you will not be able to see the code when opening the function in the AWS web console, so you will have to do all your debugging locally.

> **A note on running locally**: If you need to run this Lambda locally to test it, you will still need to use the main puppeteer package. You could either install it globally, or install it as a dev dependency in your project (recommended).

> **A note on the `aws-sdk`**: Keep in mind that Lambda functions have access to all of the `aws-sdk` features, so you don't have to install that as another package. This would take up too much space in your allocated 50MB. If you need to test locally you can add this to your dev dependencies as well.

## Conclusion

That's the first part of getting puppeteer into a Lambda function. We managed to accomplish most of our goal, by using other tools created for this exact purpose. In my next post I will cover what can be done if you still exceed the 50MB limit.
