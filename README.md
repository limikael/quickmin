Quickmin is a database administration administraon tool builder. It is build on top of [React-Admin](https://marmelab.com/react-admin/). It takes a configuration of
your database schema as a YAML file, and provides a UI as well as a RESTful api to acces your data, without any code needed. Quickmin can work as a standalone app, or as a middleware inside of a web app. It also performs automatic schema migration.

* [Getting Started](#getting-started)
* [Single Admin Authorization](#single-admin-authorization)
* [User and Role Based Authorization](#user-and-role-based-authorization)
* [Secure Views](#secure-views)
* [Using Quickmin as a Middleware](#using-quickmin-as-a-middleware)
* [Actions](#actions)
* [Api](#api)

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
With regards to authorization, quickmin can work with two different kinds of users. The first type is called "configurations suers". The configuration user is defined in the `quickmin.yaml`, offering a quick setup for users. This user is particularly convenient for initial system deployment and works seamlessly even when the database is empty. However, the configuration user is limited - only one configuration user can be defined, and the credentals are fixed in the configuration file, they can not be changed during can not be changed during runtime. The configuration user will always have the role `admin`, and is defined like this in the `quickmin.yaml` file:

```yaml
adminUser: "admin"
adminPass: "admin"
```

## User and Role Based Authorization
The other type of user, called "database user", on the other hand, is defined within a dedicated database table. To enable the use of database users, the system must be configured to identify the location of these users. This involves tagging specific fields in the database that correspond to user data, as well as using specific
field types. For example, to enable authorization with database users, we can create a table called `users` like this:

```yaml
collections:
  users:
    <Text id="name" username listable/>
    <Select id="role" choices="customer,user,admin" role listable filter/>
    <AuthMethod id="google_auth" provider="google" listable tab="auth"/>
```

This configuration snippet outlines the structure of the "users" collection in the database. It includes fields for capturing the user's name, role, and an authentication method specifically configured for Google. The use of tags, i.e. `username`, `role` and the special field type `AuthMethod` provides context and functionality to these fields within the admin interface. So, one one hand there is nothing special with this table, and it could be called something else than "users", and we are free to store whatever information we want there. On the other hand, the table is designated as the auth table by tagging certain fields to give them special meaning for the sake of
authentication and authorization.
