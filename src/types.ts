export type User = {
  name: string;
  email: string;
};

export type Instruction = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  comments: string[];
  isSaved?: boolean;
  is_fixed?: boolean;
  is_ok?: boolean;
};

export type ImageWithInstructions = {
  id: string;
  imageUrl: string;
  imageFile: File | null;
  image?: string;
  imageName?: string;
  instructions: Instruction[];
  title: string;
  url?: string;
};

export type InstructionListRefType = {
  setEditMode: (id: string, mode: boolean) => void;
};

export type Item = {
  id: string;
  image?: string;
  created_by: string;
  created_at: string;
  [key: string]: any;
};

export type CreateInfoType = {
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};