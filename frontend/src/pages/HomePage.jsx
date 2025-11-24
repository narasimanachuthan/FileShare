import { useState } from 'react';
import { uploadFile } from '../uploadService';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  
  const [shareLink, setShareLink] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus("🔒 Encrypting & Uploading...");
    setShareLink("");

    try {
      const { key, fileId } = await uploadFile(file);
      
      const link = `${window.location.origin}/d/${fileId}#${key}`;
      
      setShareLink(link);
      setUploadStatus("✅ Success!");
    } catch (error) {
      console.error(error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">
          Project Aegis <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded ml-2">v2</span>
        </h1>

        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative mb-6">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-gray-400 truncate">
            {file ? <span className="font-mono text-blue-300">{file.name}</span> : <span>Click to select file</span>}
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-3 rounded-lg font-bold transition-all
            ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg'}`}
        >
          {uploading ? 'Processing...' : 'Secure Upload'}
        </button>

        {uploadStatus && (
           <p className="mt-4 text-center text-sm font-mono text-gray-300">{uploadStatus}</p>
        )}

        {shareLink && (
          <div className="mt-6 bg-black/50 p-4 rounded-lg border border-green-500/30 text-left">
            <p className="text-xs text-green-500 mb-2 uppercase font-bold tracking-wider">Your Secure Link</p>
            <div 
              className="font-mono text-xs text-white bg-gray-900 p-3 rounded border border-gray-700 break-all cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => navigator.clipboard.writeText(shareLink)}
            >
              {shareLink}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              (Click to copy)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}