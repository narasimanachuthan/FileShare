const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function generateKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile(file) {
    const key = await generateKey();
    console.log("Key Generated")
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();
    const encryptBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        fileBuffer,
    );
    const combinedBuffer = new Uint8Array(iv.byteLength + encryptBuffer.byteLength);
    combinedBuffer.set(iv);
    combinedBuffer.set(new Uint8Array(encryptBuffer), iv.byteLength);

    const encryptedBlob = new Blob([combinedBuffer], { type: "application/octet-stream" });

    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const keyArray = Array.from(new Uint8Array(exportedKey));
    const keyBase64 = btoa(String.fromCharCode.apply(null, keyArray));

    return { encryptedBlob, keyBase64 };
}

export async function uploadFile(file) {
    console.log("Encrypting File")
    const { encryptedBlob, keyBase64 } = await encryptFile(file);

    const params = new URLSearchParams({
        filename: file.name,
        content_type: file.type || "application/octect-stream",
        size: file.size
    })

    console.log("Requesting SAS Token")
    const sasResponse = await fetch(`${API_BASE_URL}/request-upload?${params.toString()}`, {
        method: "POST",
    });

    if (!sasResponse.ok) {
        throw new Error("Failed to get SAS Token")
    }

    const { upload_url, file_id } = await sasResponse.json();
    console.log("Recieved SAS Token")
    
    console.log("Uploading to Azure")
    const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": "application/octet-stream",
        },
        body: encryptedBlob,
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload to Azure")
    }

    console.log("Uplaod Complete");
    return { key: keyBase64, fileId: file_id};
}

async function importKey(keyBase64) {
    const binaryString = window.atob(keyBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i=0; i<len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
        "raw",
        bytes,
        { name: "AES-GCM"},
        true,
        ["decrypt"],
    );
}

export async function downloadFile(fileId, keyBase64) {
    console.log("Requesting Read Access")
    const response = await fetch(`${API_BASE_URL}/file/${fileId}`);

    if (!response.ok) {
        throw new Error("File not found/expired")
    }

    const { download_url, filename } = await response.json();

    console.log("Downloading File")
    const blobResponse = await fetch(download_url);
    if (!blobResponse.ok) {
        throw new Error("Failed to download from Azure");
    }
    const encryptedArrayBuffer = await blobResponse.arrayBuffer();

    console.log("Decrypting File")
    const iv = encryptedArrayBuffer.slice(0, 12);
    const data = encryptedArrayBuffer.slice(12);
    const key = await importKey(keyBase64);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(iv),
            },
            key,
            data,
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
        throw new Error("Decryption failed!");
    }
}