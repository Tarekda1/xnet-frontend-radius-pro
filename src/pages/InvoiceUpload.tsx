import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoiceUpload } from '@/hooks/useInvoiceUpload';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const InvoiceUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadInvoice, isLoading, error } = useInvoiceUpload();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
        setFile(selectedFile);
        setUploadProgress(0);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setUploadProgress(0);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        const result = await uploadInvoice(file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        toast({
          title: "Upload successful",
          description: "Your invoice has been uploaded successfully.",
        });
        
        // Reset after success
        setTimeout(() => {
          setFile(null);
          setUploadProgress(0);
        }, 2000);
      } catch (err) {
        console.error('Upload failed:', err);
        toast({
          title: "Upload failed",
          description: error || "An error occurred while uploading the file.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-full py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Upload Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Upload your invoice in Excel format (.xlsx or .xls)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice File</CardTitle>
          <CardDescription>
            Drag and drop your Excel file here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                file ? "border-green-500 bg-green-50/50" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop your file here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to select a file
                    </p>
                  </>
                )}
              </div>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
              >
                Select File
              </label>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={!file || isLoading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? 'Uploading...' : 'Upload Invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceUpload;