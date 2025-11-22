import { useState } from 'react';
import { uploadFile } from './uploadService';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(""); // New State
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("🔒 Encrypting & Uploading...");
    setEncryptionKey(""); // Reset

    try {
      // The uploadService now returns the Secret Key
      const key = await uploadFile(file);
      
      setEncryptionKey(key);
      setStatus("✅ Upload Successful!");
    } catch (error) {
      console.error(error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Project Aegis <span className="text-xs text-gray-500 border border-gray-600 rounded px-2 py-0.5">E2EE</span></h1>
        
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-gray-400">
            {file ? (
              <span className="font-mono text-blue-300">{file.name}</span>
            ) : (
              <span>Click to encrypt & upload</span>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`mt-6 w-full py-3 rounded-lg font-bold transition-all
            ${uploading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/50'
            }`}
        >
          {uploading ? 'Processing...' : 'Secure Upload'}
        </button>

        {/* Status & Result */}
        {status && (
          <div className="mt-4 p-3 rounded bg-gray-900 text-sm text-center font-mono border border-gray-700">
            {status}
          </div>
        )}

        {/* The "Magic Link" Section */}
        {encryptionKey && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400 uppercase font-bold mb-2">Decryption Key (Save This!)</p>
            <div className="break-all font-mono text-xs bg-black p-2 rounded text-green-300 select-all">
              {encryptionKey}
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              *The server does not have this key. If you lose it, the file is gone.*
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;