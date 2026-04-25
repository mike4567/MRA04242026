"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoticeModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export function NoticeModal({ isOpen, onAcknowledge }: NoticeModalProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Notice</AlertDialogTitle>
          <AlertDialogDescription>
            You are accessing a U.S. Government information system, which
            includes: 1) this computer, 2) this computer network, 3) all
            Government-furnished computers connected to this network, and 4) all
            Government-furnished devices and storage media attached to this
            network or to a computer on this network. You understand and consent
            to the following: you may access this information system for
            authorized use only; unauthorized use of the system is prohibited and
            subject to criminal and civil penalties; you have no reasonable
            expectation of privacy regarding any communication or data
            transiting or stored on this information system at any time and for
            any lawful Government purpose, the Government may monitor, intercept,
            audit, and search and seize any communication or data transiting or
            stored on this information system; and any communications or data
            transiting or stored on this information system may be disclosed or
            used for any lawful Government purpose. This information system may
            contain Controlled Unclassified Information (CUI) that is subject to
            safeguarding or dissemination controls in accordance with law,
            regulation, or Government-wide policy. Accessing and using this
            system indicate your understanding of this warning.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction onClick={onAcknowledge}>
          Acknowledge
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
