import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { CheckCircle2, Download, FileText, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";

interface FileDetailsModalProps {
	isFileModalOpen: boolean;
	setIsFileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	fileIdToRetrieve: string;
}

// Format file size
const formatFileSize = (bytes: number) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FileDetailsModal = ({ isFileModalOpen, setIsFileModalOpen, fileIdToRetrieve }: FileDetailsModalProps) => {
	const [fileRetrieveStatus, setFileRetrieveStatus] = useState<string>("");
	const [retrieving, setRetrieving] = useState(false);
	const [retrievedFile, setRetrievedFile] = useState<{
		fileId?: string;
		contents?: string;
		size?: number;
	} | null>(null);

	// Handle file download
	const handleDownloadFile = () => {
		if (retrievedFile?.contents && retrievedFile?.fileId) {
			const blob = new Blob([retrievedFile.contents], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `file-${retrievedFile.fileId}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	};

	const fetchFileDetails = async (fileIdToRetrieve: string) => {
		// const fileIdToRetrieve = result?.fileId || "0.0.6892578"; // Use uploaded fileId or fallback

		setRetrieving(true);
		setFileRetrieveStatus("Retrieving file from Hedera...");
		setRetrievedFile(null); // Reset previous file data

		try {
			const response = await fetch(`/api/retrieve-file?fileId=${fileIdToRetrieve}`, {
				method: "GET",
			});

			const data = await response.json();

			if (data.success) {
				setFileRetrieveStatus(`File retrieved successfully!`);
				setRetrievedFile({
					fileId: data.fileId,
					contents: data.contents,
					size: data.size,
				});
			} else {
				setFileRetrieveStatus(`Retrieval failed: ${data.error}`);
				if (data.details) {
					console.error("Retrieval details:", data.details);
				}
			}
		} catch (err: any) {
			setFileRetrieveStatus(`Retrieval failed: ${err.message}`);
			console.error("Retrieval error:", err);
		} finally {
			setRetrieving(false);
		}
	};

	useEffect(() => {
		if (fileIdToRetrieve) {
			fetchFileDetails(fileIdToRetrieve);
		}
	}, [fileIdToRetrieve]);
	return (
		<Dialog
			open={isFileModalOpen}
			onOpenChange={setIsFileModalOpen}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						File Attachment
					</DialogTitle>
					<DialogDescription>{retrievedFile?.fileId && `File ID: ${retrievedFile.fileId}`}</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-hidden flex flex-col space-y-4">
					{/* File Info */}
					{retrievedFile && (
						<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
							<div className="flex items-center gap-3">
								<FileText className="h-6 w-6 text-muted-foreground" />
								<div>
									<p className="font-medium text-sm">Attachment File</p>
									<p className="text-xs text-muted-foreground">{retrievedFile.size && formatFileSize(retrievedFile.size)}</p>
								</div>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleDownloadFile()}
								disabled={!retrievedFile.contents}>
								<Download className="h-4 w-4 mr-2" />
								Download
							</Button>
						</div>
					)}

					{/* Loading State */}
					{retrieving && (
						<div className="flex items-center justify-center p-8">
							<div className="flex items-center gap-3">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span className="text-sm text-muted-foreground">{fileRetrieveStatus}</span>
							</div>
						</div>
					)}

					{/* Error State */}
					{!retrieving && fileRetrieveStatus.includes("failed") && (
						<div className="flex items-center justify-center p-8">
							<div className="text-center">
								<X className="h-12 w-12 text-destructive mx-auto mb-2" />
								<p className="text-sm text-destructive">{fileRetrieveStatus}</p>
							</div>
						</div>
					)}

					{/* File Content */}
					{!retrieving && retrievedFile?.contents && (
						<div className="flex-1 overflow-auto">
							<div className="p-4 bg-muted rounded-lg">
								<h4 className="font-medium text-sm mb-3">File Contents:</h4>
								<pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground max-h-96 overflow-auto">{retrievedFile.contents}</pre>
							</div>
						</div>
					)}

					{/* Success State without Content */}
					{!retrieving && fileRetrieveStatus.includes("successfully") && !retrievedFile?.contents && (
						<div className="flex items-center justify-center p-8">
							<div className="text-center">
								<CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
								<p className="text-sm text-green-600">{fileRetrieveStatus}</p>
								<p className="text-xs text-muted-foreground mt-1">File retrieved but no content to display</p>
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button
						variant="outline"
						onClick={() => setIsFileModalOpen(false)}>
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FileDetailsModal;
