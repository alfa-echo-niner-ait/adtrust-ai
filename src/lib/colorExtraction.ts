interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorCount {
  color: RGB;
  count: number;
}

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Calculate color distance (Euclidean)
const colorDistance = (c1: RGB, c2: RGB): number => {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
};

// Check if color is too light or too dark
const isValidColor = (rgb: RGB): boolean => {
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;
  // Filter out very light (near white) and very dark (near black) colors
  return brightness > 30 && brightness < 225;
};

// Quantize colors to reduce similar shades
const quantizeColor = (rgb: RGB, factor: number = 32): RGB => {
  return {
    r: Math.round(rgb.r / factor) * factor,
    g: Math.round(rgb.g / factor) * factor,
    b: Math.round(rgb.b / factor) * factor,
  };
};

export const extractColorsFromImage = async (file: File, maxColors: number = 5): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Resize image for faster processing (max 200px)
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Count colors
        const colorMap = new Map<string, ColorCount>();

        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const rgb: RGB = {
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
          };

          // Skip invalid colors
          if (!isValidColor(rgb)) continue;

          // Quantize to reduce similar colors
          const quantized = quantizeColor(rgb);
          const key = `${quantized.r},${quantized.g},${quantized.b}`;

          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, { color: quantized, count: 1 });
          }
        }

        // Sort by frequency and get top colors
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count);

        // Filter out similar colors
        const uniqueColors: ColorCount[] = [];
        const minDistance = 50; // Minimum color distance threshold

        for (const color of sortedColors) {
          const isSimilar = uniqueColors.some(unique => 
            colorDistance(color.color, unique.color) < minDistance
          );

          if (!isSimilar) {
            uniqueColors.push(color);
            if (uniqueColors.length >= maxColors) break;
          }
        }

        // Convert to hex
        const hexColors = uniqueColors.map(c => 
          rgbToHex(c.color.r, c.color.g, c.color.b)
        );

        URL.revokeObjectURL(img.src);
        resolve(hexColors);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};
