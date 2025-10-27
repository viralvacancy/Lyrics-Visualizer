
// This requires the JSZip library to be loaded, e.g., via a script tag in index.html.
declare const JSZip: any;

/**
 * Extracts audio files from a given ZIP file.
 * @param zipFile The ZIP file to process.
 * @returns A promise that resolves to an array of objects, each containing a file name and its blob data.
 */
export const extractAudioFiles = async (zipFile: File): Promise<{ name: string; blob: Blob }[]> => {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded.');
  }

  const zip = await JSZip.loadAsync(zipFile);
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
  
  // Sort files alphabetically
  audioFiles.sort((a, b) => a.name.localeCompare(b.name));
  
  return audioFiles;
};
