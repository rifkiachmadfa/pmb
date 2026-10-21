"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  refreshPaymentStatus,
  startInitialPayment,
} from "@/features/payment/actions";
import type { OwnPaymentSummary } from "@/server/payments/create";

/**
 * Initial-payment card with the Midtrans Snap popup (Phase 6).
 *
 * Trust model: nothing in this component decides that a payment succeeded. Snap
 * callbacks (onSuccess/onPending/onError/onClose) are only hints that make the
 * browser ask the SERVER to re-check; the displayed status always comes from the
 * server (`refreshPaymentStatus`), which verifies with Midtrans server-to-server.
 * No amount, order id, or status is sent from here; the server derives them.
 * Only the public client key and the snap.js URL arrive as props.
 */

export type SnapConfig = { jsUrl: string; clientKey: string };

type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks?: SnapCallbacks) => void };
  }
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const STATUS_LABEL: Record<OwnPaymentSummary["status"], string> = {
  NOT_STARTED: "Belum dibayar",
  PENDING: "Menunggu pembayaran",
  PAID: "Pembayaran terverifikasi",
  FAILED: "Pembayaran gagal",
  EXPIRED: "Pembayaran kedaluwarsa",
  CANCELED: "Pembayaran dibatalkan",
};

type Message = { variant: "default" | "warning" | "destructive"; title: string; text?: string } | null;

let snapLoading: Promise<void> | null = null;

/** Loads snap.js once. The URL and client key come from the server (never hard-coded here). */
function loadSnap(config: SnapConfig): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.snap) return Promise.resolve();
  if (snapLoading) return snapLoading;
  snapLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = config.jsUrl;
    script.async = true;
    script.setAttribute("data-client-key", config.clientKey);
    script.onload = () => (window.snap ? resolve() : reject(new Error("snap missing")));
    script.onerror = () => {
      script.remove();
      reject(new Error("snap failed to load"));
    };
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    snapLoading = null; // allow a retry after a network failure
    throw e;
  });
  return snapLoading;
}

