# Better user auth for Node JS

This is some example/boilerplate code for creating an API with standard user auth using JWT (Javascript Web Tokens).

Create a free MongoDB Atlas Cluster: https://www.mongodb.com/cloud
1. Create a database user
2. Whitelist the IP `0.0.0.0` 
3. Copy the connection string (see env vars)

## Features/user stories:
- Register a new account
- Login and receive a JWT
- Sign out of all sessions (revokes JWTs)
- Change password while signed in
- Forgot password (send a reset link)
- Reset password (with a reset link)
- `verifyToken` for making sure a user is logged in

## Environment variables to set:

Create a file called `.env` and type in something like this:

```
DB_CONNECTION_STRING=mongodb+srv://Username:Password@cluster0-8c4js.mongodb.net/test?retryWrites=true&w=majority
TOKEN_SECRET=8cc2fea5d87129b6404ed866ab2a5c2a
```


## Find this useful?

Subscribe: https://www.youtube.com/channel/UC9_2rdTefiAnSpOz9NMe9QA

Donate: https://www.buymeacoffee.com/taimoorapps https://www.paypal.me/taimoorapps

Hire me: 33 USD/hr Node, React, Stripe. See my profile.