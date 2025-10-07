import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function ImageModal({ isOpen, onClose, imageUrl, name }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/90 transition-opacity" />
          </Transition.Child>

          {/* Centering trick */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-6xl p-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-black rounded-lg shadow-2xl">
              {/* Close Button */}
              <button
                className="absolute top-4 right-6 text-white text-2xl hover:text-gray-300"
                onClick={onClose}
              >
                ✕
              </button>

              {/* Image */}
              <img
                src={imageUrl}
                alt={name}
                className="w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}