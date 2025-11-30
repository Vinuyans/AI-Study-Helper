import { useState } from "react";

export default function MultiFileUpload() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };
  const uploadFiles = async () => {
    if (!files || files.length === 0) {
      return setStatus("No files selected");
    }
    const formData = new FormData();
    for (const f of files) formData.append("files", f);
    setStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:5000/api/file/upload", {
        method: "POST",
        body: formData,
        keepalive: true,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setStatus(`Uploaded ${data.count} files successfully.`);
    } catch (err) {
      console.error(err);
      setStatus("Error uploading files.");
    }
  };

  return (
    <div className="p-4">
      <h2>Multi File Upload</h2>

      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={uploadFiles}>Upload Files</button>
      <p>{status}</p>
    </div>
  );
}
