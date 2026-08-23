import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  costDisclosure?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  costDisclosure,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-3)] rounded-[var(--radius-lg)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-[var(--radius-sm)] shrink-0 ${
                variant === "destructive"
                  ? "bg-[var(--broken-tint)] text-[var(--broken)]"
                  : "bg-[var(--information-tint)] text-[var(--information)]"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogPrimitive.Title className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {description}
              </DialogPrimitive.Description>
            </div>
          </div>

          {costDisclosure && (
            <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--radius-xs)] text-xs text-[var(--text-secondary)] font-mono">
              <span className="font-semibold text-[var(--text-primary)]">Notice: </span>
              {costDisclosure}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "primary"}
              size="sm"
              disabled={isLoading}
              onClick={async () => {
                await onConfirm();
                onOpenChange(false);
              }}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
