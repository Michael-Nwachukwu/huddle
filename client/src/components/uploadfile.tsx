// components/FileUploadForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";

export default function FileUploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [retrieving, setRetrieving] = useState(false);
    const [result, setResult] = useState<{
        fileId?: string;
        fileKeyPrivate?: string;
        fileKeyPublic?: string;
    } | null>(null);
    const [retrievedFile, setRetrievedFile] = useState<{
        fileId?: string;
        contents?: string;
        size?: number;
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null);
            setStatus("");
            setRetrievedFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("client starting, ready to send to route");
        if (!file) {
            setStatus("No file selected.");
            return;
        }

        console.log("client side file", file);

        setUploading(true);
        setStatus("Uploading to Hedera...");

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setStatus(`File uploaded successfully!`);
                setResult({
                    fileId: data.fileId,
                    fileKeyPrivate: data.fileKeyPrivate,
                    fileKeyPublic: data.fileKeyPublic,
                });
            } else {
                setStatus(`Upload failed: ${data.error}`);
                if (data.details) {
                    console.error('Upload details:', data.details);
                }
            }
        } catch (err: any) {
            setStatus(`Upload failed: ${err.message}`);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const fetchFileDetails = async () => {
        const fileIdToRetrieve = result?.fileId || "0.0.6892578"; // Use uploaded fileId or fallback
        
        setRetrieving(true);
        setStatus("Retrieving file from Hedera...");

        try {
            const response = await fetch(`/api/retrieve-file?fileId=${fileIdToRetrieve}`, {
                method: 'GET',
            });

            const data = await response.json();

            if (data.success) {
                setStatus(`File retrieved successfully!`);
                setRetrievedFile({
                    fileId: data.fileId,
                    contents: data.contents,
                    size: data.size,
                });
            } else {
                setStatus(`Retrieval failed: ${data.error}`);
                if (data.details) {
                    console.error('Retrieval details:', data.details);
                }
            }
        } catch (err: any) {
            setStatus(`Retrieval failed: ${err.message}`);
            console.error('Retrieval error:', err);
        } finally {
            setRetrieving(false);
        }
    };

    // Alternative method using POST
    const fetchFileDetailsPost = async () => {
        const fileIdToRetrieve = result?.fileId || "0.0.6892578";
        
        setRetrieving(true);
        setStatus("Retrieving file from Hedera...");

        try {
            const response = await fetch('/api/retrieve-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileId: fileIdToRetrieve }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus(`File retrieved successfully!`);
                setRetrievedFile({
                    fileId: data.fileId,
                    contents: data.contents,
                    size: data.size,
                });
            } else {
                setStatus(`Retrieval failed: ${data.error}`);
                if (data.details) {
                    console.error('Retrieval details:', data.details);
                }
            }
        } catch (err: any) {
            setStatus(`Retrieval failed: ${err.message}`);
            console.error('Retrieval error:', err);
        } finally {
            setRetrieving(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-stone-600 text-white rounded-lg shadow-md m-3">
            <h2 className="text-xl font-semibold mb-4">Upload File to Hedera</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        disabled={uploading}
                    />
                    {file && (
                        <p className="text-sm text-gray-100 mt-1">
                            File size: {(file.size / 1024).toFixed(2)} KB
                            {file.size > 1024 && " (will use append method)"}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {uploading ? "Uploading..." : "Upload to Hedera"}
                </button>
            </form>

            {status && (
                <div className={`mt-4 p-3 rounded ${status.includes('successfully')
                        ? 'bg-green-100 text-green-800'
                        : status.includes('failed')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}>
                    {status}
                </div>
            )}

            {result && (
                <div className="mt-4 p-3 bg-stone-700 text-white rounded">
                    <h3 className="font-semibold mb-2">Upload Result:</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>File ID:</strong>
                            <code className="ml-2 bg-gray-600 p-1 rounded">{result.fileId}</code>
                        </div>
                        <div>
                            <strong>File Key (Private):</strong>
                            <code className="ml-2 bg-gray-600 p-1 rounded text-xs break-all">
                                {result.fileKeyPrivate}
                            </code>
                        </div>
                        <div>
                            <strong>File Key (Public):</strong>
                            <code className="ml-2 bg-gray-600 p-1 rounded text-xs break-all">
                                {result.fileKeyPublic}
                            </code>
                        </div>
                    </div>
                    <p className="text-xs text-red-400 mt-2">
                        ⚠️ Store the private key securely - you&apos;ll need it to access/modify the file!
                    </p>
                </div>
            )}

            <div className="mt-4 space-y-2">
                <Button 
                    onClick={fetchFileDetails}
                    disabled={retrieving}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {retrieving ? "Retrieving..." : "Get File (GET)"}
                </Button>
                
                <Button 
                    onClick={fetchFileDetailsPost}
                    disabled={retrieving}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    {retrieving ? "Retrieving..." : "Get File (POST)"}
                </Button>
            </div>

            {retrievedFile && (
                <div className="mt-4 p-3 bg-stone-700 text-white rounded">
                    <h3 className="font-semibold mb-2">Retrieved File:</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>File ID:</strong>
                            <code className="ml-2 bg-gray-600 p-1 rounded">{retrievedFile.fileId}</code>
                        </div>
                        <div>
                            <strong>Size:</strong>
                            <span className="ml-2">{retrievedFile.size} bytes</span>
                        </div>
                        <div>
                            <strong>Contents:</strong>
                            <pre className="mt-2 bg-gray-600 p-2 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {retrievedFile.contents}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}