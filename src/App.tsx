import React from "react";
import Calculator from "./Calculator";
import "./Calculator.css";

export default function App() {
  return (
    <main id="app-container" className="calc-page">
      <Calculator />
      <footer id="app-footer" className="calc-footer">
        <p>يمكنك استخدام لوحة المفاتيح (الأرقام، +, -, *, /, Enter, Backspace, Esc)</p>
      </footer>
    </main>
  );
}
