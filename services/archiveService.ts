// This requires the JSZip library to be loaded, e.g., via a script tag in index.html.
declare const JSZip: any;

/**
 * Extracts audio files from a given archive file (.zip).
 * @param archiveFile The archive file to process.
 * @returns A promise that resolves to an array of objects, each containing a file name and its blob data.
 */
export const extractFilesFromArchive = async (archiveFile: File): Promise<{ name: string; blob: Blob }[]> => {
  const fileName = archiveFile.name.toLowerCase();
  
  if (fileName.endsWith('.zip')) {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library is not loaded.');
    }
    const zip = await JSZip.loadAsync(archiveFile);
    const audioFiles: { name: string; blob: Blob }[] = [];
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

    const promises: Promise<void>[] = [];
    zip.forEach((relativePath: string, file: any) => {
      const isAudio = audioExtensions.some(ext => relativePath.toLowerCase().endsWith(ext));
      if (!file.dir && isAudio) {
        const promise = file.async('blob').then((blob: Blob) => {
          audioFiles.push({ name: relativePath, blob });
        });
        promises.push(promise);
      }
    });

    await Promise.all(promises);
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));
    return audioFiles;

  } else if (fileName.endsWith('.rar')) {
    // True browser-side RAR extraction requires a complex WebAssembly library,
    // which is beyond the scope of this environment. This provides a clear message to the user.
    throw new Error('RAR file extraction is not supported at this time. Please use ZIP files instead.');
  } else {
    throw new Error('Unsupported archive format. Please use .zip or .rar files.');
  }
};