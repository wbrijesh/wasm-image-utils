"use client";

import { useEffect, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState("");
  const [convertedFileSize, setConvertedFileSize] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [availableFormats, setAvailableFormats] = useState([
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPEG" },
    { value: "webp", label: "WebP" },
    { value: "gif", label: "GIF" },
    { value: "bmp", label: "BMP" },
    { value: "tiff", label: "TIFF" },
    { value: "ico", label: "ICO" },
    { value: "avif", label: "AVIF" },
    { value: "heic", label: "HEIC" },
  ]);

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

  const convertImage = async (file: File, format: string) => {
    if (!ffmpeg || !file) return;

    try {
      setConverting(true);
      setError(null);

      const inputFileName = "input_" + file.name;
      const outputFileName = `${file.name.split(".")[0]}-new.${format}`;

      const fileData = await file.arrayBuffer();
      await ffmpeg.writeFile(inputFileName, new Uint8Array(fileData));
      await ffmpeg.exec(["-i", inputFileName, outputFileName]);
      const data = await ffmpeg.readFile(outputFileName);

      const url = URL.createObjectURL(
        new Blob([data], { type: `image/${format}` }),
      );

      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      setDownloadUrl(url);
      setDownloadFileName(outputFileName);
      setConvertedFileSize(humanFileSize(data.length));
      setConverting(false);
    } catch (error) {
      console.error("Error during conversion:", error);
      setError(
        `Error during conversion: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setConverting(false);
    }
  };

  const handleConvert = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput =
      form.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput?.files?.length || !selectedFormat) {
      setError("Please select a file and format");
      return;
    }

    const file = fileInput.files[0];
    await convertImage(file, selectedFormat);
  };

  const handleFileSelect = (file: File) => {
    setOriginalFileName(file.name);
    setOriginalFileSize(humanFileSize(file.size));

    // Get the current format and filter it out from available formats
    const currentFormat = file.name.split(".").pop()?.toLowerCase();
    setAvailableFormats((prev) =>
      prev.filter((format) => format.value !== currentFormat),
    );
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <main>
      <title>Convert Format | Image Utilities</title>
      <h1 className="text-xl font-medium text-gray-900 mb-8">Convert Format</h1>

      <form onSubmit={handleConvert} className="space-y-6">
        <div className="space-y-4">
          <InputFile onFileSelect={handleFileSelect} />

          {originalFileName && (
            <div className="text-sm text-gray-700">
              <p>Original File: {originalFileName}</p>
              <p>Size: {originalFileSize}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="format-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Convert To
            </label>
            <Select onValueChange={setSelectedFormat}>
              <SelectTrigger className="max-w-40">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Formats</SelectLabel>
                  {availableFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
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
              Convert Image
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
        {converting && (
          <div className="rounded-md p-4 transition-colors duration-200 inline-block">
            <p className="text-sm text-gray-400">Converting...</p>
          </div>
        )}

        {error && (
          <div className="rounded-md p-4 transition-colors duration-200 inline-block">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {downloadUrl && (
          <div className="text-sm text-gray-700">
            <p>Converted File: {downloadFileName}</p>
            <p>Size: {convertedFileSize}</p>
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
            Download {downloadFileName.split(".").pop()?.toUpperCase()} Image
          </a>
        )}
      </div>
    </main>
  );
}
