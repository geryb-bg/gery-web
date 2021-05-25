---
title: Authorisation with Casbin and Koa Part 3
description: Here we will talk about adding exceptions to your Casbin policies by introducing another middleware to our Koa application.
published: false
tags: JavaScript, Auth
cover_image: images/header.jpg
---

In the [first](https://dev.to/gerybbg/authorisation-with-casbin-and-koa-part-1-2gh) part of this series of posts we set up some configuration and a few Casbin policies that we based on a set of defined rules. In the [second](https://dev.to/gerybbg/authorisation-with-casbin-and-koa-part-2-2io5) part we talked about adding these policies to our Koa application as middleware. In this third and last post I'd like to talk a little bit about how you can add exceptions to these rules.

Today we are going to talk about introducing another set of middleware to our Koa application that will enable us to skip the authorisation middleware that we added with Casbin when certain conditions are met.

Why would we want to do this? Every application ends up with some exceptions to the rules. In this case, you may have an endpoint that does not require any authentication or authorisation. So if we look at our rules that we created in the first post:

- All endpoints containing `/admin` can only be accessed by admin users.
- All endpoints that do not contain `/admin` can be accessed by normal users.
- Anonymous users can only access the endpoint to create a user, after which they will become a user.

Say, for example, we now want to add a new endpoint called `/promotions`. All users should be able to access this endpoint, even if they have not registered or if an anonymous account has not been created for them. It would be really difficult to add a rule like this to the Casbin policies, so instead, we create a new middleware that would skip checking the policies for this endpoint.

## The exceptions

We will first create an object that will store all of the endpoints that we would like to add exceptions for, it can look something like this:

```js
const noAuthEndpoints = {
  promotions: {
    path: `^\/promotions$`,
    method: 'GET',
  },
};
```

As you can see I am also specifying the method that is allowed. This will ensure that we only allow very specific endpoints here. We do not want to accidentally allow something we are not supposed to.

## The middleware

Now we can create our middleware to check if the incoming request matches any of the exceptions, it would look something like this:

```js
export function shouldSkipAuth(requests, contextRequest) {
  for (const requestKey of Object.keys(requests)) {
    const request = requests[requestKey];
    const regex = new RegExp(request.path);

    if (regex.test(contextRequest.path) && request.method === contextRequest.method) {
      return true;
    }
  }
  return false;
}

export function authExceptions(requests, middleware) {
  return async (ctx, next) => {
    if (shouldSkipAuth(requests, ctx.request)) {
      return await next();
    }

    return await middleware(ctx, next);
  };
}
```

We are testing every item in the object we created to see if any of them match our request. If yes, then we just run the next action. If no, we run the middleware that is passed into the function.

## Using the middleware

If you remember from last weeks article, in order to use the middleware in our Koa application we had something that looked like this:

```js
app.use(authorisation(enforcer));
```

We will now take this line and change it a little to use our exceptions middleware, the final result will look like this:

```js
app.use(authExceptions(noAuthEndpoints, authorisation(enforcer)));
```

Running the Koa application should now allow you to access the new endpoint without having a user or role, and all of the previous rules should still apply.

## A note on testing

A very important next step here is adding tests that will ensure that these rules behave exactly as they are supposed to. You should try have a test for every positive and negative case for each new rule that you add. This should be both the policy rules we created in Casbin as well as the exception rules we created in this post.

## Summary

Casbin is a really nice tool and works well with Koa middleware. In these series of posts the examples we created are relatively simple cases, but they are a good starter for getting used to creating authorisation policies. A lot more can be done here to make your application really secure.
