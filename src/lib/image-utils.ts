/**
 * image-utils.ts
 * Converts an image File to WebP format in-browser using a canvas.
 * The converted file is smaller, faster to upload, and served efficiently.
 *
 * @param file    - The original image file chosen by the user
 * @param quality - WebP quality from 0 (lowest) to 1 (highest). Default: 0.82
 * @param maxWidth - Maximum width in pixels; image is downscaled if larger. Default: 1600
 * @returns A Promise that resolves to a new File in image/webp format
 */
export function convertToWebP(
  file: File,
  quality = 0.82,
  maxWidth = 1600,
): Promise<File> {
  return new Promise((resolve) => {
    // If already WebP or not an image, skip conversion and return as-is
    if (file.type === "image/webp" || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => resolve(file); // fallback: return original

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => resolve(file); // fallback: return original

      img.onload = () => {
        // Optionally downscale very large images
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Rename file extension to .webp
            const baseName =
              file.name.includes(".")
                ? file.name.substring(0, file.name.lastIndexOf("."))
                : file.name;
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
