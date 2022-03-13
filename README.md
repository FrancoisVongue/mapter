# EasyMapper
Simple data mapping utility for easier hexagonal architecture implementation.
> **Main purpose of the library is to**
> **reduce the amount of code that you need to write to map your objects.**

# Map
Single method that allows you to map objects using both
1. **sync** methods and specificaitons
2. **async** methods and specificaitons

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

const UserInfoUserInfoViewMapSpec: ObjectMapSpec<UserInfo, UserInfoView> = {
    map: [
        ['colorOfEyes', MapColor, 'colorOfEyes']
    ],
    transfer: ['role', 'city', 'location']
}
const UserUserViewMapSpec: ObjectMapSpec<User, UserView> = {
    map: [
        ['userInfo', UserInfoUserInfoViewMapSpec ,'userInfo'],
        [
            '',
            (v, o) => o.firstName + ' ' + o.lastName,
            'name'
        ],
    ],
    transfer: ['email']
}
```