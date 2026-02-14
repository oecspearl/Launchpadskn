# File Upload & Preview - Usage Examples

## Quick Start

### 1. Basic File Upload

```jsx
import FileUploadZone from '../components/common/FileUploadZone';
import  { uploadFile } from '../services/fileService';

function MyComponent() {
  const handleFilesSelected = async (files, folder) => {
    for (const file of files) {
      const result = await uploadFile(file, folder);
      if (result.success) {
        console.log('File uploaded:', result.fileUrl);
      }
    }
  };

  return (
    <FileUploadZone
      onUpload={handleFilesSelected}
      acceptedTypes={['image/*', 'application/pdf']}
      maxSizeMB={10}
      multiple={true}
      folder="assignments"
    />
  );
}
```

### 2. File Preview

```jsx
import { useState } from 'react';
import FilePreviewModal from '../components/common/FilePreviewModal';

function MyComponent() {
  const [showPreview, setShowPreview] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  const handlePreview = (file) => {
    setCurrentFile({
      url: file.fileUrl,
      name: file.fileName,
      type: file.fileType
    });
    setShowPreview(true);
  };

  return (
    <>
      <button onClick={() => handlePreview(myFile)}>
        Preview File
      </button>
      
      <FilePreviewModal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        file={currentFile}
      />
    </>
  );
}
```

### 3. Complete Example: Assignment Submission

```jsx
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import FileUploadZone from '../components/common/FileUploadZone';
import FilePreviewModal from '../components/common/FilePreviewModal';
import { uploadFile } from '../services/fileService';
import { useToast } from '../contexts/ToastContext';

function AssignmentSubmission({ assignmentId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleUpload = async (files) => {
    setUploading(true);
    const results = [];

    for (const file of files) {
      const result = await uploadFile(file, `assignments/${assignmentId}`);
      if (result.success) {
        results.push(result);
      } else {
        showError(`Failed to upload ${file.name}`);
      }
    }

    setUploadedFiles([...uploadedFiles, ...results]);
    setUploading(false);
    showSuccess(`${results.length} file(s) uploaded successfully`);
  };

  const handlePreview = (file) => {
    setPreviewFile({
      url: file.fileUrl,
      name: file.fileName,
      type: file.fileType
    });
    setShowPreview(true);
  };

  return (
    <div>
      <FileUploadZone
        onUpload={handleUpload}
        acceptedTypes={['application/pdf', 'image/*', 'video/*']}
        maxSizeMB={50}
        folder={`assignments/${assignmentId}`}
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-3">
          <h6>Uploaded Files:</h6>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center p-2">
              <span>{file.fileName}</span>
              <Button size="sm" onClick={() => handlePreview(file)}>
                Preview
              </Button>
            </div>
          ))}
        </div>
      )}

      <FilePreviewModal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        file={previewFile}
        files={uploadedFiles.map(f => ({
          url: f.fileUrl,
          name: f.fileName,
          type: f.fileType
        }))}
      />
    </div>
  );
}
```

## FileUploadZone Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUpload` | Function | required | Callback when files selected: `(files, folder) => {}` |
| `acceptedTypes` | Array | `['*/*']` | Allowed MIME types, e.g. `['image/*', 'application/pdf']` |
| `maxSizeMB` | Number | `10` | Maximum file size in megabytes |
| `multiple` | Boolean | `true` | Allow multiple file selection |
| `folder` | String | `'uploads'` | Upload folder path in Supabase Storage |
| `label` | String | - | Custom label text |

## FilePreviewModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | Boolean | required | Show/hide modal |
| `onHide` | Function | required | Close callback |
| `file` | Object | required | File object: `{ url, name, type }` |
| `files` | Array | `[]` | Array of files for navigation |
| `currentIndex` | Number | `0` | Current file index |
| `onNavigate` | Function | - | Navigation callback: `(newIndex) => {}` |

## Supported File Types

### Preview Support
- **PDFs**: Full page navigation, zoom (via react-pdf)
- **Images**: All formats (jpg, png, gif, webp, svg)
- **Videos**: mp4, webm, ogg
- **Audio**: mp3, wav, ogg

### Download Only
- Documents (docx, xlsx, pptx)
- Archives (zip, rar)
- Other formats

## Notes

- Ensure the `lms-files` bucket exists in your Supabase Storage
- Configure bucket permissions to allow uploads from authenticated users
- File previews work with both local files and remote URLs
- PDF.js worker is loaded from CDN - consider self-hosting for production
