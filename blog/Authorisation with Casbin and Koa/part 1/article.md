---
title: Authorisation with Casbin and Koa Part 1
description: In this post we will talk about getting started with Casbin and how to create authorisation policies.
published: false
tags: JavaScript, Auth
cover_image: images/header.png
---

This series of posts is an introduction on how you can add [Casbin](https://casbin.org/) to your [Koa](https://koajs.com/) application. However, before we get started I would like to add a disclaimer, I am not a security expert and you should definitely have someone who knows about security on the web to look over your policies before implementing them in production.

## Casbin

Casbin is an open-source authorisation library that supports pretty much all of the access control models and a whole range of programming languages. There is a really useful [online editor](https://casbin.org/en/editor) where you can select your access control model and create access policies to test out what will and will not work for your project.

> **Note**: Casbin is an authorisation library, not an authentication library. I.e. There is no username and password verification or storage. You would need to use a different library to do that.

## RBAC

In this post we will design a (sort of) role based access control policy in Casbin. In the next post of this series we will implement these policies as Koa middleware in our application. There are two things that we need in order to get our policies working a configuration file and a policy file.

The configuration file is where we will define how Casbin should act on our `subject`, `object` and `action`. In the policy file we will define what the `subject`, `object` and `action` for each user type will be. In order to do this, let's talk about what we actually want to authorise first.

We will have three types of users, normal users, anonymous users, and admin users. We will define their roles as `user`, `anonymous` and `admin`. We will need to define the permissions for these users based on what endpoints and actions they can perform. Let's make up some rules:

- All endpoints containing `/admin` can only be accessed by admin users.
- All endpoints that do not contain `/admin` can be accessed by normal users.
- Anonymous users can only access the endpoint to create a user, after which they will become a user.

### Config definition

Our config definition will look as follows:

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = r.sub == p.sub && regexMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
```

What do these things mean?

- `request_definition`: This is the definition of what we will receive in each request, i.e. the `subject`, `object` and `action`.
- `policy_definition`: This is how we will define each policy in our policy file, each policy will also have a `subject`, `object` and `action` as well as an `effect` where we will define whether this is an `allow` or a `deny` policy.
- `policy_efect`: This is where we define our function that determines the effect of each policy. Our function is checking the policies which are allowed and not denied.
- `matchers`: In order to determine whether a policy matches the request we use the matcher function definition. In our case we are using a direct comparison of the subject and a `regexMatch` on both the object and the action.

## Policy definition

Let us write our policies and then the last two will make a little bit more sense. As we said in the policy definition we will be defining our policies ad `subject, object, action, effect`. We just need to add a `p` in front so that our config can recognise it as a policy. Ours will look as follows:

```
p, admin, ^/[a-z\-]*/admin, (GET)|(PUT)|(POST)|(DELETE)|(OPTIONS), allow
p, anonymous, ^/user/?$, (POST), allow
p, user, ^/[a-z]+, (GET)|(PUT)|(POST)|(DELETE)|(OPTIONS), allow
p, user, ^/[a-z\-]*/admin, (GET)|(PUT)|(POST)|(DELETE)|(OPTIONS), deny
```

These four policies should be enough to cater for the rules we defined earlier. Try this out in the [online editor](https://casbin.org/en/editor) to see it working.

## Summary

That is all we need for setting up our policies using Casbin. If you would like to read more about how to create the configurations and policies take a look at the Casbin getting started documentation. There are also a lot of different implementations available for different languages in the [Casbin GitHub repository](https://github.com/casbin). In the next post we will talk about how to add these policies into our Koa middleware.
