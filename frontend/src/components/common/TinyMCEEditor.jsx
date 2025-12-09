import React, { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

// TinyMCE API key configured

const TinyMCEEditor = ({
  value = '',
  onChange,
  height = 400,
  placeholder = '',
  disabled = false,
  required = false,
  toolbar = 'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code | fullscreen',
  plugins = 'lists link image table code wordcount fullscreen',
  menubar = 'edit view insert format tools',
  ...props
}) => {
  const editorRef = useRef(null);

  const handleEditorChange = (content, editor) => {
    if (onChange) {
      // Create a synthetic event object to match textarea onChange behavior
      const syntheticEvent = {
        target: {
          value: content
        }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="tinymce-editor-wrapper">
      <Editor
        tinymceScriptSrc="https://cdn.tiny.cloud/1/uq3r20fvy7trcanf9ehjkwd8mvpz3sdp5arhjpjfwsdmwyic/tinymce/7/tinymce.min.js"
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: height,
          menubar: menubar,
          plugins: plugins,
          toolbar: toolbar,
          placeholder: placeholder,
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          elementpath: true,
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          setup: (editor) => {
            editor.on('init', () => {
              if (disabled) {
                editor.mode.set('readonly');
              }
            });
          },
          // Image upload configuration - converts to base64 for now
          images_upload_handler: async (blobInfo, progress) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result);
              };
              reader.onerror = () => {
                reject('Image upload failed');
              };
              reader.readAsDataURL(blobInfo.blob());
            });
          },
          // Link configuration
          link_title: false,
          link_target_list: [
            { title: 'None', value: '' },
            { title: 'New window', value: '_blank' }
          ],
          // Table configuration
          table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
          // Accessibility
          a11y_advanced_options: true,
          // Paste options
          paste_as_text: false,
          paste_auto_cleanup_on_paste: true,
          paste_remove_styles: true,
          paste_remove_styles_if_webkit: true,
          paste_strip_class_attributes: 'all',
          // Word count
          wordcount_countregex: /[\w\u2019\'-]+/g,
          // Auto-focus prevention
          auto_focus: false,
          ...props.init
        }}
        disabled={disabled}
      />
    </div>
  );
};

export default TinyMCEEditor;

