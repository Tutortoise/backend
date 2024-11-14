import sharp from "sharp";

// Downscale image to 1024x1024 and convert to JPEG
export const downscaleImage = async (buffer: Buffer) => {
  return sharp(buffer).resize(1024, 1024).jpeg({ quality: 80 }).toBuffer();
};
