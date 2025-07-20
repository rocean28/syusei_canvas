import React, { useState, useEffect } from 'react';

type Props = {
  onUpload: (file: File) => void;
};

const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Ctrl+V 対応（貼り付け）
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (file) {
            if (isAcceptedImage(file)) {
              onUpload(file);
            } else {
              alert('対応していないファイル形式です');
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onUpload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (isAcceptedImage(file)) {
        onUpload(file);
      } else {
        alert('対応していないファイル形式です');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isAcceptedImage(file)) {
        onUpload(file);
      } else {
        alert('対応していないファイル形式です');
      }
    }
  };

  const isAcceptedImage = (file: File): boolean => {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    return acceptedTypes.includes(file.type);
  };

  const handleClipboardButtonClick = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            if (isAcceptedImage(file)) {
              onUpload(file);
            } else {
              alert('対応していないファイル形式です');
            }
            return;
          }
        }
      }
      alert('クリップボードに画像が見つかりませんでした。');
    } catch (err) {
      console.error('クリップボード読み取り失敗:', err);
      alert('クリップボードから画像を読み取れませんでした。ブラウザの許可を確認してください。');
    }
  };

  return (
    <div
      className={`w-full flex-grow mt-10 ${isDragging ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      <div className="image-uploader h-full">
        <p className="mb-4 text-gray">
          画像をアップロードしてください<br />
        </p>
        <p className="fsz-12 text-gray mb-20"></p>

        <label className="btn-lightgray mb-20 cursor-pointer">
          ファイルを選択<span className="fsz-13">（ドラッグ＆ドロップ対応）</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <p className="mb-20 text-gray fsz-12">または</p>

        <div
          className="btn-lightgray cursor-pointer"
          onClick={handleClipboardButtonClick}
        >
          クリップボードから貼り付け<span className="fsz-13">（Ctrl+V）</span>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
