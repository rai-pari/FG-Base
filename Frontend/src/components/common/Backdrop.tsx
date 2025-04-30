import { FC } from "react";

type BackdropProps = {
  open: boolean;
};

const Backdrop: FC<BackdropProps> = ({ open }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-solid border-white"></div>
      </div>
    </div>
  );
};

export default Backdrop;
