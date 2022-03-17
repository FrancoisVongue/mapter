import {AsyncObjectMapSpec, Map, MapperSpecOptionsSym, ObjectMapSpec} from "./index";
import {Identity, num, obj, Pipe, Return} from "fp-way-core";
import Pick = obj.Pick;

describe('Map', () => {
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

    const GetTestUserInfo = Return<UserInfo>(obj.DeepCopy({
        userId: 'dsf79f8s98f7',
        role: 'user',
        colorOfEyes: '2FA8FF',
        city: 'London',
        location: [2141241, 509520523],
    }));
    const GetTestUser = Return<User>(obj.DeepCopy({
        id: 'dsf79f8s98f7',
        firstName: 'Rafael',
        lastName: 'Nadal',
        email: 'rn@mail.com',
        age: 21,
        userInfo: GetTestUserInfo()
    }));
    const GetTestUserInfoAsync = () => new Promise((res, rej) => {
        setTimeout(() => {
            res(GetTestUserInfo())
        }, 350)
    });
    const MapColor = (s: string) => {
        const groupEvery = (n: number, arr: any[]) => {
            const result: any[] = [];
            arr.forEach((v, i) => {
                const resIndex = Math.floor(i / n);
                if(Array.isArray(result[resIndex])) {
                    (result[resIndex] as any[]).push(v);
                } else {
                    (result[resIndex] as any[]) = [v];
                }
            });
            return result;
        }
        const rgb = groupEvery(2, [...s])
            .map(([a, b]) => a + b)
            .map(hex => Number.parseInt(hex, 16)) as [number, number, number];

        return rgb;
    }
    const MapColorAsync = (s: string): Promise<[number, number, number]> =>
        new Promise(res => setTimeout(_ => res(MapColor(s)), 20) )


    it('get test async should return a user asynchronously', async (done) => {
        const promise: UserInfo = GetTestUserInfoAsync() as any;
        expect(promise?.role).toBeUndefined();

        const result: UserInfo = await promise;
        expect(result.role).toBeDefined();
        done();
    });

    describe('sync spec', () => {
        const UserInfoUserInfoViewMapSpec: ObjectMapSpec<UserInfo, UserInfoView> = {
            role: o => o.role,
            city: o => o.city,
            location: o => o.location,
            colorOfEyes: o => MapColor(o.colorOfEyes)
        }
        const UserUserViewMapSpec: ObjectMapSpec<User, UserView> = {
            email: o => o.email,
            name: o => o.firstName + ' ' + o.lastName,
            userInfo: o => Map(UserInfoUserInfoViewMapSpec, o.userInfo)
        }

        it('should map objects one to another', () => {
            const user = GetTestUser();
            const userView = Map(UserUserViewMapSpec, user);

            expect(userView.name).toBeDefined();
            expect(userView.email).toBeDefined();
            expect(userView.userInfo).toBeDefined();
            expect(userView.userInfo.city).toBeDefined();
            expect(userView.userInfo.colorOfEyes).toBeInstanceOf(Array);
            expect(userView.userInfo.location).toBeDefined();
            expect(userView.userInfo.role).toBeDefined();
            expect((userView as any as User)?.id).toBeUndefined(); // should be removed
        })
    })

    describe('async spec', () => {
        const UserInfoUserInfoViewMapSpec: AsyncObjectMapSpec<UserInfo, UserInfoView> = {
            role: o => o.role,
            city: o => o.city,
            location: o => o.location,
            colorOfEyes: o => MapColor(o.colorOfEyes),
            [MapperSpecOptionsSym]: {async: true}
        }
        const UserUserViewMapSpec: AsyncObjectMapSpec<User, UserView> = {
            email: o => o.email,
            name: o => o.firstName + ' ' + o.lastName,
            userInfo: o => Map(UserInfoUserInfoViewMapSpec, o.userInfo),
            [MapperSpecOptionsSym]: {async: true}
        }

        it('should map objects one to another', async (done) => {
            const user = GetTestUser();
            const userView = await Map(UserUserViewMapSpec, user);

            expect(userView.name).toBeDefined();
            expect(userView.email).toBeDefined();
            expect(userView.userInfo).toBeDefined();
            expect(userView.userInfo.city).toBeDefined();
            expect(userView.userInfo.colorOfEyes).toBeInstanceOf(Array);
            expect(userView.userInfo.location).toBeDefined();
            expect(userView.userInfo.role).toBeDefined();
            expect((userView as any as User)?.id).toBeUndefined(); // should be removed
            done();
        })
    })
});
