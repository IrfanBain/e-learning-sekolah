import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid'; 

const s3Client = new S3Client({
 region: "auto",
 endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
 credentials: {
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
 },
});

export async function POST(request: Request) {
 try {

    const { contentType, fileExtension, prefix, fileName } = await request.json();
    const allowedPrefixes = ["user_photo", "homework_attachments", "homework_submissions"];
    if (!prefix || !allowedPrefixes.includes(prefix)) {
        return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
    }
  if (!contentType || !fileExtension || !fileName) {
   return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const fileId = uuidv4();
  const key = `${prefix}/${fileId}.${fileExtension}`; 
  
  const command = new PutObjectCommand({
   Bucket: process.env.R2_BUCKET_NAME,
   Key: key, 
   ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  
  const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ 
        uploadUrl, 
        fileUrl,
        key: key,    
        namaFile: fileName 
    });

 } catch (error) {
  console.error("Error creating presigned URL: ", error);
  return NextResponse.json({ error: "Gagal membuat URL upload" }, { status: 500 });
 }
}
