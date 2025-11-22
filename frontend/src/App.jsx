import { useState } from 'react';
import { uploadFile, downloadFile } from './uploadService';

function App() {
  const [mode, setMode] = useState('upload'); // 'upload' or 'download'
  
  // --- UPLOAD STATE ---
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  
  const [generatedKey, setGeneratedKey] = useState("");
  const [generatedFileId, setGeneratedFileId] = useState("");

  // --- DOWNLOAD STATE ---
  const [downloadId, setDownloadId] = useState(""); 
  const [downloadKey, setDownloadKey] = useState(""); 
  const [downloadName, setDownloadName] = useState(""); 
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");

  // --- HANDLERS ---

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus("🔒 Encrypting & Uploading...");
    
    // Reset previous results
    setGeneratedKey("");
    setGeneratedFileId("");

    try {
      const { key, fileId } = await uploadFile(file);
      
      setGeneratedKey(key);
      setGeneratedFileId(fileId);
      setUploadStatus("✅ Success!");
    } catch (error) {
      console.error(error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadId || !downloadKey || !downloadName) {
      setDownloadStatus("⚠️ Please fill in all fields");
      return;
    }

    setDownloading(true);
    setDownloadStatus("g Retrieving & Decrypting...");

    try {
      // Pass the UUID, the Key, and the Filename to the service
      await downloadFile(downloadId, downloadKey, downloadName);
      setDownloadStatus("✅ Downloaded successfully!");
    } catch (error) {
      console.error(error);
      setDownloadStatus(`❌ Error: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400 tracking-tight">
          Project Aegis <span className="text-xs align-top bg-gray-700 text-gray-300 px-2 py-0.5 rounded ml-2">v2</span>
        </h1>

        {/* TABS */}
        <div className="flex mb-6 border-b border-gray-700">
          <button 
            onClick={() => setMode('upload')}
            className={`flex-1 py-3 font-bold transition-colors ${
              mode === 'upload' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Upload
          </button>
          <button 
            onClick={() => setMode('download')}
            className={`flex-1 py-3 font-bold transition-colors ${
              mode === 'download' 
                ? 'text-green-400 border-b-2 border-green-400 bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Download
          </button>
        </div>

        {/* === UPLOAD MODE === */}
        {mode === 'upload' && (
          <div className="animate-fade-in">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative mb-4">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-gray-400 truncate">
                {file ? (
                  <span className="font-mono text-blue-300">{file.name}</span>
                ) : (
                  <span>Click to select a file</span>
                )}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`w-full py-3 rounded-lg font-bold transition-all
                ${uploading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/50'
                }`}
            >
              {uploading ? 'Processing...' : 'Secure Upload'}
            </button>

            {uploadStatus && (
              <p className="mt-4 text-center text-sm font-mono text-gray-300">{uploadStatus}</p>
            )}
            
            {/* RESULTS BOX */}
            {generatedKey && generatedFileId && (
              <div className="mt-6 bg-black/50 p-4 rounded-lg border border-green-500/30 text-left shadow-inner">
                
                <div className="mb-4">
                  <p className="text-[10px] text-green-500 mb-1 uppercase font-bold tracking-wider">1. File ID (UUID)</p>
                  <div 
                    className="font-mono text-xs text-white bg-gray-900 p-2 rounded border border-gray-700 select-all cursor-text break-all"
                    onClick={(e) => e.target.select()}
                  >
                    {generatedFileId}
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-red-400 mb-1 uppercase font-bold tracking-wider">2. Decryption Key (Secret)</p>
                  <div 
                    className="font-mono text-xs text-red-300 bg-gray-900 p-2 rounded border border-gray-700 select-all cursor-text break-all"
                    onClick={(e) => e.target.select()}
                  >
                    {generatedKey}
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-500 mt-3 italic text-center">
                  Save these! If you lose them, the file is gone forever.
                </p>
              </div>
            )}
          </div>
        )}

        {/* === DOWNLOAD MODE === */}
        {mode === 'download' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-1">File ID</label>
              <input 
                placeholder="e.g. 550e8400-e29b..." 
                value={downloadId}
                onChange={(e) => setDownloadId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white font-mono text-sm focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Decryption Key</label>
              <input 
                placeholder="Paste your key here..." 
                value={downloadKey}
                onChange={(e) => setDownloadKey(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white font-mono text-xs focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Original Filename</label>
              <input 
                placeholder="e.g. document.pdf" 
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white text-sm focus:border-green-500 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-500 mt-1">Needed to set the file extension correctly.</p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`w-full py-3 rounded-lg font-bold transition-all mt-2
                ${downloading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 shadow-lg hover:shadow-green-500/50'
                }`}
            >
              {downloading ? 'Decrypting...' : 'Decrypt & Download'}
            </button>

            {downloadStatus && (
              <p className="mt-4 text-center text-sm font-mono text-gray-300">{downloadStatus}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;