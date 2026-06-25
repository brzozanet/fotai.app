import { ChatInput } from "../chat/ChatInput";
import { MessageList } from "../chat/MessageList";

export function ChatWindow() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl py-5">
          <MessageList />
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl pb-4">
        <ChatInput />
      </div>
    </div>
  );
}
