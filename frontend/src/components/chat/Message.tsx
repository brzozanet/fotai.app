import type { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import iconClock8 from "../../assets/icons/icon-clock8.svg";
import iconUser from "../../assets/icons/icon-user.svg";
// import iconFotai from "../../assets/icons/icon-fotai.svg";
import iconAssistant from "../../assets/icons/icon-assistant.svg";

export function Message({ role, content, timestamp }: Message) {
  const isUser = role === "user";
  const avatar = isUser ? iconUser : iconAssistant;

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <img
          src={avatar}
          alt="assistant"
          title="assistant"
          className="h-8 w-8 rounded-full"
        />
      )}

      <div
        className={`max-w-[75%] rounded-3xl border border-border/60 px-4 py-2 text-sm shadow-sm ${
          isUser
            ? "bg-secondary/90 text-secondary-foreground"
            : "bg-card/95 text-card-foreground"
        }`}
      >
        <div className="text-left text-[16px] mb-3 mt-1">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-3 leading-relaxed">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold mt-1 mb-4">{children}</h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              a: ({ children, href }) => (
                <a
                  className="cursor-pointer font-semibold text-primary underline"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),

              hr: ({ children }) => <hr className="invisible">{children}</hr>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="flex items-center gap-1">
          <img
            src={iconClock8}
            alt="timestamp"
            title="timestamp"
            className="h-4"
          />
          <p className="text-[11px] whitespace-pre-wrap text-left">
            {timestamp}
          </p>
        </div>
      </div>
      {isUser && (
        <img
          src={avatar}
          alt="user"
          title="user"
          className="h-8 w-8 rounded-full"
        />
      )}
    </div>
  );
}
