// import type { ReactElement } from 'react';
import type { Instruction } from '../types';
import type { EditorMode } from '../types/EditorMode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { env } from '@/config/env';
// import { marked } from 'marked';
// import DOMPurify from 'dompurify';
// import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser';

// marked.setOptions({
//   breaks: true,
// });

type Props = {
  mode: EditorMode;
  instructions: Instruction[];
  totalInstructions: number;
  setInstructions: React.Dispatch<React.SetStateAction<Instruction[]>>;
  onRectClick?: (instructionId: string) => void;
};

const InstructionList: React.FC<Props> = ({ mode, instructions, totalInstructions, setInstructions, onRectClick }) => {

  const handleTextChange = (id: string, value: string) => {
    setInstructions(prev =>
      prev.map(ins =>
        ins.id === id ? { ...ins, text: value, isSaved: false } : ins
      )
    );
  };

  const handleisFixedChange = async (id: string, checked: boolean) => {
    setInstructions(prev =>
      prev.map(ins =>
        ins.id === id ? { ...ins, is_fixed: checked} : ins
      )
    );

    try {
      const res = await fetch(`${env.apiUrl}/update_instruction.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_fixed: checked ? 1 : 0 })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error('チェック状態の保存に失敗:', result);
        alert('サーバーへの保存に失敗しました');
      }
    } catch (e) {
      console.error('通信エラー:', e);
      alert('チェック状態の保存中に通信エラーが発生しました');
    }
  };

  const handleisOkChange = async (id: string, checked: boolean) => {
    setInstructions(prev =>
      prev.map(ins =>
        ins.id === id ? { ...ins, is_ok: checked} : ins
      )
    );

    await fetch(`${env.apiUrl}/update_instruction.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_ok: checked ? 1 : 0 })
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('この指示を削除してもよろしいですか？')) {
      setInstructions(prev => prev.filter(ins => ins.id !== id));
    }
  };

  function formatTextForDisplay(text: string): (string | React.ReactElement)[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const lines = text.split('\n');

    return lines.flatMap((line, lineIndex) => {
      const parts = line.split(urlRegex);
      const lineElements = parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // URLパートはそのままリンク化
          return (
            <a
              key={`${lineIndex}-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link fsz-14"
            >
              {part}
            </a>
          );
        } else {
          // テキストパートには装飾を適用
          const fragments: (string | React.ReactElement)[] = [];

          let lastIndex = 0;
          const combinedRegex = /\*\*(.+?)\*\*|__(.+?)__/g;
          let match;
          let fragIndex = 0;

          while ((match = combinedRegex.exec(part)) !== null) {
            const [bold, underline] = match;
            const start = match.index;

            // 装飾前の文字列
            if (start > lastIndex) {
              fragments.push(part.slice(lastIndex, start));
            }

            // 装飾要素の追加
            if (bold) {
              fragments.push(
                <strong key={`bold-${lineIndex}-${index}-${fragIndex}`}>
                  {bold}
                </strong>
              );
            } else if (underline) {
              fragments.push(
                <span key={`ul-${lineIndex}-${index}-${fragIndex}`} className="underline">
                  {underline}
                </span>
              );
            }

            lastIndex = combinedRegex.lastIndex;
            fragIndex++;
          }

          // 装飾後の残り文字列
          if (lastIndex < part.length) {
            fragments.push(part.slice(lastIndex));
          }

          return fragments.length > 0 ? fragments : part;
        }
      });

      // 改行の挿入
      return lineIndex < lines.length - 1
        ? [...lineElements.flat(), <br key={`br-${lineIndex}`} />]
        : lineElements.flat();
    });
  }

  return (
    <div>
      <div className="px-5 mb-10 pb-5 fsz-12 text-gray sticky bg-base">
        このタブの修正数: {instructions.length}　/　全修正数: {totalInstructions}
      </div>
      {instructions.map((ins, index) => {
        return (
          <div key={ins.id}>
            <div
              key={ins.id}
              id={`instruction-${ins.id}`}
              className="ins-item card p-10 mb-15 rounded fsz-14"
              onClick={() => onRectClick?.(ins.id)}
            >
            <div className={`mb-5 fsz-15 flex`}>
              <div className="ins-item-num rounded py-5 px-10 px-1 fsz-13">{index + 1}</div>
            </div>

            {/* {isEditing && mode !== 'view' ? ( */}
            {mode !== 'view' ? (
              <>
                <textarea
                  value={ins.text}
                  onChange={e => handleTextChange(ins.id, e.target.value)}
                  rows={3}
                  className="w-full p-5 rounded border "
                />
                <div className="flex justify-end gap-5">
                  <div
                    onClick={() => handleDelete(ins.id)}
                    className="p-5 pointer"
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="text-gray fsz-12"
                    />
                  </div>
                </div>
                {/* <div className="flex gap-5 justify-end mt-2">
                  <div
                    onClick={() => handleSave(ins.id)}
                    className="btn-ins-save btn-blue fsz-13"
                  >
                    保存
                  </div>
                  <div
                    onClick={() => toggleEdit(ins.id, false)}
                    className="btn-lightgray fsz-13"
                  >
                    キャンセル
                  </div>
                </div> */}
              </>
            ) : (
              <div className="">
                {mode !== 'view' ? (
                  <>
                    {/* <p className="w-full border-gray p-10 mt-5 mb-5">
                      {ins.text || ''}
                    </p> */}
                    {/* <div className="flex justify-end gap-5">
                      <div
                        onClick={() => toggleEdit(ins.id, true)}
                        className="btn-lightgray p-5 fsz-13"
                      >
                      <FontAwesomeIcon
                        icon={faPen}
                        className="text-gray fsz-12"
                      />編集
                      </div>
                      <div
                        onClick={() => handleDelete(ins.id)}
                        className="btn-lightgray p-5"
                      >
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="text-gray fsz-12"
                      />
                      </div>
                    </div> */}
                  </>
                  ) : (
                  <>
                    <div className="w-full p-5 mt-5 mb-15">
                      {formatTextForDisplay(ins.text || '')}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="checks flex justify-end gap-15 fsz-11 text-gray">
              <label htmlFor={`fixed-${ins.id}_0`} className="flex items-center gap-5 pointer">
                <input
                  id={`fixed-${ins.id}_0`}
                  type="checkbox"
                  checked={Number(ins.is_fixed) === 1}
                  onChange={(e) => handleisFixedChange(ins.id, e.target.checked)}
                /> 完了
              </label>
              <label htmlFor={`fixed-${ins.id}_1`} className="flex items-center gap-5 pointer">
                <input
                  id={`fixed-${ins.id}_1`}
                  type="checkbox"
                  checked={Number(ins.is_ok) === 1}
                  onChange={(e) => handleisOkChange(ins.id, e.target.checked)}
                /> 確認
              </label>
            </div>
            </div>
          </div>
        );
      })}

      {instructions.length === 0 && mode !== 'view' && (
        <p className="fsz-12">※画像の上でドラッグして指示を作成してください。</p>
      )}
    </div>
  );
};

export default InstructionList;
