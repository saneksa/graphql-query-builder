# graphql-query-builder

a simple but powerful graphQL query builder

# Install

`npm install @saneksa/graphql-query-builder`

`yarn add @saneksa/graphql-query-builder`

# Example

```js
var Query = require("@saneksa/graphql-query-builder");

// example of nesting Querys
/*
{
 user( id:3500401 ) {
    id,
    nickname : name,
    isViewerFriend,

    image: profilePicture( size:50 ) {
        uri,
        width,
        height
    }
  }
}
*/

let profilePicture = new GraphQlQuery("profilePicture", { size: 50 }).select(
  "uri",
  "width",
  "height"
);

let user = new GraphQlQuery("user", { id: 3500401 }).select(
  "id",
  { nickname: "name" },
  "isViewerFriend",
  { image: profilePicture }
);

console.log("user", user.toString());
```
