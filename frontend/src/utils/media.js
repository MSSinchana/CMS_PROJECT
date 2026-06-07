export async function filesToMediaItems(files) {
  const list = Array.from(files || []);

  return Promise.all(
    list.map((file) =>
      readFileAsDataUrl(file).then((dataUrl) => ({
        name: file.name,
        type: file.type || 'application/octet-stream',
        dataUrl,
        kind: (file.type || '').startsWith('video/') ? 'video' : 'image'
      }))
    )
  );
}

export function isVideoType(type = '') {
  return type.startsWith('video/');
}

export function isImageType(type = '') {
  return type.startsWith('image/');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
