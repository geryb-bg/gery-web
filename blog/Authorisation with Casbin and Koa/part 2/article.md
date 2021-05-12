---
title: Authorisation with Casbin and Koa Part 2
description: In the second post of this series, I'd like to tell you a little bit about how to add the Casbin middleware to your Koa application.
published: false
tags: JavaScript, Auth
cover_image: images/header.png
---

In the [first part](https://dev.to/gerybbg/authorisation-with-casbin-and-koa-part-1-2gh) of this series of posts we spoke about how to setup the Casbin policies and configuration. Now that we have that working and we have tested it in the [online editor](https://casbin.org/en/editor) we are ready to add it as middleware to our [Koa](https://koajs.com/) application.

> **Note**: I am using Koa as an example here since this is what I am used to. If you prefer using Express or another framework for node, you will need to change the below examples a little bit in order for it to work.

## Koa

Koa is a web framework for nodejs, it was designed by the same team that created Express. It was built in a way to make it smaller and more robust. However, we are not here to discuss which web framework to use, we just want to talk about authorisation.

There are already a few different libraries that contain Koa and Casbin middleware, but it is also pretty easy to build your own. This is what we are going to do now.

## Node-Casbin

The first thing we need to do is install the [Node-Casbin](https://github.com/casbin/node-casbin) library into our project, we will do this using `npm` with the following command:

```shell
$ npm install casbin --save
```

## The middleware

Now that we have Casbin installed we can use the Casbin enforcer in a middleware function to check the request against our policies and return a `403` if the request is not allowed. We do this as follows:

```js
export function authorisation(enforcer) {
  return async (ctx, next) => {
    const role = '<extract role from authentication middleware>';
    const path = ctx.request.path;
    const method = ctx.request.method;

    const authorised = await enforcer.enforce(role, path, method);
    if (!authorised) {
      ctx.status = 403;
      return;
    }

    await next();
  };
}
```

- `const role = '<extract role from authentication middleware>';` - this line will need to be replaced with whatever function can extract the current user's role. Assigning roles to users is out of scope for this article, otherwise we might be here for another few weeks.
- `const authorised = await enforcer.enforce(role, path, method);` - this is the line that does all of the work, it uses the Casbin enforcer to check the role (`subject`), path (`object`) and method (`action`) agains the policies we defined in the previous post.

## Using the middleware

In the setup of our Koa application we will need to create a Casbin enforcer and use it in the app middleware.

1. The first step for this is to import the `newEnforcer` function from node-casbin:

   `import { newEnforcer } from 'casbin';`

   OR

   `const { newEnforcer } = require('casbin');`

2. Next we need to create an enforcer with the configuration file (`model.conf`) and policy file (`policy.csv`) we created in the previous post:

   `const enforcer = await newEnforcer('path/to/model.conf', 'path/to/policy.csv');`

3. And finally we use our middleware (where the `app` below id your Koa application):

   `app.use(authorisation(enforcer));`

## Summary

You should now be able to run your Koa application and test out the authorisation policies we set up in the previous post. In the last post in this series we will talk about an easy way to skip this authorisation Koa middleware for certain paths. Thanks again for reading.
