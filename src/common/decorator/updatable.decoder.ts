export function UpdatableFields(target: any, propertyKey: string) {
  const _class = target.constructor;
  _class.updatableFields.push(propertyKey);
}
