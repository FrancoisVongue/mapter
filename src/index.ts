import {Curry, DataObject, IsOfType, obj, Unary} from "fp-way-core";

export const MapperSpecOptionsSym = Symbol.for('easymapper');
type FPK = [Function, DataObject, string];
function BuildObject(fnsWithParamsAndRKey: FPK[]): DataObject {
    const resEntries = fnsWithParamsAndRKey
        .map(([f, o, rk]) => [rk,  f(o)] as [string,  any]);
    return obj.FromEntries(resEntries);
}
async function BuildObjectAsync(fnsWithParamsAndRKey: FPK[]): Promise<DataObject> {
    const resEntries = await Promise.all(
        fnsWithParamsAndRKey
            .map(async ([f, o, k]) => [k,  await f(o)] as [string,  any])
    );
    return obj.FromEntries<DataObject>(resEntries);
}

export type ObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    [P in keyof O2]: (o: O1) => O2[P]
} & {[MapperSpecOptionsSym]?: {async?: false}};
export type AsyncObjectMapSpec<O1 extends DataObject, O2 extends DataObject> = {
    [P in keyof O2]: (o: O1) => O2[P] | Promise<O2[P]>
} & {[MapperSpecOptionsSym]: {async: true}};
export const Map: {
    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: ObjectMapSpec<O1, O2>,
        src: O1
    ): O2

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: AsyncObjectMapSpec<O1, O2>,
        src: O1
    ): Promise<O2>

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: ObjectMapSpec<O1, O2>,
    ): Unary<O1, O2>

    <O1 extends DataObject, O2 extends DataObject>(
        mapSpec: AsyncObjectMapSpec<O1, O2>,
    ): Unary<O1, Promise<O2>>
} = Curry((
    mapSpec: AsyncObjectMapSpec<any, any> | ObjectMapSpec<any, any>,
    originalSrc: DataObject
): any => {
    if(!IsOfType('object', mapSpec))
        throw Error(`Invalid input to Map: spec can not be null`);
    if(!IsOfType('object', originalSrc))
        throw Error(`Invalid input to Map: src can not be null`);

    const src = obj.DeepCopy(originalSrc);
    const fnsWithParamsAndKey: FPK[] = [];

    for(let [dest, mapper] of obj.Entries(mapSpec)) {
        fnsWithParamsAndKey.push([mapper, src, dest]);
    }

    return (mapSpec?.[MapperSpecOptionsSym]?.async ?? false)
        ? BuildObjectAsync(fnsWithParamsAndKey)
        : BuildObject(fnsWithParamsAndKey);
});