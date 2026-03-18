import dotenv from "dotenv";
import readline from "node:readline";
import { OpenRouter } from "@openrouter/sdk";

interface Message {
  role: "user" | "assistant";
  content: [{ type: "text"; text: string }];
}

dotenv.config();

const consoleReader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string) =>
  new Promise<string>((resolve) => consoleReader.question(question, resolve));

async function openchat() {
  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const messages: Message[] = [];

  console.log(
    `
      🚀 Rozpocznij rozmowę zadając pytania
      💡 Czatbot pamięta całą historię rozmowy, aż jej nie zakończysz
      ❌ Aby zakończyć rozmowę, napisz "koniec"
    `,
  );

  while (true) {
    const userInput = await ask("Ty: ");

    if (userInput.toLowerCase() === "koniec") {
      console.log("Do zobaczenia!");
      break;
    }

    // NOTE: dodaje pytanie użytkownika do historii rozmowy
    messages.push({
      role: "user",
      content: [{ type: "text", text: userInput }],
    });

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: "openai/gpt-5.3-chat",
        messages,
        stream: true,
      },
    });

    let assistantReply = "";

    for await (const chunk of stream) {
      const part = chunk.choices[0]?.delta?.content;
      if (part) {
        assistantReply = assistantReply + part;
        // assistantText += part;
        // process.stdout.write(part);
      }
    }
    console.log(`AI: ${assistantReply}`);

    // NOTE: dodaje odpowiedź asystenta do historii rozmowy
    messages.push({
      role: "assistant",
      content: [{ type: "text", text: assistantReply }],
    });
  }

  consoleReader.close();
}

openchat().catch((error) => {
  console.error("App crashed successfully 😆", error);
  consoleReader.close();
});
