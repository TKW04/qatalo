import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "primereact/image";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import {
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircle,
  ShoppingCart,
  X,
} from "lucide-react";

import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

import { customerActions } from "../store/customer-store/customer-slice";
import { GetPaymentMethodsByBusinessId } from "../store/paymentMethod-store/paymentMethod-actions";
import { useNotification } from "./UI/NotificationProvider";
import DialogModal from "./DialogModal";
import "../styles/components.css";
import { CreateCustomer } from "../store/customer-store/customer-actions";
import Loading from "./UI/Loading";

let once = true;
const ProductModal = ({ product, business, onClose }) => {
  const dispatch = useDispatch();
  const { showError, showSuccess, showWarning } = useNotification();

  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const paymentMethods = useSelector(
    (state) => state.paymentMethod.paymentMethods
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const customer = useSelector((state) => state.customer.customer);
  const [action, setAction] = useState("whatsapp");
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  useEffect(() => {
    if (once) {
      dispatch(GetPaymentMethodsByBusinessId(business.business_id, showError));
      once = false;
    }
  }, [dispatch, business.id]);

  const productTemplate = (image) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            rounded
            icon={<ChevronLeftIcon color="white" size="2rem" />}
            className="image-arrow-left"
            onClick={(e) => e.stopPropagation() || instanceRef.current?.prev()}
          />
          <div className="image-carousel">
            <Image
              preview
              src={image}
              alt="image"
              width="100%"
              height="290"
              style={{ objectFit: "fill" }}
            />
          </div>
          <Button
            icon={<ChevronRightIcon color="white" size="2rem" />}
            className="image-arrow-right"
            onClick={(e) => e.stopPropagation() || instanceRef.current?.next()}
          />
        </div>
      </>
    );
  };

  const handleWhatsApp = () => {
    const catalogUrl = window.location.href;

    const message = `Hola, soy ${customer.given_name || "el cliente"} ${
      customer.family_name || ""
    }, estoy interesad@ en "${
      product.name
    }". Lo vi en tu catálogo: ${catalogUrl}`;
    const whatsappUrl = `https://wa.me/${
      business.phone
    }?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const onCreate = (action) => {
    setShowCustomerDialog(false);
    if (action === "whatsapp") {
      handleWhatsApp();
    }
    if (action === "buy") {
      setShowBuyDialog(true);
    }
  };
  const onBuy = () => {
    const customerCreate = {
      ...customer,
      business_id: business.business_id,
      transaction: {
        product_id: product.product_id,
        product_name: product.name,
        quantity: customer.transaction_quantity,
        price: product.price,
        status: "pending",
        payment_method: {
          payment_method_id: paymentMethods.find(
            (pm) => pm.payment_method_id === paymentMethod.code
          )?.payment_method_id,
          payment_type: paymentMethods.find(
            (pm) => pm.payment_method_id === paymentMethod.code
          )?.payment_type,
          currency: product.currency,
        },
      },
    };
    setIsLoading(true);
    setLoadingMessage("Creando Solicitud...");
    dispatch(CreateCustomer(customerCreate, showWarning, showSuccess));

    setTimeout(() => {
      setShowCustomerDialog(false);
      setShowBuyDialog(false);
      setShowPaymentDialog(true);
      setIsLoading(false);
    }, 4500);
  };

  const handleCustomerCreation = (customer_action) => {
    setAction(customer_action);
    setShowCustomerDialog(true);
  };

  const formatted = Number(product.price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <div className="modal-overlay" onClick={handleOverlayClick}>
        {/* Modal de creacion de usuario */}
        <DialogModal
          title={"Información del Cliente"}
          visible={showCustomerDialog}
          onHide={() => setShowCustomerDialog(false)}
        >
          <div style={{ width: "100%", textAlign: "left" }}>
            <div className="field col">
              <label>Nombre</label>
              <InputText
                type="text"
                className="input"
                value={customer.given_name}
                onChange={(e) => {
                  dispatch(
                    customerActions.modifyPropertyValue({
                      id: "given_name",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="Juan"
              />
            </div>
            <div className="field col">
              <label>Apellido</label>
              <InputText
                type="text"
                className="input"
                value={customer.family_name}
                onChange={(e) => {
                  dispatch(
                    customerActions.modifyPropertyValue({
                      id: "family_name",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="Pérez"
              />
            </div>
            <div className="field col">
              <label>Correo Electrónico</label>
              <InputText
                type="text"
                className="input"
                value={customer.email}
                onChange={(e) => {
                  dispatch(
                    customerActions.modifyPropertyValue({
                      id: "email",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="juan@example.com"
              />
            </div>
            <div className="field col">
              <label>Teléfono</label>
              <InputText
                type="text"
                className="input"
                value={customer.phone}
                onChange={(e) => {
                  dispatch(
                    customerActions.modifyPropertyValue({
                      id: "phone",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="809-555-1234"
              />
            </div>
            <div className="flex justify-content-end">
              <Button
                className="btn btn-primary"
                label="Continuar"
                icon={<Check />}
                onClick={() => onCreate(action)}
                style={{ width: "100px", margin: "2px" }}
              />
              <Button
                className="btn btn-danger"
                label="Cancelar"
                icon={<X />}
                onClick={() => setShowDialog(false)}
                style={{ width: "100px", margin: "2px" }}
              />
            </div>
          </div>
        </DialogModal>
        {/* Modal de compra */}
        <DialogModal
          title={"Forma de pago"}
          visible={showBuyDialog}
          onHide={() => setShowBuyDialog(false)}
        >
          <div style={{ width: "100%", textAlign: "left" }}>
            <div className="field col">
              <label className="form-label">Metodo de pago</label>
              <Dropdown
                value={paymentMethod}
                className="input"
                onChange={(e) => {
                  setPaymentMethod(e.value);
                }}
                options={paymentMethods.map((method) => ({
                  name:
                    method.payment_type === "bank_transfer"
                      ? "Transferencia Bancaria"
                      : "Link de Pago",
                  code: method.payment_method_id,
                }))}
                optionLabel="name"
                placeholder="Seleccionar metodo de pago"
              />
            </div>
            <div className="field col">
              <label>Cantidad</label>
              <InputText
                className="input"
                value={customer.transaction_quantity}
                onChange={(e) => {
                  if (!isNaN(e.target.value)) {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "transaction_quantity",
                        value: e.target.value,
                      })
                    );
                  }
                }}
              />
            </div>
            <div className="flex justify-content-end">
              <Button
                disabled={!paymentMethod}
                className={`btn ${
                  paymentMethod ? "btn-success" : "btn-disabled"
                }`}
                label="Guardar"
                icon={<Check />}
                onClick={() => onBuy()}
                style={{ width: "100px", margin: "2px" }}
              />
              <Button
                className="btn btn-danger"
                label="Cancelar"
                icon={<X />}
                onClick={() => setShowBuyDialog(false)}
                style={{ width: "100px", margin: "2px" }}
              />
            </div>
          </div>
        </DialogModal>
        {/* Modal de información */}
        <DialogModal
          title={"Solicitud Enviada"}
          visible={showPaymentDialog}
          onHide={() => setShowPaymentDialog(false)}
        >
          <div style={{ width: "100%", textAlign: "left" }}>
            <p>
              Su solicitud ha sido enviada con éxito. En breve recibirá una
              notificación.
            </p>
            <p>Gracias por su preferencia.</p>
            <div className="flex justify-content-center">
              <Button
                className="btn btn-danger"
                label="Cerrar"
                icon={<X />}
                onClick={() => {
                  setShowPaymentDialog(false);
                  onClose();
                }}
                style={{ width: "100px", margin: "2px" }}
              />
            </div>
          </div>
        </DialogModal>
        <div className="modal-content product-modal-content">
          <div className="product-modal-header">
            <div className="navigation-wrapper">
              <div
                ref={sliderRef}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0px",
                  margin: "0px",
                  width: "100%",
                }}
              >
                {product.imagesUrl.map((imgObj, index) => (
                  <div className="keen-slider__slide number-slide1" key={index}>
                    {productTemplate(imgObj.image)}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="product-modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <div className="product-modal-body">
            <h2 className="product-modal-title">{product.name}</h2>
            <div className="product-modal-price">
              {product.currency} {formatted}
            </div>

            {product.description && (
              <p className="product-modal-description">{product.description}</p>
            )}

            <div className="product-modal-actions">
              {product.is_available === "available" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "12px",
                  }}
                >
                  <Button
                    icon={<ShoppingCart size={40} />}
                    style={{ width: "100%" }}
                    className="btn btn-primary"
                    label="Comprar"
                    onClick={() => handleCustomerCreation("buy")}
                  />
                  <Button
                    style={{ width: "100%" }}
                    icon={<MessageCircle size={40} />}
                    className="btn btn-whatsapp"
                    label="Contactar por WhatsApp"
                    onClick={() => handleCustomerCreation("whatsapp")}
                  />
                </div>
              )}
              {product.is_available === "unavailable" && (
                <Button
                  style={{ width: "100%" }}
                  className="btn"
                  label="Producto agotado"
                  disabled
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
