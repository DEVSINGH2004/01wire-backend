// import { WHITELISTED_TLDS } from 'src/constants/whitelist.tld';
// import { BLACKLISTED_TLDS } from 'src/constants/blacklist.tld';
import * as EmailValidator from 'email-validator';
import { z } from 'nestjs-zod/z';
import { IPaginationType } from '../interface/pagination.type.interface';

export const flattenObject = (
  unflattendObject: Record<string, any>,
  prefix: string
) => {
  const flattenObject = {};
  for (const [key, value] of Object.entries(unflattendObject || {})) {
    flattenObject[`${prefix}.${key}`] = value;
  }
  return flattenObject;
};

export const paginateResponse = (
  itemCount: number,
  perPage: number,
  currentPage: number
): { paginationInfo: IPaginationType } => {
  const paginationInfo: IPaginationType = {
    currentPage,
    perPage,
    itemCount: itemCount,
    pageCount: itemCount > 0 ? Math.ceil(itemCount / perPage) : 0,
    hasNextPage: itemCount > perPage * (currentPage + 1) ? true : false,
    hasPreviousPage: currentPage > 0 && itemCount !== 0 ? true : false
  };

  return {
    paginationInfo
  };
};

/**Used to assert the difference between two dates
 * Throws an error if date difference is less than the difference provided
 */
export const assertDateDifference = (
  date1: Date,
  date2: Date,
  difference: number,
  error: Error
) => {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  if (diff < difference) {
    throw error;
  }
};

export const msToDays = (
  duration: number,
  processor?: (arg: number) => number
) => {
  const days = duration / (1000 * 60 * 60 * 24);
  return processor ? processor(days) : days;
};

export const isValidEmail = (email: string) => {
  const emailSplit = email.split('@');
  if (EmailValidator.validate(email) !== true) return false;
  if ((emailSplit[0].match(/\./g) || []).length > 2) return false;
  // if (!WHITELISTED_TLDS.has(emailSplit[1])) return false;
  // if (BLACKLISTED_TLDS.has(emailSplit[1])) return false;
  if (emailSplit[0].indexOf('+') !== -1) return false;
  return true;
};

export const checkIfDirty = (
  oldObj: Record<any, any>,
  newObj: Record<any, any>,
  keys: string[]
): boolean => {
  return keys.some((key) => {
    if (newObj[key] === null || newObj[key] === undefined) return false;
    const oldStr =
      typeof oldObj[key] === 'string'
        ? oldObj[key].trim()
        : JSON.stringify(oldObj[key]);
    const newStr =
      typeof newObj[key] === 'string'
        ? newObj[key].trim()
        : JSON.stringify(newObj[key]);
    return oldStr !== newStr;
  });
};

export const zodEmail = () => {
  return z.string().refine((val) => isValidEmail(val), {
    message: 'invalid email'
  });
};
