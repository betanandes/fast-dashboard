import { useState } from "react";
import {
  Accessibility,
  Sun,
  Moon,
  Contrast,
  ALargeSmall,
  X,
  Check,
} from "lucide-react";
import { useThemeContext } from "../../hooks/ThemeContext";
import type { FontSize } from "../../hooks/ThemeContext";

const fontLabels: Record<FontSize, string> = {
  normal: "Normal",
  large: "Grande",
  xlarge: "Muito grande",
};

const fontSizes: FontSize[] = ["normal", "large", "xlarge"];

export default function A11yPanel() {
  const { dark, toggle, fontSize, setFontSize, contrast, setContrast } =
    useThemeContext();

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4"
        style={{
          backgroundColor: "var(--color-brand)",
          color: "white",
          boxShadow: "var(--shadow-lg)",
        }}
        aria-label="Opções de acessibilidade"
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <Accessibility className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Painel */}
      {open && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label="Painel de acessibilidade"
          className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl p-5 shadow-xl"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Cabeçalho */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Accessibility
                className="h-4 w-4"
                style={{ color: "var(--color-brand)" }}
                aria-hidden="true"
              />
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Acessibilidade
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              aria-label="Fechar painel de acessibilidade"
            >
              <X
                className="h-4 w-4"
                style={{ color: "var(--color-text-muted)" }}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="space-y-5">
            {/* Tema */}
            <section aria-labelledby="tema-label">
              <p
                id="tema-label"
                className="mb-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Tema
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (dark) toggle();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: !dark
                      ? "var(--color-brand-soft)"
                      : "var(--color-surface-2)",
                    borderColor: !dark
                      ? "var(--color-brand)"
                      : "var(--color-border)",
                    color: !dark
                      ? "var(--color-brand)"
                      : "var(--color-text-secondary)",
                  }}
                  aria-pressed={!dark}
                  aria-label="Tema claro"
                >
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  Claro
                  {!dark && (
                    <Check className="h-3 w-3 ml-auto" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!dark) toggle();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: dark
                      ? "var(--color-brand-soft)"
                      : "var(--color-surface-2)",
                    borderColor: dark
                      ? "var(--color-brand)"
                      : "var(--color-border)",
                    color: dark
                      ? "var(--color-brand)"
                      : "var(--color-text-secondary)",
                  }}
                  aria-pressed={dark}
                  aria-label="Tema escuro"
                >
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  Escuro
                  {dark && (
                    <Check className="h-3 w-3 ml-auto" aria-hidden="true" />
                  )}
                </button>
              </div>
            </section>

            {/* Tamanho da fonte */}
            <section aria-labelledby="fonte-label">
              <p
                id="fonte-label"
                className="mb-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Tamanho do texto
              </p>
              <div className="flex gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className="flex-1 rounded-xl border py-2.5 text-center font-medium transition-all"
                    style={{
                      fontSize:
                        size === "normal"
                          ? "13px"
                          : size === "large"
                            ? "15px"
                            : "17px",
                      backgroundColor:
                        fontSize === size
                          ? "var(--color-brand-soft)"
                          : "var(--color-surface-2)",
                      borderColor:
                        fontSize === size
                          ? "var(--color-brand)"
                          : "var(--color-border)",
                      color:
                        fontSize === size
                          ? "var(--color-brand)"
                          : "var(--color-text-secondary)",
                    }}
                    aria-pressed={fontSize === size}
                    aria-label={`Tamanho de texto ${fontLabels[size]}`}
                  >
                    A
                  </button>
                ))}
              </div>
              <p
                className="mt-1.5 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
                aria-live="polite"
              >
                {fontLabels[fontSize]}
              </p>
            </section>

            {/* Contraste */}
            <section aria-labelledby="contraste-label">
              <p
                id="contraste-label"
                className="mb-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Contraste
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setContrast("normal")}
                  className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      contrast === "normal"
                        ? "var(--color-brand-soft)"
                        : "var(--color-surface-2)",
                    borderColor:
                      contrast === "normal"
                        ? "var(--color-brand)"
                        : "var(--color-border)",
                    color:
                      contrast === "normal"
                        ? "var(--color-brand)"
                        : "var(--color-text-secondary)",
                  }}
                  aria-pressed={contrast === "normal"}
                  aria-label="Contraste normal"
                >
                  <ALargeSmall className="h-4 w-4" aria-hidden="true" />
                  Normal
                  {contrast === "normal" && (
                    <Check className="h-3 w-3 ml-auto" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setContrast("high")}
                  className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      contrast === "high"
                        ? "var(--color-brand-soft)"
                        : "var(--color-surface-2)",
                    borderColor:
                      contrast === "high"
                        ? "var(--color-brand)"
                        : "var(--color-border)",
                    color:
                      contrast === "high"
                        ? "var(--color-brand)"
                        : "var(--color-text-secondary)",
                  }}
                  aria-pressed={contrast === "high"}
                  aria-label="Alto contraste"
                >
                  <Contrast className="h-4 w-4" aria-hidden="true" />
                  Alto
                  {contrast === "high" && (
                    <Check className="h-3 w-3 ml-auto" aria-hidden="true" />
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
