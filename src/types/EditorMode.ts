// src/types/EditorMode.ts

export type EditorMode = 'create' | 'edit' | 'view';

export type EditorModeProps = {
  mode: EditorMode;
};