import { useCallback, useMemo } from "react";
import { usePaddle } from "../hooks/usePaddle";
import { Button } from "primereact/button";

export default function PaddleCheckoutButton(props) {
  const { paddle, ready } = usePaddle();

  const label = useMemo(() => {
    return props.mode === "price" ? "Comprar ahora" : "Pagar transacción";
  }, [props.mode]);

  const openCheckout = useCallback(async () => {
    if (!ready || !paddle) return;

    try {
      if (props.mode === "price") {
        const {
          priceId,
          quantity = 1,
          customerId,
          email,
          customData,
          successUrl = window.location.origin + "/gracias",
          locale = "es",
          onOpened,
          onClosed,
        } = props;

        await paddle.Checkout.open({
          items: [{ priceId, quantity }],
          customer: customerId
            ? { id: customerId }
            : email
            ? { email }
            : undefined,
          customData,
          settings: {
            displayMode: "overlay",
            locale,
            theme: "light",
            successUrl,
            allowLogout: !customerId ? false : true,
            opened: onOpened,
            closed: onClosed,
          },
        });
      } else {
        const {
          transactionId,
          successUrl = window.location.origin + "/gracias",
          locale = "es",
          onOpened,
          onClosed,
        } = props;

        await paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            locale,
            theme: "light",
            successUrl,
            opened: onOpened,
            closed: onClosed,
          },
        });
      }
    } catch (err) {
      console.error("Paddle Checkout error:", err);
      // Pista útil: muchas veces aquí verás "domain not allowed" o "invalid token"
    }
  }, [ready, paddle, props]);

  return (
    <Button
      className="plan-button secondary"
      onClick={openCheckout}
      disabled={!ready}
      label={ready ? label : "Cargando pago..."}
    />
  );
}
