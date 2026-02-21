import { buildPhotoUrlRequest, initPhotoUploadRequest } from "../api/media";

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

const buildPhotoUrlFromUpload = ({ uploadUrl, objectKey }) => {
  const normalizedKey = String(objectKey || "").trim();
  const normalizedUrl = String(uploadUrl || "").trim().replace(/\/+$/, "");
  if (!normalizedKey || !normalizedUrl) return "";
  return `${normalizedUrl}/${encodeURIComponent(normalizedKey).replace(/%2F/g, "/")}`;
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
    throw new Error("S3 upload failed");
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
