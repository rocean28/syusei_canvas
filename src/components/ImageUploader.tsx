import React, { useState, useEffect } from 'react';

type Props = {
  onUpload: (file: File) => void;
};

const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const MAX_UPLOAD_SIZE_MB = 5;
  const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  const checkOnUploadSize = (file: File): boolean => {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      alert(
        `画像サイズが ${MAX_UPLOAD_SIZE_MB}MB を超えています（${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB）`
      );
      return false;
    }
    return true;
  };

  const safeOnUpload = (file: File) => {
    if (!checkOnUploadSize(file)) return;
    onUpload(file);
  };

  const compressImage = (file: File, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas描画失敗');

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
              URL.revokeObjectURL(url);
            } else {
              reject('toBlob失敗');
            }
          },
          'image/jpeg', // 出力形式（JPEG推奨）
          quality // 圧縮率（0〜1）
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  // Ctrl+V 対応（貼り付け）
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const compressedBlob = await compressImage(file, 0.8);
            const compressedFile = new File([compressedBlob], 'pasted-image.jpg', {
              type: 'image/jpeg',
            });
            console.log(
              `圧縮後の画像サイズ: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
            );
            safeOnUpload(compressedFile);
          } catch (err) {
            console.error('画像の圧縮に失敗:', err);
            alert('画像の圧縮中にエラーが発生しました');
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [safeOnUpload]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!isAcceptedImage(file)) {
      alert('対応していないファイル形式です');
      return;
    }
    try {
      const compressedBlob = await compressImage(file, 0.8);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      console.log(
        `圧縮後の画像サイズ: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
      );
      safeOnUpload(compressedFile);
    } catch (err) {
      console.error('画像の圧縮に失敗:', err);
      alert('画像の圧縮中にエラーが発生しました');
    }
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAcceptedImage(file)) {
      alert('対応していないファイル形式です');
      return;
    }
    try {
      const compressedBlob = await compressImage(file, 0.8);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      console.log(
        `圧縮後の画像サイズ: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
      );
      safeOnUpload(compressedFile);
    } catch (err) {
      console.error('画像の圧縮に失敗:', err);
      alert('画像の圧縮中にエラーが発生しました');
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
            if (!isAcceptedImage(file)) {
              alert('対応していないファイル形式です');
              return;
            }
            try {
              const compressedBlob = await compressImage(file, 0.8);
              const compressedFile = new File([compressedBlob], 'pasted-image.jpg', {
                type: 'image/jpeg',
              });
              console.log(
                `圧縮後の画像サイズ: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
              );
              safeOnUpload(compressedFile);
            } catch (err) {
              console.error('画像の圧縮に失敗:', err);
              alert('画像の圧縮中にエラーが発生しました');
            }
            return; // 最初の画像のみ処理
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
