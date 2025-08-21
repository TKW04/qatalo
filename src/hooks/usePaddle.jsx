import { useEffect, useRef, useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";

export function usePaddle() {
  const [ready, setReady] = useState(false);
  const paddleRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (paddleRef.current) return;

      const env = import.meta.env.VITE_APP_PADDLE_ENV || "sandbox";
      const token = import.meta.env.VITE_APP_PADDLE_TOKEN;
      

      try {
        const paddle = await initializePaddle({
          environment: env,
          token,
        });
        if (!mounted) return;
        paddleRef.current = paddle;
        setReady(true);
      } catch (err) {
        console.error("Error inicializando Paddle:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { paddle: paddleRef.current, ready };
}
