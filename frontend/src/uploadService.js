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

    console.log("Requesting SAS Token")
    const sasResponse = await fetch(`${API_BASE_URL}/request-upload?filename=${file.name}`, {
        method: "POST",
    });

    if (!sasResponse.ok) {
        throw new Error("Failed to get SAS Token")
    }

    const { upload_url } = await sasResponse.json();
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
    return keyBase64;
}