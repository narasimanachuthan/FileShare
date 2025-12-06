const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function importKey(keyBase64) {
  const binaryString = window.atob(keyBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return window.crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );
}

async function decryptAndSave(downloadUrl, keyBase64, filename) {
  console.log("Downloading encrypted blob...");
  const blobResponse = await fetch(downloadUrl);
  if (!blobResponse.ok) throw new Error("Failed to download file data");
  
  const encryptedArrayBuffer = await blobResponse.arrayBuffer();

  console.log("Decrypting...");
  const iv = encryptedArrayBuffer.slice(0, 12);
  const data = encryptedArrayBuffer.slice(12);
  const key = await importKey(keyBase64);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      data
    );
    
    const decryptedBlob = new Blob([decryptedBuffer]);
    const url = window.URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (e) {
    console.error(e);
    throw new Error("Decryption failed! Wrong Key?");
  }
}

export async function uploadFile(file, options = {}) {
  const { expireHours = 24, maxDownloads = null, password = null } = options;

  console.log("Encrypting file locally...");
  
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv }, key, fileBuffer
  );

  const combinedBuffer = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
  combinedBuffer.set(iv);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.byteLength);
  const encryptedBlob = new Blob([combinedBuffer], { type: "application/octet-stream" });

  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  const keyBase64 = bufferToBase64(exportedKey);
  
  console.log("Requesting SAS Token...");
  
  const params = new URLSearchParams({
    filename: file.name,
    content_type: file.type || "application/octet-stream",
    size: file.size,
    expire_hours: expireHours,
  });
  if (maxDownloads) params.append("max_downloads", maxDownloads);
  if (password) params.append("password", password);

  const sasResponse = await fetch(`${API_BASE_URL}/request-upload?${params.toString()}`, {
    method: "POST",
  });

  if (!sasResponse.ok) throw new Error("Failed to get SAS Token");

  const { upload_url, file_id } = await sasResponse.json();

  console.log(`Uploading to Azure as ID: ${file_id}...`);
  const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "application/octet-stream",
    },
    body: encryptedBlob, 
  });

  if (!uploadResponse.ok) throw new Error("Azure rejected the upload");

  return { key: keyBase64, fileId: file_id };
}

export async function downloadFile(fileId, keyBase64) {
  const response = await fetch(`${API_BASE_URL}/file/${fileId}`);
  
  if (!response.ok) {
    if (response.status === 403) throw new Error("Password required");
    if (response.status === 410) throw new Error("File expired");
    throw new Error("File not found or server error");
  }
  
  const { download_url, filename } = await response.json();
  
  return decryptAndSave(download_url, keyBase64, filename);
}

export async function downloadProtectedFile(fileId, password, keyBase64, filename) {
  console.log("Verifying password...");
  
  const response = await fetch(`${API_BASE_URL}/file/${fileId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password })
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Incorrect Password");
    if (response.status === 410) throw new Error("File expired");
    throw new Error("Verification failed");
  }

  const { download_url } = await response.json();
  
  return decryptAndSave(download_url, keyBase64, filename);
}