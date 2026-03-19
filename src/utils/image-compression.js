const DEFAULT_MAX_DIMENSION = Number(import.meta.env.VITE_IMAGE_UPLOAD_MAX_DIMENSION || 1600);
const DEFAULT_MIN_SIZE_BYTES = Number(import.meta.env.VITE_IMAGE_COMPRESSION_MIN_BYTES || 262144);
const DEFAULT_JPEG_QUALITY = Number(import.meta.env.VITE_IMAGE_UPLOAD_QUALITY || 0.82);

const SKIPPED_TYPES = new Set(["image/gif", "image/svg+xml"]);
const RESIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function clampQuality(value) {
  if (!Number.isFinite(value)) return 0.82;
  return Math.max(0.5, Math.min(0.95, value));
}

function replaceFileExtension(name, extension) {
  const baseName = String(name || "image").trim() || "image";
  const sanitizedExtension = String(extension || "").replace(/^\./, "").trim();
  if (!sanitizedExtension) return baseName;
  return baseName.replace(/\.[^.]+$/, "") + `.${sanitizedExtension}`;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Не удалось подготовить изображение"));
    }, type, quality);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать изображение"));
    };

    image.src = objectUrl;
  });
}

function getTargetDimensions(width, height, maxDimension) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height, resized: false };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    resized: true,
  };
}

export async function prepareImageForUpload(file) {
  if (!(file instanceof File) || file.size <= 0) return file;

  const mimeType = String(file.type || "").trim().toLowerCase();
  if (!mimeType.startsWith("image/")) return file;
  if (SKIPPED_TYPES.has(mimeType) || !RESIZABLE_TYPES.has(mimeType)) return file;

  const maxDimension = Number.isFinite(DEFAULT_MAX_DIMENSION) && DEFAULT_MAX_DIMENSION > 0
    ? DEFAULT_MAX_DIMENSION
    : 1600;
  const minSizeBytes = Number.isFinite(DEFAULT_MIN_SIZE_BYTES) && DEFAULT_MIN_SIZE_BYTES > 0
    ? DEFAULT_MIN_SIZE_BYTES
    : 262144;
  const quality = clampQuality(DEFAULT_JPEG_QUALITY);

  const image = await loadImageFromFile(file);
  const target = getTargetDimensions(image.naturalWidth, image.naturalHeight, maxDimension);
  if (!target) return file;

  const shouldResize = target.resized;
  const shouldReencode = mimeType === "image/jpeg" || mimeType === "image/webp";
  if (!shouldResize && (!shouldReencode || file.size < minSizeBytes)) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, 0, 0, target.width, target.height);

  const outputType = mimeType === "image/png" ? "image/png" : mimeType === "image/webp" ? "image/webp" : "image/jpeg";
  const outputBlob = await canvasToBlob(canvas, outputType, outputType === "image/png" ? undefined : quality);

  if (!shouldResize && outputBlob.size >= file.size) {
    return file;
  }

  if (shouldResize && outputBlob.size >= file.size && file.size <= minSizeBytes) {
    return file;
  }

  const outputName = outputType === "image/png"
    ? replaceFileExtension(file.name, "png")
    : outputType === "image/webp"
      ? replaceFileExtension(file.name, "webp")
      : replaceFileExtension(file.name, "jpg");

  return new File([outputBlob], outputName, {
    type: outputType,
    lastModified: file.lastModified,
  });
}
