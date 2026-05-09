"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tarayıcının native print fonksiyonunu tetikler.
 * Kullanıcı "Hedef: PDF olarak kaydet" seçerse hukuki belge üretilir.
 */
export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Yazdır / PDF Kaydet
    </Button>
  );
}
