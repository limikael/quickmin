export default
`
jwtSecret: "$$JWT_SECRET$$"

# Don't forget to change the password! :)
adminUser: "admin"
adminPass: "admin"

collections:
  pages:
    fields:
      <Text id="title" listable/>
      <Text id="content" multiline fullWidth/>
`;
