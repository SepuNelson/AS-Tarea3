interface Props {
  users: string[];
}

export const TypingIndicator = ({ users }: Props) => {
  if (users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} está escribiendo...` : "Varios usuarios están escribiendo...";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-muted)" }}>
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      {label}
      <style>{`
        .typing-dots {
          display: inline-flex;
          gap: 4px;
        }
        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing 1.2s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};




