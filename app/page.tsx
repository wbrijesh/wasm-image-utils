import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <main>
      <title>Image Utilities</title>
      <h1 className="text-xl font-medium text-gray-900 mb-4">
        About This Site
      </h1>
      <p className="text-sm text-gray-700 max-w-2xl mb-1">
        Most image utilities sites use ads to cover their server costs.{" "}
      </p>
      <p className="text-sm text-gray-700 max-w-xl mb-1">
        This site runs entirely on your device. This way you can use it without
        any ads and your images never leave your device.
      </p>
      <p className="text-sm text-gray-700 max-w-xl mb-1">
        Built using
        <Link href="https://webassembly.org/" className="text-blue-500">
          {" "}
          WebAssembly{" "}
        </Link>
        and
        <Link href="https://ffmpeg.org/" className="text-blue-500">
          {" "}
          FFmpeg{" "}
        </Link>
      </p>
    </main>
  );
}
