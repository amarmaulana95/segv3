import { Info } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FiturBelumTersediaDialogProps {
  // Nama menu yang diklik; null = dialog tertutup.
  fitur: string | null
  onClose: () => void
}

export function FiturBelumTersediaDialog({ fitur, onClose }: FiturBelumTersediaDialogProps) {
  return (
    <AlertDialog open={fitur !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-blue-50 text-blue-700">
            <Info />
          </AlertDialogMedia>
          <AlertDialogTitle>{fitur} belum tersedia</AlertDialogTitle>
          <AlertDialogDescription>
            Saat ini hanya tersedia Quick Count, Quick Count History dan Master AHSP.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Mengerti</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
