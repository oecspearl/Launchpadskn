import React, { lazy, Suspense } from 'react';
import { Spinner } from 'react-bootstrap';

const ProseForgeEditor = lazy(() => import('./ProseForgeEditor'));

/**
 * TextEditor - Unified rich text editor wrapper.
 *
 * Drop-in replacement for TinyMCEEditor. Defaults to the built-in
 * ProseForge editor (zero external dependencies).
 *
 * Props match the TinyMCEEditor contract so existing call-sites can
 * swap imports without other changes:
 *   - value:       HTML string
 *   - onChange:     receives a synthetic { target: { value } } event
 *   - height:      content area height in px (default 400)
 *   - placeholder:  placeholder text
 *   - disabled:     maps to ProseForge readOnly
 */
function TextEditor({
  value = '',
  onChange,
  height = 400,
  placeholder = 'Start writing something brilliant...',
  disabled = false,
  readOnly,
  ...rest
}) {
  const handleChange = (html) => {
    if (onChange) {
      // Emit a synthetic event matching TinyMCE's onChange contract
      onChange({ target: { value: html } });
    }
  };

  return (
    <Suspense fallback={
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 10, border: '1px solid #d2d2d7' }}>
        <Spinner animation="border" size="sm" />
      </div>
    }>
      <ProseForgeEditor
        value={value}
        onChange={handleChange}
        readOnly={readOnly ?? disabled}
        placeholder={placeholder}
        height={height}
        showFullscreenButton
        {...rest}
      />
    </Suspense>
  );
}

export default TextEditor;
