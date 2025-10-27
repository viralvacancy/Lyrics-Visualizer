
export const downloadLrcFile = (filename: string, lrcContent: string): void => {
    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Create a clean filename with the .lrc extension
    const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
    link.download = `${baseName}.lrc`;

    // Append to body, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);
};
