"use client";
import { useState, useEffect } from "react";
import React from "react";

export function SlidingImages() {
  const [i, setI] = useState(0);
  const images = ["/img1.jpg", "/img2.jpg", "/img3.jpg", "/img4.jpg"];
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-1/2 w-1/2">
      <img src={images[i]} className="h-1/2 w-1/2" alt="" />
    </div>
  );
}
