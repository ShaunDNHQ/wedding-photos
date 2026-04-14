"use client";

import { useEffect, useState } from "react";

type GalleryFile = {
  id: string;
  name?: string;
  createdTime?: string;
  url: string;
};

export default function WeddingPage() {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function loadGallery() {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    const data = await res.json();
    setFiles(data.files || []);
  }

  useEffect(() => {
    loadGallery();
    const timer = setInterval(loadGallery, 8000);
    return () => clearInterval(timer);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || !selected.length) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      Array.from(selected).forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: code ? { "x-gallery-pin": code } : {},
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Upload failed.");
      } else {
        setMessage("Photos uploaded successfully.");
        await loadGallery();
        e.target.value = "";
      }
    } catch {
      setMessage("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="wedding-page">
      <section className="hero">
        <p className="eyebrow">Shaun &amp; Sharon</p>
        <h1>Share your wedding photos</h1>
        <p className="intro">
          We would love to see the day through your eyes. Upload your photos
          below and enjoy the live gallery.
        </p>

<div className="upload-actions">
  <label className="upload-button" htmlFor="gallery-upload">
    Choose from gallery
  </label>
  <input
    id="gallery-upload"
    type="file"
    accept="image/*"
    multiple
    onChange={handleUpload}
    disabled={uploading}
    className="visually-hidden-input"
  />

  <label className="upload-button secondary" htmlFor="camera-upload">
    Take photo
  </label>
  <input
    id="camera-upload"
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleUpload}
    disabled={uploading}
    className="visually-hidden-input"
  />
</div>
        
        <div className="upload-card">
          <div className="upload-row">

            
            
            <label className="upload-button">
              {uploading ? "Uploading..." : "Upload photos"}
              
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />
            </label>

            <input
              className="code-input"
              type="text"
              placeholder="Event code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {message ? <p className="status-message">{message}</p> : null}
        </div>
      </section>

      <section className="gallery-section">
        <h2>Live gallery</h2>
        <div className="gallery-grid">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="gallery-item"
            >
              <img src={file.url} alt={file.name || "Wedding photo"} loading="lazy" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
