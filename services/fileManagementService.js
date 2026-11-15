import AdmZip from "adm-zip";

/**
 * Generates a ZIP archive directly in memory from a file manifest array
 * or from a key-value object of files.
 * @param {Array<{name: string, content: string}> | Object<string, string>} files
 * @returns {Buffer} ZIP archive buffer ready for HTTP streaming
 */
export const generateInMemoryZip = (files) => {
  const zip = new AdmZip();

  if (Array.isArray(files)) {
    for (const file of files) {
      if (file && file.name && typeof file.content === "string") {
        zip.addFile(file.name, Buffer.from(file.content, "utf-8"));
      }
    }
  } else if (files && typeof files === "object") {
    for (const [fileName, content] of Object.entries(files)) {
      if (typeof content === "string") {
        zip.addFile(fileName, Buffer.from(content, "utf-8"));
      }
    }
  }

  return zip.toBuffer();
};

/**
 * Determines MIME type from file extension.
 * @param {string} fileName
 * @returns {string} MIME type
 */
export const getMimeType = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  const mimeTypes = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    txt: "text/plain; charset=utf-8",
  };
  return mimeTypes[ext] || "text/plain; charset=utf-8";
};
