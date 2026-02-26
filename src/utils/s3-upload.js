import { buildPhotoUrlRequest, deletePhotoRequest, initPhotoUploadRequest } from "../api/media";

const ENTITY_TYPES = new Set(["listing", "taxi", "dish", "restaurant"]);
const MAX_SIZE_BYTES = Number(import.meta.env.VITE_S3_MAX_UPLOAD_BYTES || 10485760);
const FALLBACK_PUBLIC_BASE_URL = String(import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");

const normalizeEntityType = (value) => {
  if (ENTITY_TYPES.has(value)) return value;
  return "listing";
};

const normalizePhotoReference = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!FALLBACK_PUBLIC_BASE_URL) return raw;
  return `${FALLBACK_PUBLIC_BASE_URL}/${encodeURIComponent(raw).replace(/%2F/g, "/")}`;
};

const extractObjectKey = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    return key;
  } catch {
    return "";
  }
};

const buildPhotoUrlFromUpload = ({ uploadUrl, objectKey }) => {
  const normalizedKey = String(objectKey || "").trim();
  const normalizedUrl = String(uploadUrl || "").trim().replace(/\/+$/, "");
  if (!normalizedKey || !normalizedUrl) return "";
  return `${normalizedUrl}/${encodeURIComponent(normalizedKey).replace(/%2F/g, "/")}`;
};

const extractS3Error = (raw) => {
  const text = String(raw || "").trim();
  if (!text) return "";
  const code = text.match(/<Code>([^<]+)<\/Code>/i)?.[1] || "";
  const message = text.match(/<Message>([^<]+)<\/Message>/i)?.[1] || "";
  if (code && message) return `${code}: ${message}`;
  if (message) return message;
  return text.slice(0, 400);
};

const postFileToS3 = async ({ url, fields, file }) => {
  const formData = new FormData();
  Object.entries(fields || {}).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error("Не удалось загрузить фото в S3 (проверь CORS и доступность бакета)");
  }

  if (!response.ok) {
    let details = "";
    try {
      details = extractS3Error(await response.text());
    } catch {
      details = "";
    }
    throw new Error(details ? `S3 upload failed: ${details}` : `S3 upload failed (HTTP ${response.status})`);
  }
};

export async function uploadImagesToS3({ files, accountId, entityType }) {
  const normalizedFiles = (Array.isArray(files) ? files : []).filter((file) => file instanceof File && file.size > 0);
  if (!normalizedFiles.length) return [];

  const targetEntityType = normalizeEntityType(entityType);
  const uploaded = [];

  for (const file of normalizedFiles) {
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`Файл слишком большой: ${file.name}`);
    }

    const mimeType = String(file.type || "").trim().toLowerCase();
    if (!mimeType.startsWith("image/")) {
      throw new Error(`Поддерживаются только изображения: ${file.name}`);
    }

    const init = await initPhotoUploadRequest({
      accountId,
      entityType: targetEntityType,
      mimeType,
      byteSize: file.size,
      originalName: file.name,
    });

    if (!init?.upload?.url || !init?.upload?.fields || !init?.objectKey) {
      throw new Error("Invalid upload payload");
    }

    await postFileToS3({
      url: init.upload.url,
      fields: init.upload.fields,
      file,
    });

    let photoReference = normalizePhotoReference(init.photoUrl);

    if (!photoReference) {
      try {
        const resolved = await buildPhotoUrlRequest({ objectKey: init.objectKey });
        photoReference = normalizePhotoReference(resolved?.photoUrl || resolved?.objectKey || "");
      } catch {
        photoReference = "";
      }
    }

    uploaded.push(
      photoReference
      || normalizePhotoReference(buildPhotoUrlFromUpload({ uploadUrl: init.upload.url, objectKey: init.objectKey }))
      || normalizePhotoReference(init.objectKey),
    );
  }

  return uploaded.filter(Boolean);
}

export async function deleteImagesFromS3({ photos, accountId }) {
  const normalizedPhotos = (Array.isArray(photos) ? photos : [])
    .map((photo) => String(photo || "").trim())
    .filter(Boolean);
  if (!normalizedPhotos.length) return;

  const seenKeys = new Set();
  const tasks = normalizedPhotos.map(async (photo) => {
    const objectKey = extractObjectKey(photo);
    if (!objectKey) return;
    if (seenKeys.has(objectKey)) return;
    seenKeys.add(objectKey);
    await deletePhotoRequest({
      accountId,
      objectKey,
    });
  });

  await Promise.all(tasks);
}
