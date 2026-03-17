import { Typewriter } from "react-simple-typewriter";
import { ChatInput } from "../chat/ChatInput";

export function EmptyChat() {
  return (
    <div className="mx-auto flex min-h-[calc(90vh-260px)] w-full max-w-5xl flex-col justify-center px-3 md:px-0">
      <h1 className="material-enter-up material-delay-1 mb-6 ml-4 text-left text-3xl font-light text-foreground">
        Porozmawiaj z{" "}
        <span className="bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-80% bg-clip-text text-transparent font-semibold">
          fotAI
        </span>{" "}
        o fotografii
      </h1>
      <h2 className="material-enter-soft material-delay-2 mb-6 ml-4 bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-80% bg-clip-text text-left text-5xl font-medium text-transparent">
        <span className="text-foreground">Jak </span>

        <Typewriter
          words={[
            "robić ostre zdjęcia?",
            "fotografować ludzi w plenerze?",
            "upiększyć zdjęcia z wakacji?",
            "uzyskać rozmyte tło na zdjęciu?",
            "poprawnie ustawić balans bieli?",
            "robić zdjęcia w ostrym słońcu?",
            "fotografować zwierzęta w ruchu?",
            "fotografować krajobraz?",
            "robić zdjęcia nocne?",
            "dbać o aparat zimą?",
            "używać statywu?",
            "ustawiać przysłonę do portretu?",
            "szukać inspiracji do zdjęć?",
            "robić zdjęcia z drona?",
            "przewozić aparat w samolocie?",
            "wybrać najlepszy obiektyw?",
            "czytać histogram?",
            "robić zdjęcia makro?",
          ]}
          typeSpeed={80}
          deleteSpeed={20}
          loop={true}
          cursor={true}
          cursorBlinking={true}
        />
      </h2>
      <div className="material-enter-up material-delay-3 sticky">
        <ChatInput />
      </div>
    </div>
  );
}
