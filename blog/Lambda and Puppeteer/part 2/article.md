---
title: Puppeteer in an AWS Lambda Function Part 2
description:
published: false
tags: JavaScript, AWS, Lambda, Puppeteer
cover_image: images/header.jpg
---

In [my previous post](https://dev.to/gerybbg/puppeteer-in-an-aws-lambda-function-part-1-1935) I talked a little bit about how you can get started with running a puppeteer script in an AWS Lambda function. Using the `puppeteer-core` and `chrome-aws-lambda` libraries, you can get your code down to a size that will fit into the 50MB limit.

This is a relatively good solution, that will work for most cases. However, there are some drawbacks:

- If your code becomes a bit more complex you might end up exceeding the limit.
- You might have multiple functions that require puppeteer.
- Every time you make a change to some of your code, you have to re-upload everything to AWS. This can take some time as these libraries are still more than 40MB in size.

Lucky for us, there is one solution to all 3 of these problems, we use layers. In this post, I will take you through extracting the two libraries required to run puppeteer, into an AWS Lambda layer and using this layer inside your function.

## Creating your layer

The `puppeteer-core` library is dependent on the `chrome-aws-lambda` library as that is what installs the chromium bin file that is needed. This is why we move both of them into one layer. I found that even though our Lambda function can interact with the libraries inside a layer as if they were in its own `node_modules` folder, the libraries themselves do not interact with each other in the same way. Which means that leaving `puppeteer-core` in our Lambda function and only moving `chrome-aws-lambda` will not work. (This was discovered by trial and error 😅).

The easiest way to do this is to create a new folder for your layer and add a `package.json` with the two libraries as dependencies. Since these are node libraries, AWS requires them to be inside a folder called `nodejs`, so our folder structure would be `layer/nodejs/package.json` and the file would look something like this:

```json
{
  "name": "puppeteer-layer",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "create-layer": "pushd ../../ && rm -rf layer.zip && popd && npm i && cd ../ && zip -r ../layer.zip *"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "chrome-aws-lambda": "^5.3.1",
    "puppeteer-core": "^5.3.1"
  }
}
```

We have one script in our `package.json` file, it will create the zip file that we will upload to our layer in AWS. We now run `npm run create-layer` and upload our file using the AWS management console. Go to the console and log in, select _Lambda_, from the side menu select _Layers_, click on _Create layer_ fill in all of the details and upload the zip file.

> **Another note on running locally**: Once you've moved these dependencies out of your Lambda function's `package.json` you might struggle to run this locally. Putting them into the dev dependencies is the easiest way to get around this problem.

## Using your layer

The nice thing here is that none of your code has to change, just remember to remove those dependencies (or make them dev dependencies). Upload your new Lambda function without the dependency on `puppeteer-core` and `chrome-aws-lambda` and then we can tell it about the layer. In the console, select your function, and select _Layers_, you will see an empty list of layers. Click on _Add a layer_, select the _Custom layers_ option and your newly created layer should appear in that list. Once added, everything should work as it did before.

> **Note**: One last thing to keep in mind is that a layer is also limited to 50MB size, which means that you will not be able to move all of your dependencies to a single layer if they exceed this size. However, you can create and use more than one layer in your Lambda function.

## Conclusion

Now that we have a layer we can easily create multiple functions that use these libraries and not worry about the size of our own code. We can also update our code much easier, since we would have a much smaller zip file to work with.
