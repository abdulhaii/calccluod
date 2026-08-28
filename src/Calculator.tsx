import React, { useState, useEffect, useCallback } from "react";
import "./Calculator.css";

type OperatorType = "÷" | "×" | "−" | "+";

const OPS: Record<OperatorType, (a: number, b: number) => number> = {
  "÷": (a: number, b: number) => (b === 0 ? NaN : a / b),
  "×": (a: number, b: number) => a * b,
  "−": (a: number, b: number) => a - b,
  "+": (a: number, b: number) => a + b,
};

function formatDisplay(value: string): string {
  if (value === "Infinity" || value === "-Infinity" || value === "NaN") {
    return "خطأ";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "خطأ";
  }
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(4);
  }
  const str = value.toString();
  if (str.length > 11) {
    const rounded = parseFloat(num.toPrecision(10));
    return rounded.toString().slice(0, 11);
  }
  return str;
}

export default function Calculator() {
  const [display, setDisplay] = useState<string>("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<OperatorType | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [expression, setExpression] = useState<string>("");
  const [flashKey, setFlashKey] = useState<string | null>(null);

  const inputDigit = useCallback(
    (digit: number | string) => {
      if (waitingForOperand || display === "خطأ") {
        setDisplay(String(digit));
        setWaitingForOperand(false);
      } else {
        setDisplay(display === "0" ? String(digit) : display + digit);
      }
    },
    [display, waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    if (waitingForOperand || display === "خطأ") {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  const backspace = useCallback(() => {
    if (waitingForOperand || display === "خطأ") return;
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  }, [waitingForOperand, display]);

  const toggleSign = useCallback(() => {
    if (display === "0" || display === "خطأ") return;
    setDisplay((d) => (d.charAt(0) === "-" ? d.slice(1) : "-" + d));
  }, [display]);

  const inputPercent = useCallback(() => {
    if (display === "خطأ") return;
    const num = parseFloat(display);
    if (!isNaN(num)) {
      const result = num / 100;
      setDisplay(formatDisplay(String(result)));
    }
  }, [display]);

  const performOperator = useCallback(
    (nextOperator: OperatorType) => {
      const inputValue = parseFloat(display);

      if (isNaN(inputValue)) {
        clearAll();
        return;
      }

      if (prevValue === null) {
        setPrevValue(inputValue);
      } else if (operator && !waitingForOperand) {
        const result = OPS[operator](prevValue, inputValue);
        if (isNaN(result) || !isFinite(result)) {
          setDisplay("خطأ");
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          return;
        }
        setDisplay(formatDisplay(String(result)));
        setPrevValue(result);
      }

      setExpression(`${formatDisplay(String(prevValue ?? inputValue))} ${nextOperator}`);
      setWaitingForOperand(true);
      setOperator(nextOperator);
    },
    [display, prevValue, operator, waitingForOperand, clearAll]
  );

  const performEquals = useCallback(() => {
    const inputValue = parseFloat(display);
    if (operator === null || prevValue === null || isNaN(inputValue)) return;

    const result = OPS[operator](prevValue, inputValue);
    if (isNaN(result) || !isFinite(result)) {
      setDisplay("خطأ");
      setExpression(`${formatDisplay(String(prevValue))} ${operator} ${formatDisplay(String(inputValue))} =`);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      return;
    }

    setExpression(`${formatDisplay(String(prevValue))} ${operator} ${formatDisplay(String(inputValue))} =`);
    setDisplay(formatDisplay(String(result)));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, prevValue, operator]);

  const press = (key: string, action: () => void) => {
    setFlashKey(key);
    setTimeout(() => setFlashKey(null), 120);
    action();
  };

  // Keyboard navigation & support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key, () => inputDigit(e.key));
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        press(".", inputDecimal);
      } else if (e.key === "+") {
        e.preventDefault();
        press("+", () => performOperator("+"));
      } else if (e.key === "-") {
        e.preventDefault();
        press("−", () => performOperator("−"));
      } else if (e.key === "*") {
        e.preventDefault();
        press("×", () => performOperator("×"));
      } else if (e.key === "/") {
        e.preventDefault();
        press("÷", () => performOperator("÷"));
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        press("=", performEquals);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("back", backspace);
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        press("ac", clearAll);
      } else if (e.key === "%") {
        e.preventDefault();
        press("%", inputPercent);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [inputDigit, inputDecimal, performOperator, performEquals, backspace, clearAll, inputPercent]);

  const digitBtn = (d: number) => (
    <button
      id={`btn-digit-${d}`}
      key={d}
      type="button"
      className={`key key-digit ${flashKey === String(d) ? "is-active" : ""}`}
      onClick={() => press(String(d), () => inputDigit(d))}
      aria-label={`Digit ${d}`}
    >
      {d}
    </button>
  );

  const opBtn = (symbol: OperatorType, idSuffix: string) => (
    <button
      id={`btn-op-${idSuffix}`}
      type="button"
      className={`key key-op ${operator === symbol && waitingForOperand ? "is-selected" : ""} ${
        flashKey === symbol ? "is-active" : ""
      }`}
      onClick={() => press(symbol, () => performOperator(symbol))}
      aria-label={`Operator ${symbol}`}
    >
      {symbol}
    </button>
  );

  return (
    <div id="calculator-widget" className="calc">
      <div className="calc__header">
        <span className="calc__brand">CALC-PRO</span>
        <div className="calc__indicator">
          <span className="calc__indicator-dot" />
          <span>ON / READY</span>
        </div>
      </div>

      <div id="calculator-display" className="calc__display">
        <div id="calculator-expression" className="calc__expression">
          {expression || "\u00A0"}
        </div>
        <div id="calculator-value" className="calc__value">
          {formatDisplay(display)}
        </div>
      </div>

      <div id="calculator-keypad" className="calc__grid">
        <button
          id="btn-clear-all"
          type="button"
          className={`key key-func ${flashKey === "ac" ? "is-active" : ""}`}
          onClick={() => press("ac", clearAll)}
          title="Clear (Esc)"
        >
          AC
        </button>
        <button
          id="btn-backspace"
          type="button"
          className={`key key-func ${flashKey === "back" ? "is-active" : ""}`}
          onClick={() => press("back", backspace)}
          title="Backspace"
        >
          ⌫
        </button>
        <button
          id="btn-toggle-sign"
          type="button"
          className={`key key-func ${flashKey === "sign" ? "is-active" : ""}`}
          onClick={() => press("sign", toggleSign)}
          title="Toggle Sign"
        >
          ±
        </button>
        {opBtn("÷", "divide")}

        {digitBtn(7)}
        {digitBtn(8)}
        {digitBtn(9)}
        {opBtn("×", "multiply")}

        {digitBtn(4)}
        {digitBtn(5)}
        {digitBtn(6)}
        {opBtn("−", "subtract")}

        {digitBtn(1)}
        {digitBtn(2)}
        {digitBtn(3)}
        {opBtn("+", "add")}

        <button
          id="btn-percent"
          type="button"
          className={`key key-func ${flashKey === "%" ? "is-active" : ""}`}
          onClick={() => press("%", inputPercent)}
          title="Percent (%)"
        >
          %
        </button>
        {digitBtn(0)}
        <button
          id="btn-decimal"
          type="button"
          className={`key key-digit ${flashKey === "." ? "is-active" : ""}`}
          onClick={() => press(".", inputDecimal)}
          title="Decimal"
        >
          .
        </button>
        <button
          id="btn-equals"
          type="button"
          className={`key key-equals ${flashKey === "=" ? "is-active" : ""}`}
          onClick={() => press("=", performEquals)}
          title="Equals (Enter)"
        >
          =
        </button>
      </div>
    </div>
  );
}
