# EasyMapper
Simple data mapping utility for easier hexagonal architecture implementation.
> **Main purpose of the library is to**
> **reduce the amount of code that you need to write to map your objects.**

# Map
Single method that allows you to map objects synchronously or asynchronously 
using `specification`. To map an object you need to pass two parameters
to the `Map` function: 
1. specification object
2. object that you want to map

## Example
```ts
type UserInfo = {
    userId: string,
    colorOfEyes: string,
    role: 'user' | 'admin',
    city: string,
    location: [number, number],
}
type User = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    age: number,
    userInfo: UserInfo
}
type UserInfoView = Omit<UserInfo, 'userId' | 'colorOfEyes'> & {
    colorOfEyes: [number, number, number]
}
type UserView = {
    name: string,
    email: string,
    userInfo: UserInfoView
}

const MapColor: (s: string) => [number, number, number] = /* Business logic */
const UserInfo_UserInfoViewMapSpec: ObjectMapSpec<UserInfo, UserInfoView> = {
    role: o => o.role,
    city: o => o.city,
    location: o => o.location,
    colorOfEyes: o => MapColor(o.colorOfEyes)
    // properties that you do not specify will be omitted
}
const User_UserViewMapSpec: ObjectMapSpec<User, UserView> = {
    email: o => o.email,
    name: o => o.firstName + ' ' + o.lastName,
    userInfo: o => Map(UserInfo_UserInfoViewMapSpec, o.userInfo) // nested mapping
}

// ger result
const user = await db.users.findById(id);
const userView: UserView = Map<User, UserView>(User_UserViewMapSpec, user);
```

# Specification object
Is the object where you specify how to acquire properties of the destination object
from the source object.

Each property has a name that corresponds to the 
specific property `P` of the destination object.
Every property is a function that takes a `deep copy` of the source object 
and `returns a value` that should be put in the desination object at `P` key.

For mapping nested objects there are two ways:
## Using specification for nested object 
recommended for bigger objects with a lot of logic
`from the example above`
```ts
userInfo: o => Map(UserInfo_UserInfoViewMapSpec, o.userInfo)
```

## Mapping by hand 
```ts
// may be more error prone
userInfo: o => ({
    city: o.userInfo.city,
    role: o.userInfo.role,
    location: o.userInfo.location,
    colorOfEyes: MapColor(o.userInfo.colorOfEyes)
})
```