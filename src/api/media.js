import { createDomainApi } from "./client";

const mediaApi = createDomainApi("media");

export const initPhotoUploadRequest = (params) => mediaApi("initPhotoUpload", params);
export const buildPhotoUrlRequest = (params) => mediaApi("buildPhotoUrl", params);
