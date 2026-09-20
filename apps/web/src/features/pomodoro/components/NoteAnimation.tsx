import Note from '@/assets/note.svg?react';

export function NoteAnimation() {
  return (
    <div className="absolute -top-16 left-1/2 h-19.5 w-32 -translate-x-1/2 overflow-hidden">
      <Note className="animate-note-slide" />
    </div>
  );
}
