"use client";

import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface ModalDeleteProps {
  content: string;
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}

export default function ModalDelete({
  content,
  isOpen = false,
  onClose,
  onConfirm,
}: ModalDeleteProps) {
  const [openModal, setOpenModal] = useState(isOpen);

  // Sync internal state with prop
  useEffect(() => {
    setOpenModal(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setOpenModal(false);
    onClose?.(); // panggil callback dari luar kalau ada
  };

  const handleConfirm = () => {
    onConfirm?.(); // callback kalau user klik "Yes"
    setOpenModal(false);
  };

  return (
    <Modal show={openModal} size="md" onClose={handleClose} popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          {/* Icon dengan animasi dan gradient background */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <HiOutlineExclamationCircle className="h-12 w-12 text-red-600 dark:text-red-400 animate-pulse" />
          </div>

          {/* Title */}
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Konfirmasi Penghapusan
          </h3>

          {/* Content */}
          <p className="mb-6 text-base text-gray-600 dark:text-gray-300 px-4">
            {content}
          </p>

          {/* Warning text */}
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Tindakan ini tidak dapat dibatalkan.
          </p>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button
              color="failure"
              onClick={handleConfirm}
              className="px-6 py-2.5 font-medium"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Ya, Hapus
            </Button>
            <Button
              color="gray"
              onClick={handleClose}
              className="px-6 py-2.5 font-medium"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Batal
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
