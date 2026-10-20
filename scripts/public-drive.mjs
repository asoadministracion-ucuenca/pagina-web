// The public Apps Script scans nested folders and can take over 20 seconds.
export async function readPublicDrive(settings, fetcher = fetch) {
  const url = settings.driveRepositoryApiUrl;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) throw Error('Lector público no configurado.');
  const response = await fetcher(url, {signal: AbortSignal.timeout(120000)});
  const drive = await response.json();
  if (!response.ok || !drive.ok || drive.publicFilesOnly !== true || !Array.isArray(drive.files)) throw Error('Catálogo público no disponible.');
  if (drive.rootFolderId !== settings.driveRootFolderId) throw Error('El lector responde a otra carpeta.');
  return drive;
}
