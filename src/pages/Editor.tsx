// pages/Editor.tsx
import React, { useEffect, useState } from 'react';
import type { SetStateAction } from 'react';
import type { User, Instruction, ImageWithInstructions, CreateInfoType } from '@/types';
import type { EditorModeProps } from '@/types/EditorMode';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageUploader from '@/components/ImageUploader';
import CanvasWithRects from '@/components/CanvasWithRects';
import InstructionList from '@/components/InstructionList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { env } from '@/config/env';
import { getCurrentUser } from '@/utils/user';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

type Props = EditorModeProps;

const Editor: React.FC<Props> = ({ mode }) => {
  const [images, setImages] = useState<ImageWithInstructions[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [nextActiveId, setNextActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const params = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>({ email: '', name: '' });
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser({ name: user.name, email:user.email});
      }
    };
    fetchUser();
  }, []);

  const [createInfo, setCreateInfo] = useState<CreateInfoType>({
    created_at: '',
    updated_at: '',
    created_by: '',
    updated_by: ''
  });

  function generateId(): string {
    const base36 = Date.now().toString(36);
    return `${base36}${nanoid(5)}`;
  }

  const [id] = useState(() =>
    params.id ?? generateId()
  );
  const [isNew] = useState(() =>
    params.id ? false : true
  );

  const scrollToBottomOfList = () => {
    const listEl = document.querySelector('.ins-list');
    if (listEl) {
      listEl.scrollTo({
        top: listEl.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // 編集モード時の初期読み込み
  const fetchData = async () => {
    try {
      const res = await fetch(`${env.apiUrl}/view.php?id=${id}`);
      const data = await res.json();

      setTitle(data.title || '');

      const now = new Date(data.created_at || Date.now());
      const Y = now.getFullYear().toString();
      const mm = ('0' + (now.getMonth() + 1)).slice(-2);

      const loaded = data.tabs.map((tab: any) => ({
        id: `${nanoid(10)}`,
        imageName: tab.image_filename,
        imageUrl: `${env.serverUrl}/uploads/${Y}/${mm}/${id}/${tab.image_filename}`,
        imageFile: null,
        instructions: tab.instructions || [],
        title: tab.title || '',
        url: tab.url || '',
      }));
      setImages(loaded);
      if (loaded.length > 0) setActiveImageId(loaded[0].id);

      setCreateInfo({
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by
      });

    } catch (err) {
      console.error('読み込みエラー:', err);
    }

  };

  useEffect(() => {
    if ((mode !== 'edit' && mode !== 'view') || isNew) return;
    fetchData();
  }, [mode, params.id]);

  useEffect(() => {
    if (!activeImageId) return;
    window.dispatchEvent(new Event('highlightUpdate'));
  }, [activeImageId]);

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const newId = `${id}_${nanoid(5)}`;
    const newImage: ImageWithInstructions = {
      id: newId,
      imageUrl: url,
      imageFile: file,
      instructions: [],
      title: '',
      url: '',
    };
    setImages((prev) => [...prev, newImage]);
    setActiveImageId(newId);
  };

  const handleUpdateInstructions = (imageId: string, newInstructions: Instruction[]) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, instructions: newInstructions } : img
      )
    );
    // console.log(images[0]['instructions']);
  };

  // const handleEditImageTitle = (id: string) => {
  //   const current = images.find((img) => img.id === id);
  //   const newTitle = prompt('画像タイトルを入力してください', current?.title || '');
  //   if (newTitle !== null) {
  //     setImages((prev) =>
  //       prev.map((img) => (img.id === id ? { ...img, title: newTitle } : img))
  //     );
  //   }
  // };

  const unlockEditor = async (targetId: string) => {
    try {
      await fetch(`${env.lockUrl}/unlock.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: targetId })
      });
    } catch (e) {
      console.error('ロック解除失敗:', e);
    }
  };

  const handleSaveAll = async () => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setIsSaving(true); // ← 保存開始
    try {
      const updatedImages = await Promise.all(images.map(async (img) => {
        if (img.imageFile) {
          const formData = new FormData();
          formData.append('post_id', id);
          formData.append('image_filename', img.imageFile);

          const res = await fetch(`${env.apiUrl}/upload.php`, {
            method: 'POST',
            body: formData,
          });

          const result = await res.json();
          if (result.success && result.filename) {
            // console.log('アップロード成功:', result);
            return {
              ...img,
              image: result.filename,
              imageFile: null,
            };
          } else {
            console.error('アップロード失敗:', result);
            throw new Error('画像のアップロードに失敗しました');
          }
        } else {
          return img;
        }
      }));

      const imagesChanged = updatedImages.some((img, i) => img !== images[i]);
      if (imagesChanged) {
        setImages(updatedImages);
      }
      const payload = {
        id,
        title: title.trim() || '無題の修正指示',
        created_at: isNew ? now : createInfo.created_at,
        category: '',
        updated_at: now,
        created_by: isNew ? currentUser.name : createInfo.created_by,
        updated_by: currentUser.name,
        tabs: updatedImages.map((img) => ({
          image_filename: img.image || img.imageName,
          title: img.title || '',
          url: img.url || '',
          instructions: img.instructions.map((inst) => ({
            id: inst.id,
            x: inst?.x != null ? parseFloat(Number(inst.x).toFixed(10)) : 0,
            y: inst?.y != null ? parseFloat(Number(inst.y).toFixed(10)) : 0,
            width: inst?.width != null ? parseFloat(Number(inst.width).toFixed(10)) : 0,
            height: inst?.height != null ? parseFloat(Number(inst.height).toFixed(10)) : 0,
            text: inst.text || '',
            is_fixed: inst.is_fixed || false,
            is_ok: inst.is_ok || false
          }))
        }))
      };
      // console.log(payload);

      const saveType = mode === 'edit' ? 'update' : 'insert';
      const res = await fetch(`${env.apiUrl}/${saveType}.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success && result.id) {
        await unlockEditor(id);
        await fetchData();
        navigate(`/${result.id}`);
      } else {
        console.error(result);
        alert('保存に失敗しました');
      }

    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : '保存中にエラーが発生しました');
    } finally {
      setIsSaving(false); // ← 保存終了
    }
  };


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      alert('コピーに失敗しました');
    }
  };

  const handleDeleteActiveImage = () => {
    if (!activeImageId) return;

    const current = images.find((img) => img.id === activeImageId);
    const confirmed = window.confirm(`「${current?.title || '現在のタブ'}」を削除しますか？`);
    if (!confirmed) return;

    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== activeImageId);
      const nextId = filtered[0]?.id ?? null;
      setNextActiveId(nextId);
      return filtered;
    });
  };
  useEffect(() => {
    if (nextActiveId !== null) {
      setActiveImageId(nextActiveId);
      setNextActiveId(null);
    }
  }, [nextActiveId]);

  const handleDeleteRequest = async () => {
    if (!id) return;
    const confirmed = window.confirm('この修正依頼を本当に削除しますか？');
    if (!confirmed) return;

    try {
      const res = await fetch(`${env.apiUrl}/delete.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          created_at: createInfo.created_at,
        }),
      });

      const result = await res.json();
      console.log(result);
      if (result.success) {
        // alert('削除しました');
        await unlockEditor(id);
        navigate('/list/');
      } else {
        alert('削除に失敗しました: ' + (result.error || ''));
      }
    } catch (e) {
      console.error(e);
      alert('通信エラーが発生しました');
    }
  };

  const activeImage = images.find((img) => img.id === activeImageId);

  // rectクリック時
  const handleRectClick = (instructionId: string) => {
    // 既存のactiveを全部外す
    document.querySelectorAll('.ins-list .card.is-active').forEach((el) => {
      el.classList.remove('is-active');
    });
    document.querySelectorAll('.img-wrap .rect.is-active').forEach((el) => {
      el.classList.remove('is-active');
    });

    // 対象指示にスクロール＆クラス追加
    const target = document.querySelector(`#instruction-${instructionId}`);
    const insList = document.querySelector('.ins-list');
    if (target && insList) {
      const offsetTop = (target as HTMLElement).offsetTop;
      insList.scrollTo({
        top: offsetTop - insList.clientHeight / 2,
        behavior: 'smooth'
      });
      target.classList.add('is-active');
    }

    // 対象rectにスクロール＆クラス追加
    const rect = document.querySelector(`#rect-${instructionId}`);
    const imgArea = document.querySelector('.img-wrap');
    if (rect && imgArea) {
      const offsetTop = (rect as HTMLElement).offsetTop;
      imgArea.scrollTo({
        top: offsetTop - imgArea.clientHeight / 10,
        behavior: 'smooth'
      });
      rect.classList.add('is-active');
    }
  };

  const lockEditor = async () => {
    try {
      await fetch(`${env.lockUrl}/lock.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });

      navigate(`/edit/${id}`);
    } catch (err) {
      console.error(err);
      alert('ロック作成に失敗しました');
    }
  };
  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const res = await fetch(`${env.lockUrl}/lock.php?id=${id}`, {
          method: 'GET',
          credentials: 'include'
        });

        const data = await res.json();
        if (mode && id && data.locked && currentUser.name && data.locked_by !== currentUser.name) {
          alert(`${data.locked_by}さんが編集中です（${data.locked_at} から）`);
          navigate(`/${id}`);
        }
      } catch (err) {
        console.error(err);
        alert('ロック状態の確認に失敗しました');
        navigate(`/${id}`);
      }
    };

    if (mode === 'edit') {
      lockEditor();
      setTimeout(async () => {
        checkLockStatus();
      }, 1000);
    }
  }, [mode, id, currentUser.name]);

  // 画面離脱時にロック解除
  useEffect(() => {
    if (mode !== 'edit') return;

    const handleUnload = async () => {
      try {
        await fetch(`${env.lockUrl}/unlock.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
          keepalive: true // ←超重要！離脱時でもリクエストを完了させるため
        });
      } catch (err) {
        console.error('ロック解除失敗', err);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [mode, id, getCurrentUser]);

  const cancelEdit = async () => {
    const confirmCancel = window.confirm('変更内容が失われます。よろしいですか？');
    if (!confirmCancel) return;

    try {
      await unlockEditor(id);
    } catch (e) {
      console.error('キャンセル時のロック解除失敗:', e);
    }

    navigate(`/${id}`);
  };

  const totalInstructions = images.reduce(
    (sum, img) => sum + img.instructions.length,
    0
  );

  return (
    <div className={`wrap page-${mode}`}>
      <Header />
      <main className="main flex items-center flex-column gap-10 mx-auto">
        {mode !== 'view' ? (
          <div className="w-600 mb-30 flex-center">
            <div className="flex-shrink-0">案件名：</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded p-5"
              placeholder=""
            />
          </div>
        ) : (
          <div className="w-full">
            <div className="fsz-16 fw-700 text-center">{title || '無題の修正指示'}</div>
            <div className="flex-center gap-10 mt-10 relative hidden">
              <span className="w-100 text-right fsz-12 text-gray">共有リンク</span>
              <input
                type="text"
                value={window.location.href}
                readOnly
                onClick={handleCopy}
                className="w-300 p-5 fsz-13 bg-lightgray text-gray pointer"
              />
              <div onClick={handleCopy} className="w-100 relative rounded p-0 pointer">
                {/* <span className="fsz-10 text-gray">コピー</span> */}
                <FontAwesomeIcon
                  icon={faCopy}
                  className="mb-2 text-gray fsz-12"
                />
                {copied && (
                  <div className="copied-text">
                  <FontAwesomeIcon
                    icon={faCheck}
                  />コピーしました
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="w-fit mw-1000 mx-auto">
          <div className="flex-center gap-10 fixed-btn">
            {mode !== 'view' && (
              <>
                {mode !== 'create' && (
                  <div onClick={cancelEdit} className="btn-save-all btn-lightgray">
                    キャンセル
                  </div>
                )}
                <div onClick={handleSaveAll} className="btn-save-all btn-blue">
                  保存する
                </div>
                {isSaving && (
                  <p className="saving-text">保存中...</p>
                )}
              </>
            )}
            {mode === 'view' && (
              <div onClick={lockEditor} className="btn-lightgray">
                編集する
              </div>
            )}
          </div>
          <div className="tabs">
            {images.map((img, index) => (
              <div key={img.id} id={img.id} className={`tab ${img.id === activeImageId ? 'is-active' : ''}`} onClick={() => setActiveImageId(img.id)}>
                <div>
                  {img.title || `タブ ${index + 1}`}
                </div>
                {mode !== 'view' && (
                  <>
                  {/* <div
                    onClick={() => handleEditImageTitle(img.id)}
                    className="tab-icon flex-center rounded"
                    title="タイトルを編集"
                  >
                    <FaPen size={12} />
                    <FontAwesomeIcon
                      icon={faPen}
                    />
                  </div> */}
                  {img.id === activeImageId && (
                    <div
                      onClick={handleDeleteActiveImage}
                      className="tab-icon -trash flex-center rounded"
                      title="削除"
                    >
                      ×
                    </div>
                  )}
                </>
                )}
              </div>
            ))}
            {mode !== 'view' && (
              <div onClick={() => setActiveImageId(null)} className="tab -add">
                ＋
              </div>
            )}
          </div>
          {/* {activeImageId !== null && (
            <>
            </>
          )} */}

          {activeImageId === null && mode !== 'view' ? (
            <ImageUploader onUpload={handleImageUpload} />
          ) : activeImage ? (
          <>
            <div className="w-full flex gap-10">
              <div className="image-area card p-10">
                <div className="flex gap-5 fsz-12 text-gray">
                  <div className="flex-shrink-0">ページURL:</div>
                  {mode !== 'view' ?(
                    <input
                      type="text"
                      value={activeImage.url || ''}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        setImages((prev) =>
                          prev.map((img) =>
                            img.id === activeImage.id ? { ...img, url: newUrl } : img
                          )
                        );
                      }}
                      className="w-full px-5 placeholder-gray-400"
                      placeholder="https://sample.com/page.php"
                    />
                  ) : (
                    <div className="w-full px-5">
                      {activeImage.url ? (
                        <a href={activeImage.url} className="" target="_blank" rel="noopener noreferrer">
                          {activeImage.url}
                        </a>
                      ) : (
                        ''
                      )}
                    </div>
                  )}
                </div>
                <CanvasWithRects
                  mode={mode}
                  imageUrl={activeImage.imageUrl}
                  instructions={activeImage.instructions}
                  setInstructions={(newInstructions: SetStateAction<Instruction[]>) => {
                    const updated =
                      typeof newInstructions === 'function'
                        ? newInstructions(activeImage.instructions)
                        : newInstructions;
                    // 追加検知（IDが新規っぽいやつ＝UUID形式）
                    const isAdded = updated.length > activeImage.instructions.length;
                    handleUpdateInstructions(activeImage.id, updated);
                    if (isAdded) {
                      setTimeout(scrollToBottomOfList, 100);
                    }
                  }}
                  onRectClick={handleRectClick}
                />
              </div>
              <div className="ins-list">
                <InstructionList
                  mode={mode}
                  instructions={activeImage.instructions}
                  totalInstructions={totalInstructions}
                  setInstructions={(newInstructions: SetStateAction<Instruction[]>) => {
                    const updated =
                      typeof newInstructions === 'function'
                        ? newInstructions(activeImage.instructions)
                        : newInstructions;
                    handleUpdateInstructions(activeImage.id, updated);
                  }}
                  onRectClick={handleRectClick}
                />
              </div>
            </div>

            {mode !== 'view' && (
              <>
                <div className="w-full flex justify-end mt-30 mb-20">
                  {/* <div onClick={handleSaveAll} className="btn-save-all btn-blue">
                    保存する
                  </div> */}
                </div>
              </>
            )}
          </>
          ) : null}
          {mode !== 'view' && mode !== 'create' && (
            <>
              <div className="w-full flex justify-end mt-30">
                <div onClick={handleDeleteRequest} className="btn-red fsz-12">
                  この修正依頼を削除
                </div>
              </div>
            </>
          )}
        </div>
        {mode !== 'create' && (
          <>
            <div className="info text-gray fsz-12 ">
              <div className="mt-50">作成者: {createInfo.created_by}</div>
              <div className="">作成日: {createInfo.created_at}</div>
              <div className="mt-5">最終更新者: {createInfo.updated_by}</div>
              <div className="">最終更新日: {createInfo.updated_at}</div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Editor;
