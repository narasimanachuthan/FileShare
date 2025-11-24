import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { downloadFile } from '../uploadService';

export default function DownloadPage() {
  const { fileId } = useParams();
  const [status, setStatus] = useState("Waiting for user...");
  const [filename, setFilename] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  const keyBase64 = window.location.hash.slice(1);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/file/${fileId}`);
        if (!response.ok) throw new Error("File not found or expired");
        const data = await response.json();
        setFilename(data.filename);
        setStatus("Ready to decrypt");
      } catch (err) {
        setStatus(err.message);
        setError(true);
      }
    }
    if (fileId) fetchMetadata();
  }, [fileId]);

  const handleDownload = async () => {
    if (!keyBase64) {
      setStatus("❌ Error: Decryption key missing from URL");
      return;
    }

    setDownloading(true);
    setStatus("Downloading & Decrypting...");

    try {
      await downloadFile(fileId, keyBase64);
      setStatus("✅ Download Complete!");
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 text-center">
        <h1 className="text-xl font-bold mb-6 text-blue-400">Secure File Transfer</h1>

        {error ? (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {status}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-400 text-sm uppercase font-bold mb-2">File Ready</p>
              <div className="text-2xl font-mono text-white truncate px-4">
                {filename || "Loading..."}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || !filename}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all
                ${downloading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 shadow-lg hover:shadow-green-500/50'
                }`}
            >
              {downloading ? 'Decrypting...' : 'Unlock & Download'}
            </button>

            <p className="mt-4 text-sm text-gray-500 font-mono">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}