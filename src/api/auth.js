import { createDomainApi } from "./client";

const accountApi = createDomainApi("account");

export const registerRequest = (params) => accountApi("register", params);

export const signInRequest = (params) => accountApi("signIn", params);

export const getSessionRequest = (params) => accountApi("getSession", params);

export const signOutRequest = (params) => accountApi("signOut", params);

export const createOrUpdateAccountRequest = (params) => accountApi("createOrUpdateAccount", params);

export const getProfileRequest = (params) => accountApi("getProfile", params);
