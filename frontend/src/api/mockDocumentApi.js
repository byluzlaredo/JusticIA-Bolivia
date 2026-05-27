// Mock API for Documentos persistence (localStorage)
// Stores only CI and document metadata (name, size, type, category, previewUrl)

export const saveDocuments = (data) => {
  try {
    const serializable = {
      ci: data.ci,
      documents: data.documents.map((doc) => ({
        name: doc.file.name,
        type: doc.file.type,
        size: doc.file.size,
        category: doc.category,
        previewUrl: doc.previewUrl,
      })),
    };
    localStorage.setItem('justicia-docs', JSON.stringify(serializable));
  } catch (e) {
    console.error('Error saving documents', e);
  }
};

export const loadDocuments = () => {
  try {
    const raw = localStorage.getItem('justicia-docs');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // We cannot reconstruct the original File objects, so we only return metadata.
    // The UI will treat them as placeholders (no preview, no download). Users will need to re‑upload.
    return {
      ci: parsed.ci,
      documents: parsed.documents.map((doc) => ({
        file: new File([], doc.name, { type: doc.type, lastModified: Date.now() }), // empty placeholder file
        category: doc.category,
        previewUrl: doc.previewUrl,
      })),
    };
  } catch (e) {
    console.error('Error loading documents', e);
    return null;
  }
};
