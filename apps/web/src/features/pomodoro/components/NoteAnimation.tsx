import NoteSvg from '@/assets/note.svg?react';

export function NoteAnimation() {
  return (
    <div className="absolute -top-14.5 left-1/2 h-17.5 w-28.75 -translate-x-1/2 overflow-hidden">
      <NoteSvg className="h-auto w-86.25 max-w-none animate-note-slide" />
    </div>
  );
}
