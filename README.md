Quickmin is a database administration administraon tool builder. It is build on top of [React-Admin](https://marmelab.com/react-admin/). It takes a configuration of
your database schema as a YAML file, and provides a UI as well as a RESTful api to acces your data, without any code needed. Quickmin can work as a standalone app, or as a middleware inside of a web app. It also performs automatic schema migration.

* [Getting Started](#getting-started)
* [Single Admin Authorization](#single-admin-authorization)
* [User and Role Based Authorization](#user-and-role-based-authorization)
* [Secure Views](#secure-views)

![image](https://github.com/limikael/quickmin/assets/902911/16956344-32cb-4f23-888c-01823be6d3fe)

## Getting Started

To get started, first install the `quickmin` command globally with:

```bash
npm install -g quickmin
```

Then, in your project folder, run:

```bash
quickmin init
```

This will generate an initial `quickmin.yaml` configuration, which is the file that holds information
about your database schema and authentication. By default, it will contain a collection, i.e. a database
table, called posts. This is only for demonstration, of course, and the idea is that you will replace it with
your own database schema. Next, to start the server and interact with your database, run:

```bash
quickmin
```

And you should see the following output:

```bash
UI available at:
  http://localhost:3000/

REST endpoints at:
  http://localhost:3000/posts
```

What has happened is that quickmin created a database for the specified schema, and saved it in `quickmin.db`, which uses SQLite by default.
It then created a REST endpoint to access the data in the database, as well as a UI for an administrator to manage the data. If you visit the UI url at
`http://localhost:3000/` you will see that there is a [React-Admin](https://marmelab.com/react-admin/) interface there. The default username/password is admin/admin.
The initial `quickmin.yaml` configuration will look something like below, and a good next step is obviously to change the admin password.

```yaml
jwtSecret: "6c6353c20458c619256d6e209067eb9e"

# Don't forget to change the password! :)
adminUser: "admin"
adminPass: "admin"

collections:
  pages:
    fields:
      <Text id="title" listable/>
      <Text id="content" multiline fullWidth/>
```

## Single Admin Authorization
With regards to authorization, quickmin can work with two different kinds of users. The first kind is a 'god user', which has its password configured in the
`quickmin.yaml` file. The second type of user is stored in a user authentication table. The 'god user' is easier to get stated with, but the other type of user
is generally what you would use in a real system once it is up and running, since it allows more fine grained role based authentication. The god user is defined in the `quickmin.yaml` file with the following lines. The god user will always have the role `admin`.

```yaml
adminUser: "admin"
adminPass: "admin"
```

## User and Role Based Authorization
