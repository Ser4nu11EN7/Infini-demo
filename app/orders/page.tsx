"use client";

import Link from "next/link";
import { ChevronDown, ReceiptText, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition } from "@/components/PageTransition";
import { useI18n } from "@/lib/i18n";

type OrderRow = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  checkoutUrl?: string;
  infiniOrderId?: string | null;
  createdAt: string;
  product: { name: string };
};

const ORDERS_CACHE_KEY = "infini_demo_orders_cache_v1";
const ORDERS_PER_PAGE = 10;

function shortRef(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function readOrdersCache() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = window.sessionStorage.getItem(ORDERS_CACHE_KEY);
    if (!cached) {
      return null;
    }
    const parsed = JSON.parse(cached) as { orders?: OrderRow[] };
    return Array.isArray(parsed.orders) ? parsed.orders : null;
  } catch {
    return null;
  }
}

function writeOrdersCache(orders: OrderRow[]) {
  try {
    window.sessionStorage.setItem(
      ORDERS_CACHE_KEY,
      JSON.stringify({ orders, cachedAt: Date.now() })
    );
  } catch {
    // Cache is only a performance hint; ignore storage failures.
  }
}

export default function OrdersPage() {
  const { locale, t } = useI18n();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setLoadError("");
    }

    // Neon serverless can reset idle connections, so the first hit after an
    // idle period may fail with a connection error. Retry once before
    // surfacing an error to the user.
    async function fetchOnce() {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load orders");
      }
      return response.json();
    }

    try {
      let data;
      try {
        data = await fetchOnce();
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = await fetchOnce();
      }
      const nextOrders = data.orders || [];
      setOrders(nextOrders);
      writeOrdersCache(nextOrders);
    } catch {
      if (showLoading) {
        setLoadError(t.orders.loadError);
      }
    } finally {
      setLoading(false);
    }
  }, [t.orders.loadError]);

  useEffect(() => {
    const cachedOrders = readOrdersCache();
    if (cachedOrders) {
      setOrders(cachedOrders);
      setLoading(false);
      loadOrders(false);
      return;
    }
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!statusMenuOpen) {
      return;
    }

    function closeOnPointerDown(event: MouseEvent) {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setStatusMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [statusMenuOpen]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t.orders.allStatus },
      { value: "paid", label: t.orders.statuses.paid },
      { value: "pending", label: t.orders.statuses.pending },
      { value: "processing", label: t.orders.statuses.processing },
      { value: "partial_paid", label: t.orders.statuses.partial_paid },
      { value: "failed", label: t.orders.statuses.failed },
      { value: "expired", label: t.orders.statuses.expired },
    ],
    [t.orders.allStatus, t.orders.statuses]
  );

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === statusFilter)?.label || t.orders.allStatus;

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.product.name.toLowerCase().includes(normalizedQuery) ||
        order.id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visibleOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [currentPage, filteredOrders]);

  const summary = useMemo(() => {
    const paid = orders.filter((order) => order.status === "paid").length;
    const failed = orders.filter((order) =>
      ["failed", "expired"].includes(order.status)
    ).length;
    const inProgress = orders.filter((order) =>
      ["creating", "pending", "processing", "partial_paid"].includes(order.status)
    ).length;
    return {
      total: orders.length,
      paid,
      inProgress,
      failed,
    };
  }, [orders]);

  return (
    <div className="app-shell">
      <AppHeader active="orders" />

      <PageTransition className="orders-main">
        <section className="orders-top">
          <div>
            <h1 className="page-title">{t.orders.eyebrow}</h1>
          </div>
        </section>

        <section className="orders-summary" aria-label={t.orders.summary}>
          {[
            { label: t.orders.summaryTotal, value: summary.total },
            { label: t.orders.summaryPaid, value: summary.paid },
            { label: t.orders.summaryInProgress, value: summary.inProgress },
            { label: t.orders.summaryNeedsAttention, value: summary.failed },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="orders-summary-card"
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </motion.div>
          ))}
        </section>

        <section className="orders-filters" aria-label={t.orders.statusFilter}>
          <label className="search-wrap">
            <Search className="search-icon" size={16} aria-hidden="true" />
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.orders.searchPlaceholder}
            />
          </label>
          <div className="status-menu-wrap" ref={statusMenuRef}>
            <button
              className={`status-menu-trigger${statusMenuOpen ? " status-menu-trigger-open" : ""}`}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={statusMenuOpen}
              aria-label={t.orders.statusFilter}
              onClick={() => setStatusMenuOpen((open) => !open)}
            >
              <span>{selectedStatusLabel}</span>
              <ChevronDown className="status-menu-icon" size={14} aria-hidden="true" />
            </button>
            {statusMenuOpen ? (
              <div className="status-menu-list" role="listbox" aria-label={t.orders.statusFilter}>
                {statusOptions.map((option) => (
                  <button
                    className={`status-menu-option${
                      option.value === statusFilter ? " status-menu-option-active" : ""
                    }`}
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === statusFilter}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setStatusMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="orders-table-wrap" aria-label={t.nav.ordersAndStatus}>
          {loading ? (
            <div className="empty-orders">
              <span className="spinner" />
              <h3>{t.orders.loading}</h3>
            </div>
          ) : loadError ? (
            <div className="empty-orders">
              <div className="empty-icon">
                <ReceiptText size={28} />
              </div>
              <h3>{loadError}</h3>
              <button
                className="emerald-button empty-create"
                type="button"
                onClick={() => loadOrders()}
              >
                {t.orders.retry}
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">
                <ReceiptText size={28} />
              </div>
              <h3>{t.orders.empty}</h3>
              <p className="page-subtitle">{t.orders.emptyBody}</p>
              <Link href="/demo" className="emerald-button empty-create">
                {t.orders.createFirst}
              </Link>
            </div>
          ) : (
            <div className="orders-table-scroll">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>{t.orders.product}</th>
                    <th>{t.orders.amount}</th>
                    <th>{t.orders.status}</th>
                    <th>{t.orders.created}</th>
                    <th>{t.orders.action}</th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody 
                    key={`${currentPage}-${query}-${statusFilter}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {visibleOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div className="order-product">{order.product.name}</div>
                          <div className="order-id-stack">
                            <div className="order-id-line" title={order.id}>
                              <span>{t.orders.localId}:</span> {shortRef(order.id)}
                            </div>
                            {order.infiniOrderId ? (
                              <div className="order-id-line" title={order.infiniOrderId}>
                                <span>{t.orders.infiniId}:</span> {shortRef(order.infiniOrderId)}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className="detail-value">
                            {order.amount} {order.currency}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${order.status}`}>
                            {t.orders.statuses[order.status as keyof typeof t.orders.statuses] ||
                              order.status}
                          </span>
                        </td>
                        <td>
                          <span className="order-created">
                            {new Date(order.createdAt).toLocaleString(
                              locale === "zh" ? "zh-CN" : "en-US"
                            )}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link className="table-action" href={`/success?orderId=${order.id}`}>
                              {t.orders.viewStatus}
                            </Link>
                            {order.checkoutUrl ? (
                              <a
                                className="table-action"
                                href={order.checkoutUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t.orders.openCheckout}
                              </a>
                            ) : (
                              <span className="table-action-unavailable">
                                {t.orders.unavailable}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
              {filteredOrders.length > ORDERS_PER_PAGE ? (
                <div className="orders-pagination" aria-label={t.orders.pagination}>
                  <button
                    className="pagination-button"
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    {t.orders.previousPage}
                  </button>
                  <span className="pagination-count">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="pagination-button"
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t.orders.nextPage}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </PageTransition>

    </div>
  );
}
