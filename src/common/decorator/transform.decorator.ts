type TransformFnType = (v: any) => any;

const metaDataStorage = new Map<
  new () => unknown,
  Map<string, TransformFnType>
>();

export const Transform = (transformFn: TransformFnType) => {
  return (target: any, propertyKey: string) => {
    const targetClass = target.constructor;
    if (!metaDataStorage.has(targetClass)) {
      metaDataStorage.set(targetClass, new Map());
    }
    const targetStorage = metaDataStorage.get(targetClass);
    targetStorage.set(propertyKey, transformFn);
  };
};

export function jsonToInstance<T>(
  targetClass: new () => T,
  jsonData: Record<string, any>
): T {
  const targetStorage = metaDataStorage.get(targetClass);
  const instance = new targetClass();
  Object.assign(instance, jsonData);
  if (!targetStorage) {
    return instance;
  }
  for (const [key, transformFn] of targetStorage) {
    const value = jsonData[key];
    if (!value) {
      continue;
    }
    instance[key] = transformFn(jsonData[key]);
  }
  return instance;
}
