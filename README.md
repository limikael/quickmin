Quickmin is a database administration administraon tool builder. It is build on top of [React-Admin](https://marmelab.com/react-admin/). It takes a configuration of
your database schema as a YAML file, and provides a UI as well as a RESTful api to acces your data, without any code needed. Quickmin can work as a standalone app, or as a middleware inside of a web app.

* [Getting Started](#getting-started)

## Getting Started

To get started, create a file called `quickmin.yaml` with the following content:

```yaml
collections:
  posts:
    fields:
      <Text id="title"/>
      <Text id="content" fullWidth/>
```

Then, run `quickmin migrate` followed simply by `quickmin`, and you should see the following output:

```bash
UI available at:
  http://localhost:3000/

REST endpoints at:
  http://localhost:3000/posts
```

What has happened is that quickmin created a database for the specified schema, and saved it in `quickmin.db`, which uses SQLite by default.
It then created a REST endpoint to access the data in the database, as well as a UI for an administrator to manage the data. If you visit the UI url at
`http://localhost:3000/` you will see that there is a [React-Admin](https://marmelab.com/react-admin/) interface there.