export function PaymentCard({
  initial,
  snap,
}: {
  initial: OwnPaymentSummary;
  /** null when Midtrans is not configured on the server. */
  snap: SnapConfig | null;
}) {
  const [payment, setPayment] = useState<OwnPaymentSummary>(initial);
  const [message, setMessage] = useState<Message>(null);
  const [starting, startStart] = useTransition();
  const [checking, startCheck] = useTransition();
  const [popupOpen, setPopupOpen] = useState(false);
  const autoChecked = useRef(false);

  const paid = payment.status === "PAID";
  const busy = starting || checking || popupOpen;

  /** Asks the server to verify with Midtrans, then shows the stored state. */
  const recheck = useCallback(
    (quiet = false) => {
      startCheck(async () => {
        const result = await refreshPaymentStatus();
        if (result.status === "unauthenticated") {
          setMessage({
            variant: "warning",
            title: "Sesi Anda berakhir",
            text: "Masuk kembali untuk melihat status pembayaran.",
          });
          return;
        }
        if (result.status === "error") {
          setMessage({
            variant: "destructive",
            title: "Status belum bisa diperiksa",
            text: "Terjadi kendala. Coba lagi beberapa saat lagi.",
          });
          return;
        }
        if (result.payment) setPayment(result.payment);
        const sync = result.sync.status;
        if (result.payment?.status === "PAID") {
          setMessage(null);
        } else if (sync === "provider_unavailable") {
          setMessage({
            variant: "warning",
            title: "Midtrans belum bisa dihubungi",
            text: "Status terakhir yang tersimpan ditampilkan. Coba periksa lagi nanti.",
          });
        } else if (!quiet) {
          setMessage({
            variant: "default",
            title: "Status diperbarui",
            text: "Pembayaran baru dianggap berhasil setelah diverifikasi oleh sistem.",
          });
        } else {
          setMessage(null);
        }
      });
    },
    [],
  );

  // Returning from an e-wallet/bank page (or reloading) with an unpaid attempt:
  // ask the server once. This is only a request to check, never proof of payment.
  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;
    if (initial.status === "PENDING" && initial.orderId) recheck(true);
  }, [initial.status, initial.orderId, recheck]);

  function pay() {
    setMessage(null);
    startStart(async () => {
      const result = await startInitialPayment();
      switch (result.status) {
        case "ready": {
          if (!snap) {
            setMessage({
              variant: "destructive",
              title: "Pembayaran belum tersedia",
              text: "Konfigurasi pembayaran belum lengkap. Hubungi panitia PMB.",
            });
            return;
          }
          try {
            await loadSnap(snap);
          } catch {
            setMessage({
              variant: "destructive",
              title: "Halaman pembayaran gagal dimuat",
              text: "Periksa koneksi internet Anda, lalu coba lagi. Pembayaran Anda tidak dikenakan.",
            });
            return;
          }
          setPayment((p) => ({
            ...p,
            status: "PENDING",
            orderId: result.orderId,
            expiresAt: result.expiresAt,
          }));
          setPopupOpen(true);
          window.snap!.pay(result.snapToken, {
            onSuccess: () => {
              setPopupOpen(false);
              recheck();
            },
            onPending: () => {
              setPopupOpen(false);
              recheck();
            },
            onError: () => {
              setPopupOpen(false);
              setMessage({
                variant: "destructive",
                title: "Pembayaran tidak berhasil",
                text: "Anda dapat mencoba lagi. Jika saldo sudah terpotong, periksa status setelah beberapa menit.",
              });
              recheck();
            },
            onClose: () => {
              setPopupOpen(false);
              recheck();
            },
          });
          return;
        }
        case "already_paid":
          recheck();
          return;
        case "not_submitted":
          setMessage({
            variant: "warning",
            title: "Pendaftaran belum terkirim",
            text: "Kirim pendaftaran terlebih dahulu sebelum membayar.",
          });
          return;
        case "in_progress":
          setMessage({
            variant: "warning",
            title: "Pembayaran sedang disiapkan",
            text: "Tunggu beberapa detik, lalu tekan tombol lagi.",
          });
          return;
        case "provider_unavailable":
          setMessage({
            variant: "warning",
            title: "Layanan pembayaran sedang tidak tersedia",
            text: "Coba lagi beberapa saat lagi.",
          });
          return;
        case "not_configured":
          setMessage({
            variant: "destructive",
            title: "Pembayaran belum tersedia",
            text: "Konfigurasi pembayaran belum lengkap. Hubungi panitia PMB.",
          });
          return;
        case "unauthenticated":
          setMessage({
            variant: "warning",
            title: "Sesi Anda berakhir",
            text: "Masuk kembali untuk melanjutkan pembayaran.",
          });
          return;
        default:
          setMessage({
            variant: "destructive",
            title: "Pembayaran belum bisa dimulai",
            text: "Terjadi kendala. Coba lagi beberapa saat lagi.",
          });
      }
    });
  }

  const retryable =
    payment.status === "FAILED" ||
    payment.status === "EXPIRED" ||
    payment.status === "CANCELED";
  const buttonLabel = starting
    ? "Menyiapkan pembayaran..."
    : payment.status === "PENDING"
      ? "Lanjutkan pembayaran"
      : retryable
        ? "Coba bayar lagi"
        : `Bayar ${idr.format(payment.amountIdr)}`;

  return (
    <section aria-labelledby="pay-heading" className="flex flex-col gap-4">
      <h2 id="pay-heading" className="text-lg font-semibold tracking-tight">
        Pembayaran awal
      </h2>

      <dl className="grid gap-x-6 gap-y-3 border-y border-border py-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Status pembayaran</dt>
          <dd className="text-sm font-medium" aria-live="polite">
            {STATUS_LABEL[payment.status]}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Jumlah</dt>
          <dd className="text-sm font-medium">{idr.format(payment.amountIdr)}</dd>
        </div>
        {paid && payment.paidAt ? (
          <div>
            <dt className="text-sm text-muted-foreground">Dibayar pada</dt>
            <dd className="text-sm font-medium">{dateFormat.format(payment.paidAt)} WIB</dd>
          </div>
        ) : null}
        {payment.status === "PENDING" && payment.expiresAt ? (
          <div>
            <dt className="text-sm text-muted-foreground">Bayar sebelum</dt>
            <dd className="text-sm font-medium">{dateFormat.format(payment.expiresAt)} WIB</dd>
          </div>
        ) : null}
      </dl>

      <p className="text-sm text-muted-foreground">
        Pembayaran awal {idr.format(payment.amountIdr)} diperhitungkan sebagai bagian dari biaya
        masuk, bukan biaya tambahan. Membayar tidak berarti diterima; keputusan penerimaan
        ditetapkan oleh petugas sekolah.
      </p>

      {message ? (
        <Alert variant={message.variant}>
          <AlertTitle>{message.title}</AlertTitle>
          {message.text ? <AlertDescription>{message.text}</AlertDescription> : null}
          {message.variant === "warning" && message.title === "Sesi Anda berakhir" ? (
            <AlertDescription>
              <Link href="/masuk?next=/dashboard" className="underline underline-offset-4">
                Masuk kembali
              </Link>
            </AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {paid ? (
        <Alert>
          <AlertTitle>Pembayaran awal sudah terverifikasi</AlertTitle>
          <AlertDescription>
            Terima kasih. Status penerimaan Anda tetap terpisah dan akan diumumkan oleh sekolah.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={pay} disabled={busy || !snap} aria-busy={starting}>
            {buttonLabel}
          </Button>
          {payment.status === "PENDING" ? (
            <Button variant="outline" onClick={() => recheck()} disabled={busy}>
              {checking ? "Memeriksa..." : "Periksa status pembayaran"}
            </Button>
          ) : null}
        </div>
      )}

      {!snap && !paid ? (
        <p className="text-sm text-muted-foreground">
          Pembayaran online belum diaktifkan. Hubungi panitia PMB.
        </p>
      ) : null}
    </section>
  );
}
