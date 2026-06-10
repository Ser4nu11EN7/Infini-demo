"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { trackClientEvent, trackingHeaders } from "@/lib/tracking-client";

const STATUS_POLL_INTERVAL_MS = 3000;
const MAX_STATUS_POLLS = 100;

type StatusResponse = {
  ok: boolean;
  order?: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    infiniOrderId?: string;
    createdAt?: string;
    product?: { name: string };
  };
  reason?: string;
};

async function fetchOrderStatus(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    headers: trackingHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to refresh order status");
  }
  return (await response.json()) as StatusResponse;
}

function statusLabel(status: string, labels: Record<string, string>) {
  return labels[status] || status;
}

function formatDate(value: string | undefined, locale: "en" | "zh") {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuccessPage() {
  const { locale, t } = useI18n();
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState("");
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsSettled, setDetailsSettled] = useState(false);
  const [detailHeight, setDetailHeight] = useState(0);
  const statusErrorTextRef = useRef(t.success.statusError);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const order = status?.order;
  const paid = order?.status === "paid";
  const statusClass = order?.status ? `status-${order.status}` : "status-pending";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId") || "";
    setOrderId(id);
    trackClientEvent("success_page_viewed", { orderId: id });
  }, []);

  useEffect(() => {
    statusErrorTextRef.current = t.success.statusError;
  }, [t.success.statusError]);

  useEffect(() => {
    if (!paid) {
      setDetailsExpanded(false);
      setDetailsSettled(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setDetailsExpanded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [paid]);

  useEffect(() => {
    if (!detailsExpanded) {
      setDetailsSettled(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setDetailsSettled(true);
    }, 980);
    return () => window.clearTimeout(timer);
  }, [detailsExpanded]);

  useEffect(() => {
    if (!order || !detailsRef.current) {
      setDetailHeight(0);
      return;
    }

    const updateHeight = () => {
      setDetailHeight(detailsRef.current?.scrollHeight || 0);
    };
    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(detailsRef.current);
    return () => observer.disconnect();
  }, [order, locale]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let cancelled = false;
    let pollCount = 0;
    let interval: number | undefined;

    function stopPolling() {
      if (interval) {
        window.clearInterval(interval);
      }
    }

    async function poll() {
      pollCount += 1;
      try {
        const data = await fetchOrderStatus(orderId);
        if (cancelled) {
          return;
        }
        setStatus(data);
        setStatusError("");
        const nextStatus = data.order?.status;
        if (nextStatus === "paid" || nextStatus === "failed" || nextStatus === "expired") {
          stopPolling();
          return;
        }
      } catch {
        if (!cancelled) {
          setStatusError(statusErrorTextRef.current);
        }
      }

      if (!cancelled && pollCount >= MAX_STATUS_POLLS) {
        setPollTimedOut(true);
        stopPolling();
      }
    }

    setPollTimedOut(false);
    poll();
    interval = window.setInterval(poll, STATUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [orderId]);

  async function refreshStatus() {
    if (!orderId || refreshing) {
      return;
    }
    setRefreshing(true);
    setPollTimedOut(false);
    try {
      const data = await fetchOrderStatus(orderId);
      setStatus(data);
      setStatusError("");
    } catch {
      setStatusError(t.success.statusError);
    } finally {
      setRefreshing(false);
    }
  }

  function copyWithTextArea(value: string) {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.inset = "0 auto auto 0";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, value.length);
    const copiedText = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (!copiedText) {
      throw new Error("Copy command failed");
    }
  }

  async function copyOrderId() {
    if (!order?.id) {
      return;
    }
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(order.id);
      } else {
        copyWithTextArea(order.id);
      }
      setCopiedOrderId(true);
      window.setTimeout(() => setCopiedOrderId(false), 1600);
    } catch {
      try {
        copyWithTextArea(order.id);
        setCopiedOrderId(true);
        window.setTimeout(() => setCopiedOrderId(false), 1600);
      } catch {
        setCopiedOrderId(false);
      }
    }
  }

  return (
    <div className="app-shell">
      <AppHeader active="orders" />

      <main className={`success-main ${paid ? "success-main-paid" : "success-main-checking"}`}>
        <section className="success-hero">
          <div className={`success-icon${paid ? " success-icon-paid" : " checking-icon"}`} aria-hidden="true">
            <span className="success-icon-ring" />
            <span className="success-icon-fill" />
            <svg className="success-check-svg" viewBox="0 0 80 80" focusable="false">
              <path d="M25 42 L36 53 L57 29" />
            </svg>
          </div>
          <h1 className="page-title">
            {paid ? t.success.paidTitle : t.success.checkingTitle}
          </h1>
        </section>

        <section
          className={`order-card success-receipt-card ${
            paid ? "success-receipt-card-paid" : "success-receipt-card-checking"
          }`}
          aria-label={t.success.order}
        >
          <div className="order-card-top success-receipt-head">
            <div>
              <h2 className="card-kicker">{t.success.receipt}</h2>
              <p className="success-receipt-subtitle">{t.success.receiptSubtitle}</p>
            </div>
            <div className="success-receipt-summary">
              <span className={`status-pill ${statusClass}`}>
                {order
                  ? statusLabel(order.status, t.orders.statuses)
                  : t.success.checkingEyebrow}
              </span>
            </div>
          </div>

          <div
            className={`status-copy success-pending-copy${
              detailsExpanded ? " success-pending-copy-hidden" : ""
            }`}
            aria-hidden={detailsExpanded}
          >
            <div className="success-pending-copy-inner">
              <p className="page-subtitle">
                {pollTimedOut ? t.success.stillConfirming : status?.reason || t.success.waiting}
              </p>
              {statusError ? <p className="error-text">{statusError}</p> : null}
            </div>
          </div>

          {order ? (
            <div
              className={`success-detail-stack${detailsExpanded ? " success-detail-stack-expanded" : ""}`}
              style={{ height: detailsSettled ? "auto" : detailsExpanded ? `${detailHeight}px` : 0 }}
            >
              <div className="success-detail-stack-inner" ref={detailsRef}>
                <div className="detail-row">
                  <span className="detail-label">{t.success.product}</span>
                  <span className="detail-value">{order.product?.name || t.success.fallbackProduct}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t.success.amount}</span>
                  <span className="detail-value">
                    {order.amount} {order.currency}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t.success.orderId}</span>
                  <span className="success-copy-value">
                    <span className="detail-value">{order.id}</span>
                    <button
                      className={`success-copy-button${copiedOrderId ? " success-copy-button-done" : ""}`}
                      type="button"
                      onClick={copyOrderId}
                      aria-label={copiedOrderId ? t.success.copied : t.success.copyOrderId}
                      title={copiedOrderId ? t.success.copied : t.success.copyOrderId}
                    >
                      <Copy size={13} aria-hidden="true" />
                    </button>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t.orders.created}</span>
                  <span className="detail-value">{formatDate(order.createdAt, locale)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <div className="success-actions">
          {!paid ? (
            <button
              className="emerald-button outline-button full-button"
              type="button"
              onClick={refreshStatus}
              disabled={!orderId || refreshing}
            >
              {refreshing ? t.success.checkingEyebrow : t.success.refreshStatus}
            </button>
          ) : null}
          <Link href="/demo" className="emerald-button full-button">
            {t.success.createAnother}
          </Link>
          <Link href="/orders" className="emerald-button outline-button full-button">
            {t.success.viewOrders}
          </Link>
        </div>
      </main>

    </div>
  );
}
