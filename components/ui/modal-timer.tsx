"use client";

import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

// Props untuk modal
interface ModalTimesProps {
  content: React.ReactNode; // bisa teks atau elemen JSX
  duration?: number; // opsional, default 5 detik
  onClose?: () => void; // opsional, callback ketika modal ditutup
}

export function ModalTimes({
  content,
  duration = 5,
  onClose,
}: ModalTimesProps) {
  const [openModal, setOpenModal] = useState(true);
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    if (!openModal || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Schedule closing in next render cycle to avoid setState in effect
          setTimeout(() => {
            setOpenModal(false);
            if (onClose) onClose();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [openModal, countdown, onClose]);

  return (
    <Modal
      show={openModal}
      size="md"
      onClose={() => {
        setOpenModal(false);
        if (onClose) onClose();
      }}
      popup
    >
      <ModalHeader />
      <ModalBody>
        <div className="text-center space-y-4">
          <HiOutlineExclamationCircle className="mx-auto h-14 w-14 text-gray-400 dark:text-gray-200" />

          <div className="text-gray-700 dark:text-gray-300 text-base font-medium">
            {content}
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500">
            Closing in <span className="font-semibold">{countdown}</span>{" "}
            seconds...
          </p>

          <Button color="failure" onClick={() => setOpenModal(false)}>
            Close Now
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
