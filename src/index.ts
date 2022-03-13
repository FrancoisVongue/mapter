import {Curry, DataObject, Identity, InCase, IsOfType, Not, obj, Return, TypeOf, Unary} from "fp-way-core";
import FromEntries = obj.FromEntries;

type FPK = [Function, any[], string];
function BuildObject(fnsWithParamsAndRKey: FPK[]): DataObject {
    const resEntries = fnsWithParamsAndRKey
        .map(([f, ps, rk]) => [rk,  f(...ps)] as [string,  any]);
    return FromEntries(resEntries);
}
async function BuildObjectAsync(fnsWithParamsAndRKey: FPK[]): Promise<DataObject> {
    const resEntries = await Promise.all(
        fnsWithParamsAndRKey
            .map(async ([f, ps, k]) => [k,  await f(...ps)] as [string,  any])
    );
    return FromEntries<DataObject>(resEntries);
}

export type ObjectMapper<O1> = (value: any | null, obj: O1) => any;
export type AsyncObjectMapper<O1> = (value: any | null, obj: O1) => Promise<any>;
export type AsyncObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    map: [
        keyof O1 | '',
        | AsyncObjectMapper<O1>
        | ObjectMapper<O1>
        | ObjectMapSpec<any, any>
        | AsyncObjectMapSpec<any, any>,
        keyof O2
    ][];
    transfer?: Extract<keyof O1, keyof O2>[],
    async: true
}
export type ObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    map: [keyof O1 | '', ObjectMapper<O1> | ObjectMapSpec<any, any>, keyof O2][];
    transfer?: Extract<keyof O1, keyof O2>[],
    async?: false
}
export const Map: {
    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: ObjectMapSpec<O1, O2>,
        src: null | O1
    ): O2

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: AsyncObjectMapSpec<O1, O2>,
        src: null | O1
    ): Promise<O2>

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: ObjectMapSpec<O1, O2>,
    ): Unary<null | O1, O2>

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: AsyncObjectMapSpec<O1, O2>,
    ): Unary<null | O1, Promise<O2>>
} = Curry((
    mapSpec: AsyncObjectMapSpec<any, any> | ObjectMapSpec<any, any>,
    originalSrc: DataObject
): any => {
    if(!mapSpec)
        throw Error(`Invalid input to Map: spec can not be null`);
    if(!originalSrc)
        throw Error(`Invalid input to Map: src can not be null`);

    const src = obj.DeepCopy(originalSrc);
    const ObjOrNull = o => typeof o === 'object';
    const fnsWithParamsAndKey: FPK[] = [];

    if(mapSpec.transfer) {
        for(const prop of mapSpec.transfer) {
            fnsWithParamsAndKey.push([
                Return(src?.[prop as string]),
                [null],
                prop as string
            ]);
        }
    }

    for(let row of mapSpec.map) {
        const [sourceProp, mapperOrSpec, destinationProp] = row;

        if(IsOfType('function', mapperOrSpec)) {
            const params = [src?.[sourceProp as string] ?? null, src];
            fnsWithParamsAndKey.push([
                mapperOrSpec as ObjectMapper<any>,
                params,
                destinationProp as string
            ]);
        } else if (IsOfType('object'), mapperOrSpec) {
            const params = [mapperOrSpec, src?.[sourceProp as string] ?? null];
            fnsWithParamsAndKey.push([
                Map,
                params,
                destinationProp as string
            ]);
        } else {
            throw Error(`Invalid input to obj.Map: mapper can be either function or object, not ${TypeOf(mapperOrSpec)}`)
        }
    }

    return (mapSpec.async ?? false)
        ? BuildObjectAsync(fnsWithParamsAndKey)
        : BuildObject(fnsWithParamsAndKey);
});
