import _ from 'lodash';

/**
 * Compares two arrays for equality regardless of the order of elements.
 * Works for primitive values (numbers, strings, booleans).
 *
 * @param arr1 - First array to compare
 * @param arr2 - Second array to compare
 * @returns True if both arrays contain the same elements, false otherwise
 */
export const areArraysEqualIgnoreOrder = <T>(arr1: T[], arr2: T[]): boolean => {
    return _.isEqual(_.sortBy(arr1), _.sortBy(arr2));
};
