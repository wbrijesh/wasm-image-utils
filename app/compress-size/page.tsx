"use client";

import { useEffect, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InputFile({ onFileSelect }: any) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="file-input">Select Image</Label>
      <Input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default function Home() {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState("");
  const [originalFileSizeBytes, setOriginalFileSizeBytes] = useState(0);
  const [compressedFileSize, setCompressedFileSize] = useState("");
  const [compressedFileSizeBytes, setCompressedFileSizeBytes] = useState(0);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";
        await ffmpegInstance.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        setFFmpeg(ffmpegInstance);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
        setError("Failed to load FFmpeg");
      }
    };

    loadFFmpeg();

    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const humanFileSize = (size: number) => {
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  };

  const compressImage = async (file: File) => {
    if (!ffmpeg || !file) return;

    try {
      setCompressing(true);
      setError(null);

      const inputFileName = "input_" + file.name;
      const outputFileName = `${file.name.split(".")[0]}-compressed.${file.name.split(".").pop()}`;

      const fileData = await file.arrayBuffer();
      await ffmpeg.writeFile(inputFileName, new Uint8Array(fileData));
      await ffmpeg.exec(["-i", inputFileName, "-q:v", "20", outputFileName]);
      const data = await ffmpeg.readFile(outputFileName);

      const url = URL.createObjectURL(new Blob([data], { type: file.type }));

      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      setDownloadUrl(url);
      setDownloadFileName(outputFileName);
      setCompressedFileSize(humanFileSize(data.length));
      setCompressedFileSizeBytes(data.length);
      setCompressing(false);
    } catch (error) {
      console.error("Error during compression:", error);
      setError(
        `Error during compression: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setCompressing(false);
    }
  };

  const handleCompress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput =
      form.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput?.files?.length) {
      setError("Please select a file");
      return;
    }

    const file = fileInput.files[0];
    await compressImage(file);
  };

  const handleFileSelect = (file: File) => {
    setOriginalFileName(file.name);
    setOriginalFileSize(humanFileSize(file.size));
    setOriginalFileSizeBytes(file.size);
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <main>
      <title>Compress Size | Image Utilities</title>
      <h1 className="text-xl font-medium text-gray-900 mb-8">Compress Size</h1>

      <form onSubmit={handleCompress} className="space-y-6">
        <div className="space-y-4">
          <InputFile onFileSelect={handleFileSelect} />

          {originalFileName && (
            <div className="text-sm text-gray-700">
              <p>Original File: {originalFileName}</p>
              <p>Size: {originalFileSize}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {isLoading ? (
            <p className="text-sm">loading ffmpeg...</p>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !originalFileName || downloadUrl !== ""}
              className="flex justify-center py-[5px] px-[10px] border border-transparent
                       rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600
                       hover:bg-blue-700 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors duration-200"
            >
              Compress Image
            </button>
          )}

          {originalFileName && (
            <button
              type="button"
              onClick={handleReset}
              className="flex justify-center py-[5px] px-[10px] border border-transparent
                         rounded-md shadow-sm text-sm font-semibold text-white bg-gray-600
                         hover:bg-gray-700 focus:outline-none focus:ring-2
                         focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors duration-200"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {compressing && (
          <div className="rounded-md p-4 transition-colors duration-200 inline-block">
            <p className="text-sm text-gray-400">Compressing...</p>
          </div>
        )}

        {error && (
          <div className="rounded-md p-4 transition-colors duration-200 inline-block">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {downloadUrl && (
          <div className="text-sm text-gray-700">
            <p>Compressed File: {downloadFileName}</p>
            <p>Size: {compressedFileSize}</p>
            <p>
              Compression Ratio:{" "}
              {(
                ((originalFileSizeBytes - compressedFileSizeBytes) /
                  originalFileSizeBytes) *
                100
              ).toFixed(2)}
              % reduction
            </p>
            {compressedFileSizeBytes > originalFileSizeBytes && (
              <p className="text-yellow-600 mt-2">
                Note: Compressed file is larger than the original file
              </p>
            )}
          </div>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadFileName}
            className="inline-block text-center py-[5px] px-[10px] rounded-md shadow-sm
                       text-sm font-medium text-white bg-green-600 hover:bg-green-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       focus:ring-green-500 transition-colors duration-200"
          >
            Download Compressed Image
          </a>
        )}
      </div>
    </main>
  );
}
