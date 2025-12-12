import { PARAMETERS } from './constants';

export const isValidParameter = (param: string): boolean => {
    return PARAMETERS.includes(param as any);
};

export const validateSessionStart = (userId: string) => {
    if (!userId) throw new Error("User ID required");
};
