"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

const NavigationBar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav>
      <div className="flex gap-4 justify-between -mx-5 -mt-5 bg-gray-300 px-5 py-2 mb-5 text-sm">
        <div className="flex gap-4">
          <Link
            href="/"
            className={pathname === "/" ? "text-black" : "text-gray-500"}
          >
            About
          </Link>
          <Link
            href="/convert-format"
            className={
              pathname === "/convert-format" ? "text-black" : "text-gray-500"
            }
          >
            Convert Format
          </Link>
          <Link
            href="/compress-size"
            className={
              pathname === "/compress-size" ? "text-black" : "text-gray-500"
            }
          >
            Compress Size
          </Link>
        </div>
        <Link
          href="https://github.com/wbrijesh/wasm-image-utils"
          className="text-blue-700"
        >
          View Source Code
        </Link>
      </div>
    </nav>
  );
};

export default NavigationBar;
