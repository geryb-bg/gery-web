---
title: Puppeteer in an AWS Lambda Function Part 2
description:
published: false
tags: JavaScript, AWS, Lambda, Puppeteer
cover_image: images/header.jpg
---

In [my previous post](https://dev.to/gerybbg/puppeteer-in-an-aws-lambda-function-part-1-1935) I talked a little bit about how you can get started with running a puppeteer script in an AWS Lambda function. Using the `puppeteer-core` and `chrome-aws-lambda` lambda packages, you can get your code down to a size that will fit into the 50MB limit.

This is a relatively good solution, that will work for most cases. However, there are some drawbacks:

- If your code becomes a bit more complex you might end up exceeding the limit.
- You might have multiple functions that require puppeteer.
- Every time you make a change to some of your code, you have to re-upload everything to AWS. This can take some time as these libraries are still more than 40MB in size.

Lucky for us, there is one solution to all 3 of these problems, we use layers. In this post, I will take you through extracting the two libraries required to run puppeteer into an AWS Lambda layer and using this layer inside your lambda function.

## Creating your layer

// TODO

> **Another note on running locally**: Once you've moved these dependencies out of your Lambda function's package.json you might struggle to run this locally. Putting them into the dev dependencies is the easiest way to get around this problem.

## Using your layer

Once you've created your layer in the AWS Management Console and uploaded the zip file you can use it in your Lambda function by

## Conclusion

Now that we have a layer we can easily create multiple functions that use these libraries and not worry about the size of our own code. We can also update our code much easier, since we would have a much smaller zip file to work with.
