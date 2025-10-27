import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };
  
  const baseClasses = "relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden backdrop-blur-xl";
  const inactiveClasses = "border-purple-500/40 text-gray-300 bg-white/5 hover:border-purple-400/70 hover:bg-purple-500/10 hover:shadow-[0_25px_60px_rgba(168,85,247,0.25)] hover:-translate-y-1";
  const activeClasses = "border-purple-400 bg-purple-600/20 text-white shadow-[0_25px_60px_rgba(168,85,247,0.35)] scale-[1.01]";
  const disabledClasses = "border-gray-700/60 bg-gray-900/40 text-gray-600 cursor-not-allowed";

  const getDynamicClasses = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isDragging) return `${baseClasses} ${activeClasses}`;
    return `${baseClasses} ${inactiveClasses}`;
  }

  return (
    <label
      htmlFor="file-upload"
      className={getDynamicClasses()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-24 -right-16 w-52 h-52 bg-purple-400/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-10 w-52 h-52 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative text-center flex flex-col items-center gap-3">
        <UploadIcon className="w-12 h-12" />
        <div>
          <p className="font-semibold tracking-wide">Click to upload or drag & drop</p>
          <p className="text-sm text-gray-300">Audio files, ZIP, or RAR albums</p>
        </div>
      </div>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="audio/*,.zip,.rar"
        multiple
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export default FileUpload;