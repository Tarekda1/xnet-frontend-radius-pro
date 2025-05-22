import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoiceUpload } from '@/hooks/useInvoiceUpload';
import { Upload } from 'lucide-react';

const InvoiceUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const { uploadInvoice, isLoading, error } = useInvoiceUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) {
      try {
        const result = await uploadInvoice(file);
        console.log('Upload successful:', result);
        // Handle success (e.g., show a success message)
      } catch (err) {
        console.error('Upload failed:', err);
        // Handle error (error is already set in the hook)
      }
    }
  };

  return (
    <div className="w-full py-6 pt-2">
      <h1 className="text-3xl font-bold mb-6">Upload Invoice</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>
        <Button type="submit" disabled={!file || isLoading}>
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Uploading...' : 'Upload Invoice'}
        </Button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default InvoiceUpload;