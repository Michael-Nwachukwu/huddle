// import { NextApiRequest, NextApiResponse } from 'next';
// import { Client, FileCreateTransaction, FileAppendTransaction, PrivateKey, Hbar } from '@hashgraph/sdk';
// import formidable, { Files } from 'formidable';
// import fs from 'fs';

// // Disable Next.js body parser to handle multipart/form-data
// export const config = {
//     api: {
//         bodyParser: false,
//     },
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }

//     // Parse form data
//     const form = formidable({ multiples: false });
//     form.parse(req, async (err, fields, files: Files) => {
//         if (err) {
//             return res.status(500).json({ error: 'Failed to parse form data' });
//         }

//         const file = Array.isArray(files.file) ? files.file[0] : files.file;
//         if (!file) {
//             return res.status(400).json({ error: 'No file uploaded' });
//         }

//         try {
//             // Environment variables (store securely, e.g., in .env.local)
//             const operatorId = process.env.OPERATOR_ID || '';
//             const operatorKey = process.env.OPERATOR_KEY || '';
//             const fileKey = PrivateKey.fromString(process.env.FILE_KEY || PrivateKey.generateED25519().toString()); // Generate or use stored key

//             // Read file contents
//             const fileContents = fs.readFileSync(file.filepath);
//             const fileName = file.originalFilename || 'unknown';

//             // Initialize Hedera client
//             const client = Client.forTestnet().setOperator(operatorId, operatorKey);

//             // Check file size
//             const maxCreateSize = 1024; // 1 KB
//             const maxTotalSize = 1024 * 1024; // 1 MB
//             if (fileContents.length > maxTotalSize) {
//                 throw new Error('File exceeds 1 MB; use off-chain storage (e.g., IPFS)');
//             }

//             // Create file with first chunk (up to 1 KB)
//             const transaction = await new FileCreateTransaction()
//                 .setKeys([fileKey.publicKey])
//                 .setContents(fileContents.slice(0, maxCreateSize))
//                 .setFileMemo(fileName)
//                 .setMaxTransactionFee(new Hbar(2))
//                 .freezeWith(client);

//             // Sign and execute
//             const signTx = await transaction.sign(fileKey);
//             const submitTx = await signTx.execute(client);
//             const receipt = await submitTx.getReceipt(client);
//             const fileId = receipt.fileId?.toString();

//             if (!fileId) {
//                 throw new Error('Failed to get File ID');
//             }

//             // Append remaining chunks if file > 1 KB
//             if (fileContents.length > maxCreateSize) {
//                 const chunkSize = 6144; // Safe chunk size for append
//                 for (let i = maxCreateSize; i < fileContents.length; i += chunkSize) {
//                     const chunk = fileContents.slice(i, i + chunkSize);
//                     const appendTx = await new FileAppendTransaction()
//                         .setFileId(fileId)
//                         .setContents(chunk)
//                         .setMaxTransactionFee(new Hbar(2))
//                         .freezeWith(client);

//                     const signAppendTx = await appendTx.sign(fileKey);
//                     await signAppendTx.execute(client);
//                 }
//                 console.log(`Appended ${fileContents.length - maxCreateSize} bytes to File ID: ${fileId}`);
//             }

//             console.log(`File uploaded: ${fileId}`);
//             return res.status(200).json({ fileId });
//         } catch (error: any) {
//             console.error('Upload failed:', error);
//             return res.status(500).json({ error: error.message });
//         }
//     });
// }