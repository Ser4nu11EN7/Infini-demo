"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, Sparkles, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition } from "@/components/PageTransition";
import { useI18n } from "@/lib/i18n";
import {
  trackClientEvent,
  trackingHeaders,
} from "@/lib/tracking-client";

type ParsedProduct = {
  productName: string;
  price: string;
  currency: string;
};

type CheckoutResult = {
  orderId: string;
  checkoutUrl: string;
};

type EditingField = "productName" | "amount" | null;

export default function DemoPage() {
  const { locale, t } = useI18n();
  const defaultInput =
    locale === "zh" ? "售卖一份 AI 市场报告，价格 $10" : "I want to sell an AI report for $10";
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedProduct | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [previousCheckoutUrl, setPreviousCheckoutUrl] = useState("");
  const [isLinkRolling, setIsLinkRolling] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCreatingAnother, setIsCreatingAnother] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [parseFeedbackIndex, setParseFeedbackIndex] = useState(0);
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const detailsRef = useRef<HTMLElement | null>(null);
  const lastCheckoutUrlRef = useRef("");

  useEffect(() => {
    if (!parsed) {
      return;
    }

    window.setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [parsed]);

  useEffect(() => {
    const nextUrl = checkoutResult?.checkoutUrl || "";
    const previousUrl = lastCheckoutUrlRef.current;

    if (!nextUrl) {
      lastCheckoutUrlRef.current = "";
      setPreviousCheckoutUrl("");
      setIsLinkRolling(false);
      return;
    }

    if (previousUrl && previousUrl !== nextUrl) {
      setPreviousCheckoutUrl(previousUrl);
      setIsLinkRolling(true);
      const timer = window.setTimeout(() => {
        setIsLinkRolling(false);
        setPreviousCheckoutUrl("");
      }, 440);
      lastCheckoutUrlRef.current = nextUrl;
      return () => window.clearTimeout(timer);
    }

    lastCheckoutUrlRef.current = nextUrl;
  }, [checkoutResult?.checkoutUrl]);

  function displayReason(
    reason: string | undefined,
    fallback: string,
    reasonCode?: keyof typeof t.demo.errors
  ) {
    if (reasonCode && t.demo.errors[reasonCode]) {
      return t.demo.errors[reasonCode];
    }
    if (!reason) {
      return fallback;
    }
    if (locale === "zh" && /^[\x00-\x7F]+$/.test(reason)) {
      return fallback;
    }
    return reason;
  }

  async function parseInput() {
    if (!input.trim() || isParsing) return;
    
    setError("");
    setCopyError("");
    setParsed(null);
    setCreatedProductId(null);
    setCheckoutResult(null);
    setCopied(false);
    setEditingField(null);
    setClientRequestId(crypto.randomUUID());
    setIsParsing(true);
    setParseFeedbackIndex(0);
    trackClientEvent("parse_submitted", { inputLength: input.length });

    try {
      const responsePromise = fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...trackingHeaders(),
        },
        body: JSON.stringify({ text: input }),
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      setParseFeedbackIndex(1);
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      setParseFeedbackIndex(2);

      const response = await responsePromise;
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(displayReason(data.reason, t.demo.parseError, data.reasonCode));
        setIsParsing(false);
        return;
      }

      setParseFeedbackIndex(3);
      await new Promise((resolve) => setTimeout(resolve, 400));

      setParsed({
        productName: data.productName,
        price: data.price,
        currency: data.currency,
      });
      setIsParsing(false);
    } catch {
      setError(t.demo.parseError);
      setIsParsing(false);
    }
  }

  async function getOrCreateProductId() {
    if (!parsed) {
      return null;
    }
    if (createdProductId) {
      return createdProductId;
    }

    try {
      const productResponse = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.productName,
          price: parsed.price,
          currency: parsed.currency,
        }),
      });
      const productData = await productResponse.json();
      if (!productResponse.ok || !productData.ok) {
        setError(displayReason(productData.reason, t.demo.productError));
        return null;
      }

      setCreatedProductId(productData.product.id);
      return productData.product.id as string;
    } catch {
      setError(t.demo.productError);
      return null;
    }
  }

  async function createCheckout(requestId = clientRequestId, isAnother = false) {
    if (!parsed) {
      return;
    }
    setError("");
    setCopyError("");
    setEditingField(null);
    
    if (isAnother) {
      setIsCreatingAnother(true);
    } else {
      setIsCreatingOrder(true);
    }

    try {
      const productId = await getOrCreateProductId();
      if (!productId) {
        return;
      }

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...trackingHeaders(),
        },
        body: JSON.stringify({
          productId,
          clientRequestId: requestId,
        }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.ok) {
        setError(displayReason(orderData.reason, t.demo.orderError));
        return;
      }

      setCopied(false);
      setCopyError("");
      setCheckoutResult({
        orderId: orderData.orderId,
        checkoutUrl: orderData.checkout_url,
      });
    } catch {
      setError(t.demo.orderError);
    } finally {
      setIsCreatingAnother(false);
      setIsCreatingOrder(false);
    }
  }

  async function createAnotherCheckout() {
    const nextRequestId = crypto.randomUUID();
    setClientRequestId(nextRequestId);
    await createCheckout(nextRequestId, true);
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

  async function writeClipboardText(value: string) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        copyWithTextArea(value);
        return;
      }
    }

    copyWithTextArea(value);
  }

  async function copyCheckoutLink() {
    if (!checkoutResult) {
      return;
    }
    try {
      await writeClipboardText(checkoutResult.checkoutUrl);
      setCopyError("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(t.demo.copyError);
    }
  }

  function openCheckout() {
    if (!checkoutResult || !parsed) {
      return;
    }
    trackClientEvent("checkout_redirected", {
      orderId: checkoutResult.orderId,
      amount: parsed.price,
      currency: parsed.currency,
    });
    window.location.href = checkoutResult.checkoutUrl;
  }

  return (
    <div className="app-shell">
      <AppHeader active="demo" />

      <PageTransition className="demo-main">
        <header className="page-header">
          <h1 className="page-title">{t.demo.title}</h1>
          <p className="page-subtitle">{t.demo.subtitle}</p>
        </header>

        <section className="payment-form" aria-label={t.demo.paymentDescription}>
          <div className="field-row">
            <label className="field-label" htmlFor="request">
              {t.demo.paymentDescription}
            </label>
            <span className="char-count">
              {input.length} / 500
            </span>
          </div>
          <div className="payment-input-wrap">
            <textarea
              id="request"
              className={`payment-textarea${error ? " payment-textarea-error" : ""}`}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              maxLength={500}
              placeholder={defaultInput}
            />
            <div className="payment-submit-dock">
              <AnimatePresence>
                {(input.trim().length > 0) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="payment-extract-btn"
                    type="button"
                    onClick={parseInput}
                    disabled={isParsing}
                    title={t.demo.generate}
                  >
                    <Sparkles size={16} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <AnimatePresence mode="popLayout">
          {isParsing ? (
            <motion.section 
              key="parse-steps"
              initial={{ opacity: 0, height: 0, overflow: "hidden" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, y: -24, height: 0 }}
              transition={{ duration: 0.3 }}
              aria-label={t.demo.loadingParse} 
              aria-live="polite"
            >
              <div className="parse-progress-container">
                <div className="parse-progress-track">
                  <motion.div 
                    className="parse-progress-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(100, (parseFeedbackIndex / (t.demo.parseFeedback.length - 1)) * 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
                <ul className="parse-progress-nodes">
                  {t.demo.parseFeedback.map((label, index) => {
                    const state =
                      index < parseFeedbackIndex
                        ? "done"
                        : index === parseFeedbackIndex
                          ? "active"
                          : "pending";
                    return (
                      <li className={`parse-node parse-node-${state}`} key={label}>
                        <motion.div 
                          className="parse-node-dot"
                          animate={state === "active" ? { 
                            boxShadow: ["0 0 0 0 rgba(80,189,93,0.3)", "0 0 0 6px rgba(80,189,93,0)", "0 0 0 0 rgba(80,189,93,0)"],
                            scale: [1, 1.1, 1] 
                          } : {}}
                          transition={state === "active" ? { repeat: Infinity, duration: 1.5 } : {}}
                        >
                          {state === "done" ? <Check size={12} strokeWidth={3} /> : null}
                        </motion.div>
                        <span className="parse-node-label">{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.section>
          ) : null}

          {parsed ? (
            <motion.section
              key="details-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="details-card"
              ref={detailsRef}
              aria-label={t.demo.extractedDetails}
            >
              <div className="card-head">
                <span className="card-kicker">{t.demo.extractedDetails}</span>
              </div>
            <div className="detail-row">
              <span className="detail-label">{t.demo.productName}</span>
              {editingField === "productName" ? (
                <div className="editable-value-wrapper">
                  <input
                    className="editable-input"
                    value={parsed.productName}
                    onChange={(e) => setParsed({...parsed, productName: e.target.value})}
                    autoFocus
                  />
                  <button className="inline-edit-btn active" onClick={() => setEditingField(null)} aria-label="Done">
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="detail-value-group">
                  <span className="detail-value">{parsed.productName}</span>
                  {!checkoutResult && (
                    <button className="inline-edit-btn" onClick={() => setEditingField("productName")} aria-label="Edit">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.demo.amount}</span>
              <div className="detail-value">
                {editingField === "amount" ? (
                  <div className="editable-value-wrapper">
                    <div className="editable-price-group">
                      <input
                        className="editable-input price-input"
                        value={parsed.price}
                        onChange={(e) => setParsed({...parsed, price: e.target.value})}
                        type="number"
                        step="0.01"
                        min="0"
                      />
                      <span className="currency-label">{parsed.currency}</span>
                    </div>
                    <button className="inline-edit-btn active" onClick={() => setEditingField(null)} aria-label="Done">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="detail-value-group">
                    <span>
                      {parsed.price} {parsed.currency}
                    </span>
                    {!checkoutResult && (
                      <button className="inline-edit-btn" onClick={() => setEditingField("amount")} aria-label="Edit">
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.demo.paymentMethod}</span>
              <span className="detail-value">{t.demo.cryptoCheckout}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.demo.provider}</span>
              <span className="detail-value">{t.demo.infiniSandbox}</span>
            </div>

            {!checkoutResult ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="details-actions"
              >
                <button
                  className="emerald-button full-button"
                  type="button"
                  onClick={() => createCheckout()}
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? t.demo.creating : t.demo.confirmCreate}
                </button>
              </motion.div>
            ) : null}
          </motion.section>
        ) : null}

        {checkoutResult ? (
          <motion.section 
            key="checkout-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
            className="checkout-result-card" 
            aria-label={t.demo.checkoutReady}
          >
            <div className="checkout-result-heading">
              <span className="checkout-result-icon" aria-hidden="true">
                <Check size={14} strokeWidth={4} />
              </span>
              <h2>{t.demo.checkoutReady}</h2>
            </div>
            <div>
              <p className="checkout-result-copy">{t.demo.checkoutReadyBody}</p>
            </div>
            <div className="checkout-url-box" aria-label={t.demo.checkoutUrl}>
              <span
                className={`checkout-url-viewport${isLinkRolling ? " checkout-url-rolling" : ""}`}
                aria-live="polite"
              >
                {isLinkRolling && previousCheckoutUrl ? (
                  <span className="checkout-url-line checkout-url-old">
                    {previousCheckoutUrl}
                  </span>
                ) : null}
                <span className="checkout-url-line checkout-url-current">
                  {checkoutResult.checkoutUrl}
                </span>
              </span>
              <button
                className={`checkout-copy-button${copied ? " checkout-copy-button-done" : ""}`}
                type="button"
                onClick={copyCheckoutLink}
                aria-label={copied ? t.demo.copied : t.demo.copyLink}
              >
                <Copy size={14} aria-hidden="true" />
                <span className="checkout-copy-label" aria-live="polite">
                  <span
                    className={`checkout-copy-text checkout-copy-text-default${
                      copied ? "" : " checkout-copy-text-active"
                    }`}
                  >
                    {t.demo.copyLink}
                  </span>
                  <span
                    className={`checkout-copy-text checkout-copy-text-done${
                      copied ? " checkout-copy-text-active" : ""
                    }`}
                  >
                    {t.demo.copied}
                  </span>
                </span>
              </button>
            </div>
            {copyError ? <p className="checkout-copy-error">{copyError}</p> : null}
            <div className="checkout-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={createAnotherCheckout}
                disabled={isCreatingAnother}
                aria-busy={isCreatingAnother}
              >
                {isCreatingAnother ? (
                  <span className="button-spinner" aria-hidden="true" />
                ) : (
                  <RefreshCw size={15} aria-hidden="true" />
                )}
                {isCreatingAnother ? t.demo.creating : t.demo.createAnotherLink}
              </button>
              <button className="emerald-button" type="button" onClick={openCheckout}>
                <ExternalLink size={15} aria-hidden="true" />
                {t.demo.openCheckout}
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </PageTransition>

    </div>
  );
}
