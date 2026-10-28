const MAX_PHOTOS = 3;
const MAX_BYTES = 2 * 1024 * 1024;

function validatePhotos(photos = []) {
  if (!Array.isArray(photos) || photos.length > MAX_PHOTOS) return 'Adjunta como máximo 3 fotos';
  for (const photo of photos) {
    if (!photo || typeof photo.nombre_archivo !== 'string' || !photo.nombre_archivo.trim() || photo.nombre_archivo.length > 255) return 'Nombre de foto inválido';
    const match = typeof photo.url_storage === 'string' && photo.url_storage.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || match[1] !== photo.tipo_mime) return 'Solo se permiten fotos JPEG, PNG o WebP';
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > MAX_BYTES || bytes.toString('base64') !== match[2]) return 'Cada foto debe pesar como máximo 2 MB';
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!(match[1] === 'image/jpeg' && jpeg || match[1] === 'image/png' && png || match[1] === 'image/webp' && webp)) return 'El contenido del archivo no corresponde a una foto válida';
    photo.peso_kb = bytes.length / 1024;
  }
  return null;
}

module.exports = { validatePhotos };
