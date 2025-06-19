import { useState, useRef } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { Loader2, Upload, Check, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt",
  maxSize = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    const acceptedTypes = accept.split(',').map(type => type.replace('.', '').toLowerCase());
    
    if (!acceptedTypes.includes(fileType)) {
      setUploadError(`File type not supported. Please upload ${accept} files`);
      toast({
        title: "Upload Failed",
        description: `File type not supported. Please upload ${accept} files`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setUploadError(`File size exceeds ${maxSize}MB limit`);
      toast({
        title: "Upload Failed",
        description: `File size exceeds ${maxSize}MB limit`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      // Convert file to base64
      const base64Content = await convertFileToBase64(file);
      
      // Create file object with base64 content
      const fileWithContent = Object.assign(file, { 
        content: base64Content 
      });
      
      await onUpload(fileWithContent);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      setUploadError((error as Error).message);
      setIsUploading(false);
      clearInterval(interval);
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          // Get base64 string without data URL prefix
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-6 transition-all duration-300 border-2 border-dashed rounded-md",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
      />

      {isUploading ? (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center space-x-2">
            {uploadProgress < 100 ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Check className="w-6 h-6 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {uploadProgress < 100 ? "Uploading..." : "Upload complete!"}
            </span>
          </div>
          <Progress value={uploadProgress} className="w-full h-2" />
        </div>
      ) : (
        <>
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.replaceAll(".", "").toUpperCase()} (Max {maxSize}MB)
          </p>
          {uploadError && (
            <div className="mt-2 text-xs text-red-500 flex items-center">
              <X className="w-4 h-4 mr-1" />
              {uploadError}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={triggerFileInput}
          >
            <FileText className="w-4 h-4 mr-2" />
            Select File
          </Button>
        </>
      )}
    </div>
  );
}
