# EasyMapper
Simple data mapping utility for easier hexagonal architecture implementation.
> **Main purpose of the library is to**
> **reduce the amount of code that you need to write to map your objects.**

# Map
A method that allows you to map objects synchronously or asynchronously 
using `specification`. To map an object you need to pass two parameters
to the `Map` function: 
1. `specification` object
2. object that you want to map

As a `result` the function will return the object that is the result of mapping.

# Specification object
Is the object where you specify how to acquire properties of the destination object
from the source object.

Each property has a name that corresponds to the
specific property `P` of the destination object.
Every property is a function that takes a `deep copy` of the source object
and `returns a value` that should be put in the destination object at `P` key.

Map specification looks like this
```ts
export type ObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    [P in keyof O2]: (o: O1) => O2[P]
} & {[MapperSpecOptionsSym]?: {async?: false}};

// or async version
export type AsyncObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    [P in keyof O2]: (o: O1) => O2[P] | Promise<O2[P]>
} & {[MapperSpecOptionsSym]: {async: true}};      // you need to set async option to true
```

# Examples
## Simple object
```ts
type UserInfo = {
    userId: string,
    colorOfEyes: string,
    role: 'user' | 'admin',
    city: string,
    location: [number, number],
}
type UserInfoView = {
    colorOfEyes: [number, number, number],
    role: 'user' | 'admin',
    city: string,
    location: string,
}
const UserInfoUserInfoViewMapSpec: ObjectMapSpec<UserInfo, UserInfoView> = {
    role: o => o.role,
    city: o => o.city.toUpperCase(),
    location: o => o.location[0] + '.' + o.location[1],
    colorOfEyes: o => MapColor(o.colorOfEyes)
}
const userInfo = {
    userId: 'dsf79f8s98f7',
    role: 'user',
    colorOfEyes: '2FA8FF',
    city: 'London',
    location: [2141241, 509520523],
}
const userInfoView = Map(UserInfoUserInfoViewMapSpec, userInfo);
```
**Result will be:**
```
{
  "role": "user",
  "city": "LONDON",
  "location": "2141241.509520523",
  "colorOfEyes": [47, 168, 255]
}
```

# Mapping nested objects
1. **Using specification to map nested objects**
For bigger nested objects with a lot of mapping logic it's recommended to 
put mapping logic into another specification and use Map function 
inside the specification like so:
```ts
const userMapSpec = {
    userInfo: o => Map(UserInfo_UserInfoViewMapSpec, o.userInfo)
    // ...
}
```

2. **Mapping by hand**
Smaller objects can be mapped directly without creating another specification.
```ts
userInfo: o => ({
    city: o.userInfo.city,
    role: o.userInfo.role,
    location: o.userInfo.location,
    colorOfEyes: MapColor(o.userInfo.colorOfEyes)
})
```