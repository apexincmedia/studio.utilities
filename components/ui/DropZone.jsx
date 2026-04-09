'use client';

import { useRef, useState } from 'react';

/**
 * DropZone — file drop / browse area. Fills its flex-column parent by default.
 *
 * Props:
 *   accept:    string    MIME type string, e.g. 'image/*' or '.pdf,.docx'
 *   multiple:  bool      allow multiple files (default: false)
 *   onFiles:   function  called with File[] when files are selected/dropped
 *   title:     string    heading text (default: 'Drop files here')
 *   subtitle:  string    secondary text (default: 'or click to browse')
 *   icon:      ReactNode icon element rendered above title (optional)
 *   children:  ReactNode extra content rendered below subtitle (format pills, etc.)
 */
export default function DropZone({
  accept,
  multiple = false,
  onFiles,
  title     = 'Drop files here',
  subtitle  = 'or click to browse',
  icon,
  children,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const arr = Array.from(files);
    if (arr.length > 0) onFiles?.(arr);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  const onClick   = ()  => inputRef.current?.click();
  const onChange  = (e) => handleFiles(e.target.files);

  return (
    <div
      className={`drop-zone${dragging ? ' drag-over' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Icon slot */}
      {icon && <div className="drop-zone-icon">{icon}</div>}

      {/* Text */}
      <p className="drop-zone-title">{title}</p>
      {subtitle && <p className="drop-zone-sub">{subtitle}</p>}

      {/* Footer slot: format pills, hints, etc. */}
      {children}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
