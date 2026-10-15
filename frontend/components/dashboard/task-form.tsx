"use client";

import { useState, type FormEvent } from "react";

type Props = { onSubmit: (instruction: string) => Promise<void>; submitting: boolean };
const examples = [
  "calculate 12 * 7",
  "Open the CRM and mark Alice Johnson as qualified",
  "Find the contact named Alice Johnson in the demo CRM",
];

export default function TaskForm({ onSubmit, submitting }: Props) {
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = instruction.trim();
    if (value.length < 3) { setError("Enter a task instruction with at least 3 characters."); return; }
    setError("");
    try {
      await onSubmit(value);
      setInstruction("");
    } catch {
      // The page displays the API error; preserve input so it can be retried.
    }
  }

  return (
    <section className="panel task-form-panel">
      <div className="panel-heading">
        <div>
          <h2 className="panel-title"><span className="title-symbol">ϟ</span>Create a new task</h2>
          <p className="panel-subtitle">Describe the outcome. Your agent will take it from there.</p>
        </div>
        <button className="button button-quiet" type="button" onClick={() => {
          setInstruction(examples[exampleIndex]);
          setExampleIndex((index) => (index + 1) % examples.length);
          setError("");
        }}>Try an example <span>⌄</span></button>
      </div>
      <form onSubmit={handleSubmit}>
        <label className="detail-label" htmlFor="task-instruction">TASK INSTRUCTION</label>
        <textarea
          id="task-instruction"
          className="task-textarea"
          value={instruction}
          onChange={(event) => { setInstruction(event.target.value.slice(0, 5000)); setError(""); }}
          placeholder="Example: calculate 12 * 7"
          maxLength={5000}
          rows={3}
          required
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-bottom">
          <span className="char-count">{instruction.length}/5000 characters</span>
          <button className="button button-primary" type="submit" disabled={submitting || !instruction.trim()}>
            {submitting ? "Creating..." : <>ϟ &nbsp; Run Task <span aria-hidden="true">→</span></>}
          </button>
        </div>
      </form>
    </section>
  );
}
