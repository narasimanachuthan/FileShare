import { useState } from 'react';
import { uploadFile } from '../uploadService';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [shareLink, setShareLink] = useState("");

  const [expireHours, setExpireHours] = useState(24);
  const [maxDownloads, setMaxDownloads] = useState("");
  const [password, setPassword] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus("🔒 Encrypting & Uploading...");
    setShareLink("");

    try {
      const { key, fileId } = await uploadFile(file, {
        expireHours: Number(expireHours),
        maxDownloads: maxDownloads ? Number(maxDownloads) : null,
        password: password || null
      });
      
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

        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors relative mb-4">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-gray-400 truncate">
            {file ? <span className="font-mono text-blue-300">{file.name}</span> : <span>Click to select file</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 font-bold mb-1 uppercase">Expires In</label>
            <select 
              value={expireHours}
              onChange={(e) => setExpireHours(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
            >
              <option value="1">1 Hour</option>
              <option value="24">1 Day</option>
              <option value="72">3 Days</option>
              <option value="168">7 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-bold mb-1 uppercase">Max Downloads</label>
            <input 
              type="number"
              placeholder="Infinite"
              min="1"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-500 font-bold mb-1 uppercase">
            Password Protection (Optional)
          </label>
          <input 
            type="password"
            placeholder="Set a password to download"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 outline-none placeholder-gray-600"
          />
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