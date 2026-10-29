const MIME_BY_EXTENSION = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', txt: 'text/plain', log: 'text/plain' };

export async function readEvidenceFiles(files, existingCount = 0) {
  const selected = Array.from(files || []);
  if (selected.length + existingCount > 3) throw new Error('Puedes adjuntar hasta 3 archivos por avance.');
  const prepared = selected.map(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    const mime = MIME_BY_EXTENSION[extension];
    if (!mime || (file.type && file.type !== mime && !(mime === 'text/plain' && file.type === 'application/octet-stream'))) throw new Error('Selecciona imágenes JPEG, PNG o WebP, PDF, TXT o LOG.');
    if (!file.size || file.size > 2 * 1024 * 1024) throw new Error('Cada archivo debe contener datos y pesar como máximo 2 MB.');
    return { file, mime };
  });
  return Promise.all(prepared.map(({ file, mime }) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer ' + file.name));
    reader.onload = () => {
      const dataUrl = 'data:' + mime + ';base64,' + String(reader.result).split(',')[1];
      const evidence = { nombre_archivo: file.name, tipo_mime: mime, peso_kb: file.size / 1024, url_storage: dataUrl };
      if (!mime.startsWith('image/')) { resolve(evidence); return; }
      const preview = new Image();
      preview.onload = () => resolve(evidence);
      preview.onerror = () => reject(new Error(file.name + ' no contiene una imagen válida.'));
      preview.src = dataUrl;
    };
    reader.readAsDataURL(file);
  })));
}
