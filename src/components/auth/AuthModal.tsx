import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to perform this action.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Please log in or create an account to continue.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button asChild>
            <Link to="/auth" onClick={onClose}>
              Login / Sign Up
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
