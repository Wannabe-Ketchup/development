import Note from '@/assets/note.svg?react';

export function NoteAnimation() {
  return (
    <div className="absolute -top-16 left-1/2 h-[78px] w-[128px] -translate-x-1/2 overflow-hidden">
      <Note className="note-animation" />
    </div>
  );
}
